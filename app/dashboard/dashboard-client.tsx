"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  ListOrdered,
  Scale,
  Settings,
  LogOut,
  Ghost,
  Menu,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Circle,
  Minimize2,
  Maximize2,
  Filter
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- FUNKCJE POMOCNICZE ---

const formatCurrency = (amount: number) => {
  if (amount === 0) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pl-PL");
  } catch {
    return dateStr;
  }
};

const safeDate = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date();
        return d;
    } catch {
        return new Date();
    }
}

const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- LOGIKA BIZNESOWA ---

const shouldIncludeTransaction = (t: any, currentMonthKey: string) => {
  const tDate = safeDate(t.date);
  const tMonthKey = getMonthKey(tDate);
  
  if (tMonthKey < currentMonthKey) {
    // Przeszłość: Tylko DONE, Import lub Archiwalne
    return t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true; 
  } else {
    // Przyszłość/Teraźniejszość: Tylko PLANNED
    return t.transaction_type === 'planned';
  }
};

type DashboardClientProps = {
  userEmail: string;
  transactions: any[];
  accounts: any[];
  categories: any[];
  weightLogs: any[];
  rules: any[];
};

// Typ dla informacji o klikniętej komórce
type CellInfo = {
  monthKey: string;
  monthLabel: string;
  categoryPath: string[];
  categoryId: string;
  doneCount: number;
  plannedCount: number;
  doneSum: number;
  plannedSum: number;
  transactions: any[]; // Pełne dane transakcji
};

export default function DashboardClient({
  userEmail,
  transactions,
  accounts,
  categories,
  weightLogs,
  rules,
}: DashboardClientProps) {
  const [activeView, setActiveView] = useState("p1");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // STAN DATY
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthOffset, setMonthOffset] = useState(0);

  // STAN ROZWIJANIA KATEGORII
  // Przechowujemy ID kategorii, które są rozwinięte
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  
  // STAN FILTROWANIA KATEGORII
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  // STAN KLIKNIĘTEJ KOMÓRKI
  const [clickedCell, setClickedCell] = useState<CellInfo | null>(null);
  const [isCellInfoExpanded, setIsCellInfoExpanded] = useState(false);
  
  // STAN SORTOWANIA I FILTROWANIA TRANSAKCJI
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionFilter, setTransactionFilter] = useState('');
  
  // STAN TOGGLE BUTTON (assigned/unassigned transactions)
  const [showUnassigned, setShowUnassigned] = useState(false);
  
  // STAN ZAZNACZONYCH TRANSAKCJI (dla przypisywania do kategorii)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [assignToCategoryId, setAssignToCategoryId] = useState<string>('');
  const [categorySearchFilter, setCategorySearchFilter] = useState<string>('');
  
  // STAN EDYCJI TRANSAKCJI
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    transaction_type: 'planned',
    amount: '',
    payee: '',
    description: '',
    origin: '',
    source: '',
    category: '',
  });
  
  // Flaga wskazująca czy stan został już załadowany - używamy ref aby uniknąć re-renderów
  const stateLoadedRef = React.useRef(false);

  // Efekt: Na starcie załaduj stan z localStorage lub z bazy danych
  useEffect(() => {
      // Wykonuj tylko raz - używamy ref zamiast state
      if (stateLoadedRef.current || categories.length === 0) {
          console.log('⏭️ Skipping state load - already loaded or no categories');
          return;
      }
      
      // Oznacz że rozpoczęliśmy ładowanie (przed jakimkolwiek async kodem)
      stateLoadedRef.current = true;
      console.log('🚀 Starting state load...');
      
      // Spróbuj załadować zapisany stan z localStorage
      const savedState = localStorage.getItem('dashboardState');
      
      if (savedState) {
          try {
              const parsed = JSON.parse(savedState);
              
              console.log('🔄 Restoring dashboard state:', parsed);
              
              // Przywróć rozwinięte kategorie
              if (parsed.expandedCats && Array.isArray(parsed.expandedCats)) {
                  console.log('📂 Restoring expanded categories:', parsed.expandedCats);
                  setExpandedCats(new Set(parsed.expandedCats));
              }
              
              // Przywróć offset miesięcy
              if (typeof parsed.monthOffset === 'number') {
                  setMonthOffset(parsed.monthOffset);
              }
              
              // Przywróć filtr kategorii
              if (parsed.categoryFilter) {
                  setCategoryFilter(parsed.categoryFilter);
              }
              
              // Przywróć stan panelu transakcji
              if (parsed.clickedCell) {
                  // Odtwórz clickedCell - musimy ponownie pobrać transakcje z bazy
                  const categoryId = parsed.clickedCell.categoryId;
                  const monthKey = parsed.clickedCell.monthKey;
                  const monthLabel = parsed.clickedCell.monthLabel;
                  
                  // Wywołaj handleCellClick aby odtworzyć pełny stan
                  setTimeout(() => {
                      handleCellClick(categoryId, monthKey, monthLabel);
                      
                      // Przywróć pozostałe ustawienia panelu
                      if (typeof parsed.isCellInfoExpanded === 'boolean') {
                          setIsCellInfoExpanded(parsed.isCellInfoExpanded);
                      }
                      if (typeof parsed.showUnassigned === 'boolean') {
                          setShowUnassigned(parsed.showUnassigned);
                      }
                      if (parsed.transactionFilter) {
                          setTransactionFilter(parsed.transactionFilter);
                      }
                      if (parsed.categorySearchFilter) {
                          setCategorySearchFilter(parsed.categorySearchFilter);
                      }
                      if (parsed.assignToCategoryId) {
                          setAssignToCategoryId(parsed.assignToCategoryId);
                      }
                      // Przywróć sortowanie
                      if (parsed.sortColumn) {
                          setSortColumn(parsed.sortColumn);
                      }
                      if (parsed.sortDirection) {
                          setSortDirection(parsed.sortDirection);
                      }
                  }, 100);
              }
              
              // Wyczyść zapisany stan po przywróceniu (jednorazowe użycie)
              localStorage.removeItem('dashboardState');
              console.log('✅ Dashboard state restored and cleared from localStorage');
              
          } catch (error) {
              console.error('❌ Error parsing saved dashboard state:', error);
              // Jeśli błąd parsowania, załaduj domyślny stan
              const initialExpanded = new Set<string>();
              categories.forEach(c => {
                  if (c.is_expanded) initialExpanded.add(c.id);
              });
              setExpandedCats(initialExpanded);
          }
      } else {
          console.log('ℹ️ No saved state found, loading default from database');
          // Jeśli nie ma zapisanego stanu, załaduj domyślny z bazy danych
          const initialExpanded = new Set<string>();
          categories.forEach(c => {
              if (c.is_expanded) initialExpanded.add(c.id);
          });
          setExpandedCats(initialExpanded);
      }
      
      console.log('✅ State loading completed');
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);
  
  // Efekt: Automatycznie wybierz pierwszą kategorię z przefiltrowanej listy
  useEffect(() => {
      if (categorySearchFilter.trim()) {
          const filtered = getFilteredAndSortedCategories();
          if (filtered.length > 0) {
              setAssignToCategoryId(filtered[0].id);
          } else {
              setAssignToCategoryId('');
          }
      } else {
          setAssignToCategoryId('');
      }
  }, [categorySearchFilter, categories]);

  const toggleCategory = (catId: string) => {
      const newSet = new Set(expandedCats);
      if (newSet.has(catId)) {
          newSet.delete(catId);
      } else {
          newSet.add(catId);
      }
      setExpandedCats(newSet);
  };

  // Funkcja do budowania ścieżki kategorii (parent -> child -> subchild)
  const getCategoryPath = (categoryId: string): string[] => {
    const path: string[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const cat = categories.find(c => c.id === currentId);
      if (cat) {
        path.unshift(cat.name);
        currentId = cat.parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  // Funkcja pomocnicza do zbierania wszystkich ID kategorii (włącznie z dziećmi)
  const getAllCategoryIds = (categoryId: string): string[] => {
    const ids = [categoryId];
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      const children = categories.filter(c => c.parent === categoryId);
      children.forEach(child => {
        ids.push(...getAllCategoryIds(child.id));
      });
    }
    
    return ids;
  };

  // Funkcja do obsługi kliknięcia komórki
  const handleCellClick = (categoryId: string, monthKey: string, monthLabel: string) => {
    // Zbierz wszystkie ID kategorii (włącznie z dziećmi)
    const allCategoryIds = getAllCategoryIds(categoryId);
    
    // ZMIANA: Pokazujemy WSZYSTKIE transakcje dla danej kategorii i miesiąca,
    // niezależnie od logiki shouldIncludeTransaction używanej w tabeli
    const categoryTransactions = transactions.filter(t => {
      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const matchedCategory = categories.find(c => 
        c.id === t.category || 
        c.name.toLowerCase().trim() === transCategoryName 
      );
      
      if (matchedCategory && allCategoryIds.includes(matchedCategory.id)) {
        const tMonthKey = getMonthKey(safeDate(t.date));
        // Zwracamy wszystkie transakcje z danego miesiąca
        return tMonthKey === monthKey;
      }
      return false;
    });
    
    // Policz transakcje DONE i PLANNED
    const doneTransactions = categoryTransactions.filter(t => 
      t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true
    );
    const plannedTransactions = categoryTransactions.filter(t => 
      t.transaction_type === 'planned'
    );
    
    // Oblicz sumy
    const doneSum = doneTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const plannedSum = plannedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Ustaw informacje o klikniętej komórce
    setClickedCell({
      monthKey,
      monthLabel,
      categoryPath: getCategoryPath(categoryId),
      categoryId,
      doneCount: doneTransactions.length,
      plannedCount: plannedTransactions.length,
      doneSum,
      plannedSum,
      transactions: categoryTransactions,
    });
    
    // Resetuj filtr i sortowanie przy nowym kliknięciu
    setTransactionFilter('');
    setSortColumn('date');
    setSortDirection('desc');
  };
  
  // Funkcja sortowania transakcji
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Filtrowanie i sortowanie transakcji
  const getFilteredAndSortedTransactions = () => {
    if (!clickedCell) return [];
    
    let filtered = showUnassigned 
      ? getUnassignedTransactionsForMonth(clickedCell.monthKey)
      : clickedCell.transactions;
    
    // Filtrowanie
    if (transactionFilter.trim()) {
      const filterLower = transactionFilter.toLowerCase();
      filtered = filtered.filter(t => 
        Object.values(t).some(val => 
          String(val).toLowerCase().includes(filterLower)
        )
      );
    }
    
    // Sortowanie
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Obsługa dat
      if (sortColumn === 'date' || sortColumn === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      // Obsługa liczb
      if (sortColumn === 'amount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      // Obsługa stringów
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };
  
  // Funkcja do pobierania transakcji nieprzypisanych dla danego miesiąca
  const getUnassignedTransactionsForMonth = (monthKey: string) => {
    return transactions.filter(t => {
      const tMonthKey = getMonthKey(safeDate(t.date));
      
      // Sprawdź czy transakcja jest z odpowiedniego miesiąca
      if (tMonthKey !== monthKey) return false;
      
      // Sprawdź czy transakcja nie ma przypisanej kategorii
      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const hasCategory = categories.some(c => 
        c.id === t.category || 
        c.name.toLowerCase().trim() === transCategoryName 
      );
      
      return !hasCategory || !t.category || t.category === '';
    });
  };
  
  // Funkcja do zaznaczania/odznaczania transakcji
  const toggleTransactionSelection = (transactionId: string) => {
    const newSet = new Set(selectedTransactionIds);
    if (newSet.has(transactionId)) {
      newSet.delete(transactionId);
    } else {
      newSet.add(transactionId);
    }
    setSelectedTransactionIds(newSet);
  };
  
  // Funkcja do zaznaczania/odznaczania wszystkich transakcji
  const toggleAllTransactions = () => {
    const visibleTransactions = getFilteredAndSortedTransactions();
    if (selectedTransactionIds.size === visibleTransactions.length) {
      // Jeśli wszystkie są zaznaczone, odznacz wszystkie
      setSelectedTransactionIds(new Set());
    } else {
      // Zaznacz wszystkie widoczne
      const allIds = new Set(visibleTransactions.map(t => t.id));
      setSelectedTransactionIds(allIds);
    }
  };
  
  // Funkcja do filtrowania i sortowania kategorii dla dropdown
  const getFilteredAndSortedCategories = () => {
    // Funkcja pomocnicza do sprawdzania czy kategoria lub jej dzieci pasują do filtra
    const categoryMatchesFilter = (cat: any, searchTerm: string): boolean => {
      if (!searchTerm) return true;
      
      const lowerSearch = searchTerm.toLowerCase();
      
      // Sprawdź czy nazwa tej kategorii pasuje
      if (cat.name.toLowerCase().includes(lowerSearch)) {
        return true;
      }
      
      // Sprawdź czy któreś z dzieci pasuje
      const children = categories.filter(c => c.parent === cat.id);
      return children.some(child => categoryMatchesFilter(child, searchTerm));
    };
    
    // Filtruj kategorie
    let filtered = categories.filter(cat => {
      // Wyklucz kategorie z is_expanded (kategorie nadrzędne - nie można do nich przypisywać transakcji)
      if (cat.is_expanded === true) {
        return false;
      }
      
      // Wyklucz kategorie najwyższego poziomu (parent === null)
      if (cat.parent === null) {
        return false;
      }
      
      // Filtruj według wyszukiwania
      return categoryMatchesFilter(cat, categorySearchFilter);
    });
    
    // Sortuj alfabetycznie według pełnej ścieżki (rosnąco)
    filtered = filtered.sort((a, b) => {
      const pathA = getCategoryPath(a.id).join(' > ').toLowerCase();
      const pathB = getCategoryPath(b.id).join(' > ').toLowerCase();
      return pathA.localeCompare(pathB, 'pl');
    });
    
    return filtered;
  };
  
  // Funkcja do przypisywania zaznaczonych transakcji do kategorii
  const handleAssignToCategory = async () => {
    if (!assignToCategoryId || selectedTransactionIds.size === 0) {
      alert('Wybierz kategorię i zaznacz co najmniej jedną transakcję');
      return;
    }
    
    // Znajdź nazwę kategorii dla użytkownika
    const selectedCategory = categories.find(c => c.id === assignToCategoryId);
    const categoryPath = selectedCategory ? getCategoryPath(assignToCategoryId).join(' → ') : assignToCategoryId;
    
    // Pokaż informację o rozpoczęciu procesu
    const transactionCount = selectedTransactionIds.size;
    const confirmMessage = `Czy na pewno chcesz przypisać ${transactionCount} transakcji do kategorii:\n"${categoryPath}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Wywołaj API do aktualizacji transakcji
      const response = await fetch('/api/transactions/assign-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactionIds),
          categoryId: assignToCategoryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign category');
      }

      // Sukces - zapisz pełny stan przed odświeżeniem
      const stateToSave = {
        expandedCats: Array.from(expandedCats),
        monthOffset: monthOffset,
        categoryFilter: categoryFilter,
        // Stan panelu transakcji
        clickedCell: clickedCell,
        isCellInfoExpanded: isCellInfoExpanded,
        showUnassigned: showUnassigned,
        transactionFilter: transactionFilter,
        categorySearchFilter: categorySearchFilter,
        assignToCategoryId: assignToCategoryId,
        // Stan sortowania
        sortColumn: sortColumn,
        sortDirection: sortDirection,
      };
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
      
      // Pokaż komunikat
      alert(`✅ Sukces!\n\nPrzypisano ${result.updatedCount} transakcji do kategorii:\n"${categoryPath}"\n\nStrona zostanie odświeżona.`);
      
      // Odśwież stronę aby załadować zaktualizowane dane
      window.location.reload();
      
    } catch (error) {
      console.error('Error assigning category:', error);
      alert(`❌ Błąd podczas przypisywania kategorii:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  };
  
  // Funkcja do odłączania zaznaczonych transakcji od kategorii
  const handleUnlinkFromCategory = async () => {
    if (selectedTransactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const transactionCount = selectedTransactionIds.size;
    const confirmMessage = `Czy na pewno chcesz odłączyć ${transactionCount} transakcji od kategorii?\n\nTransakcje staną się nieprzypisane.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Wywołaj API do odłączenia transakcji
      const response = await fetch('/api/transactions/unlink-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactionIds),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unlink transactions');
      }

      // Sukces - zapisz pełny stan przed odświeżeniem
      const stateToSave = {
        expandedCats: Array.from(expandedCats),
        monthOffset: monthOffset,
        categoryFilter: categoryFilter,
        clickedCell: clickedCell,
        isCellInfoExpanded: isCellInfoExpanded,
        showUnassigned: showUnassigned,
        transactionFilter: transactionFilter,
        categorySearchFilter: categorySearchFilter,
        assignToCategoryId: assignToCategoryId,
        // Stan sortowania
        sortColumn: sortColumn,
        sortDirection: sortDirection,
      };
      
      console.log('💾 Saving state before reload (unlink):', stateToSave);
      console.log('📂 Expanded categories to save:', Array.from(expandedCats));
      console.log('🔀 Sort settings to save:', { sortColumn, sortDirection });
      
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
      
      // Weryfikacja zapisu
      const savedCheck = localStorage.getItem('dashboardState');
      console.log('✓ Verification - state saved to localStorage:', savedCheck ? 'YES' : 'NO');
      if (savedCheck) {
        const parsed = JSON.parse(savedCheck);
        console.log('✓ Expanded cats in saved state:', parsed.expandedCats);
      }
      
      // Pokaż komunikat
      alert(`✅ Sukces!\n\nOdłączono ${result.updatedCount} transakcji od kategorii.\n\nStrona zostanie odświeżona.`);
      
      // Odśwież stronę aby załadować zaktualizowane dane
      window.location.reload();
      
    } catch (error) {
      console.error('Error unlinking transactions:', error);
      alert(`❌ Błąd podczas odłączania transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  };
  
  // Funkcja do usuwania zaznaczonych transakcji
  const handleDeleteTransactions = async () => {
    if (selectedTransactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const transactionCount = selectedTransactionIds.size;
    const confirmMessage = `❗ UWAGA ❗\n\nCzy na pewno chcesz TRWALE USUNĄĆ ${transactionCount} transakcji?\n\nTej operacji NIE MOŻNA cofnąć!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Dodatkowe potwierdzenie dla bezpieczeństwa
    const doubleConfirm = confirm(`Potwierdź ponownie:\n\nUsuwam ${transactionCount} transakcji bezpowrotnie.`);
    if (!doubleConfirm) {
      return;
    }
    
    try {
      // Wywołaj API do usunięcia transakcji
      const response = await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactionIds),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transactions');
      }

      // Sukces - zapisz pełny stan przed odświeżeniem
      const stateToSave = {
        expandedCats: Array.from(expandedCats),
        monthOffset: monthOffset,
        categoryFilter: categoryFilter,
        clickedCell: clickedCell,
        isCellInfoExpanded: isCellInfoExpanded,
        showUnassigned: showUnassigned,
        transactionFilter: transactionFilter,
        categorySearchFilter: categorySearchFilter,
        assignToCategoryId: assignToCategoryId,
        // Stan sortowania
        sortColumn: sortColumn,
        sortDirection: sortDirection,
      };
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
      
      // Pokaż komunikat
      alert(`✅ Sukces!\n\nUsunięto ${result.deletedCount} transakcji.\n\nStrona zostanie odświeżona.`);
      
      // Odśwież stronę aby załadować zaktualizowane dane
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert(`❌ Błąd podczas usuwania transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  };
  
  // Funkcja do edycji zaznaczonych transakcji
  const handleEditTransactions = () => {
    if (selectedTransactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    // Pobierz zaznaczone transakcje
    const selectedTransactions = getFilteredAndSortedTransactions().filter(t => 
      selectedTransactionIds.has(t.id)
    );
    
    // Dla pojedynczej transakcji - otwórz dialog edycji
    if (selectedTransactions.length === 1) {
      const transaction = selectedTransactions[0];
      setEditingTransaction(transaction);
      
      // Format daty dla input type="date" (YYYY-MM-DD)
      const dateObj = new Date(transaction.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      setEditFormData({
        date: formattedDate,
        transaction_type: transaction.transaction_type || 'planned',
        amount: String(transaction.amount || ''),
        payee: transaction.payee || '',
        description: transaction.description || '',
        origin: transaction.origin || '',
        source: transaction.source || '',
        category: transaction.category || '',
      });
      
      setIsEditDialogOpen(true);
    } else {
      // Dla wielu transakcji
      alert(`📝 Edycja wielu transakcji:\n\nZaznaczono: ${selectedTransactions.length} transakcji\n\n⚠️ Edycja wielu transakcji jednocześnie nie jest dostępna.\n\nMożesz:\n- Zmienić kategorię dla wszystkich (użyj funkcji przypisania)\n- Usunąć (użyj przycisku Delete)\n- Odłączyć od kategorii (użyj przycisku Unlink)\n- Edytować pojedynczo (zaznacz tylko jedną transakcję)`);
    }
  };
  
  // Funkcja do zapisywania edytowanej transakcji
  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    try {
      // Wywołaj API do aktualizacji transakcji
      const response = await fetch('/api/transactions/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: editingTransaction.id,
          updates: editFormData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction');
      }

      // Sukces - zapisz pełny stan przed odświeżeniem
      const stateToSave = {
        expandedCats: Array.from(expandedCats),
        monthOffset: monthOffset,
        categoryFilter: categoryFilter,
        clickedCell: clickedCell,
        isCellInfoExpanded: isCellInfoExpanded,
        showUnassigned: showUnassigned,
        transactionFilter: transactionFilter,
        categorySearchFilter: categorySearchFilter,
        assignToCategoryId: assignToCategoryId,
        sortColumn: sortColumn,
        sortDirection: sortDirection,
      };
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
      
      // Zamknij dialog
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      
      // Pokaż komunikat
      alert(`✅ Sukces!\n\nTransakcja została zaktualizowana.\n\nStrona zostanie odświeżona.`);
      
      // Odśwież stronę aby załadować zaktualizowane dane
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert(`❌ Błąd podczas aktualizacji transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  };
  
  // Reset stanu przy zmianie toggle
  const handleToggleChange = () => {
    setShowUnassigned(!showUnassigned);
    setSelectedTransactionIds(new Set());
    setAssignToCategoryId('');
    setTransactionFilter('');
  };

  // --- OBLICZENIA PIVOT TABLE ---
  const pivotData = useMemo(() => {
    const today = new Date();
    const currentMonthKey = getMonthKey(today);

    // 1. Kolumny
    const columns: Array<{ date: Date; key: string; label: string }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(selectedYear, 0 + monthOffset + i, 1);
      columns.push({
        date: d,
        key: getMonthKey(d),
        label: d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' })
      });
    }

    // 2. Mapa wartości BEZPOŚREDNICH (Direct Values)
    // To są kwoty przypisane konkretnie do danej kategorii (bez dzieci)
    const directValuesMap: Record<string, Record<string, number>> = {};
    
    transactions.forEach(t => {
        const transCategoryName = (t.category || "").toString().trim().toLowerCase();
        const matchedCategory = categories.find(c => 
            c.id === t.category || 
            c.name.toLowerCase().trim() === transCategoryName 
        );

        if (matchedCategory) {
            if (shouldIncludeTransaction(t, currentMonthKey)) {
                const catId = matchedCategory.id;
                const monthKey = getMonthKey(safeDate(t.date));

                if (!directValuesMap[catId]) directValuesMap[catId] = {};
                if (!directValuesMap[catId][monthKey]) directValuesMap[catId][monthKey] = 0;
                
                directValuesMap[catId][monthKey] += Number(t.amount);
            }
        }
    });

    // 3. Budowa drzewa
    const sortedCats = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const buildTree = (parentId: string | null): any[] => {
      return sortedCats
        .filter((c): c is typeof categories[0] => c.parent === parentId)
        .map((c): any => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    const categoryTree = buildTree(null);

    // 4. Mapa wartości CAŁKOWITYCH (Total Values - z rekurencją)
    // To tutaj dzieje się magia sumowania dzieci do rodzica
    const totalValuesMap: Record<string, Record<string, number>> = {};

    // Funkcja rekurencyjna która zwraca sumy dla danego węzła (swoje + dzieci)
    const calculateTotals = (node: any): Record<string, number> => {
        const nodeTotals: Record<string, number> = {};

        // Inicjalizacja zerami
        columns.forEach(col => nodeTotals[col.key] = 0);

        // Dodaj wartości bezpośrednie tego węzła
        if (directValuesMap[node.id]) {
            columns.forEach(col => {
                nodeTotals[col.key] += (directValuesMap[node.id][col.key] || 0);
            });
        }

        // Rekurencyjnie dodaj wartości dzieci
        if (node.children && node.children.length > 0) {
            node.children.forEach((child: any) => {
                const childTotals = calculateTotals(child);
                columns.forEach((col: { key: string }) => {
                    nodeTotals[col.key] += childTotals[col.key];
                });
            });
        }

        // Zapisz wynik w mapie globalnej
        totalValuesMap[node.id] = nodeTotals;
        return nodeTotals;
    };

    // Uruchom obliczanie dla wszystkich głównych gałęzi
    categoryTree.forEach((rootNode: any) => calculateTotals(rootNode));

    // 5. OBLICZ MONTHLY TOTALS - suma wszystkich transakcji dla każdego miesiąca
    // WAŻNE: Respektujemy shouldIncludeTransaction logic
    const monthlyTotals: Record<string, number> = {};
    columns.forEach((col: { key: string }) => monthlyTotals[col.key] = 0);

    transactions.forEach(t => {
        if (shouldIncludeTransaction(t, currentMonthKey)) {
            const monthKey = getMonthKey(safeDate(t.date));
            if (monthlyTotals[monthKey] !== undefined) {
                monthlyTotals[monthKey] += Number(t.amount);
            }
        }
    });

    // 6. OBLICZ CUMULATIVE TOTALS - suma narastająca OD POCZĄTKU BAZY DANYCH
    // Znajdź najstarszą transakcję w bazie
    let oldestDate: Date | null = null;
    transactions.forEach(t => {
        if (shouldIncludeTransaction(t, currentMonthKey)) {
            const tDate = safeDate(t.date);
            if (!oldestDate || tDate < oldestDate) {
                oldestDate = tDate;
            }
        }
    });

    // Oblicz wszystkie miesięczne sumy od najstarszej daty
    const allMonthlyTotals: Record<string, number> = {};
    if (oldestDate !== null) {
        // Stwórz tablicę wszystkich miesięcy od najstarszej daty do końca widocznych kolumn
        const startDate = new Date((oldestDate as Date).getFullYear(), (oldestDate as Date).getMonth(), 1);
        const endDate = columns.length > 0 ? columns[columns.length - 1].date : new Date();
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const key = getMonthKey(currentDate);
            allMonthlyTotals[key] = 0;
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }

        // Wypełnij wartościami z transakcji
        transactions.forEach(t => {
            if (shouldIncludeTransaction(t, currentMonthKey)) {
                const monthKey = getMonthKey(safeDate(t.date));
                if (allMonthlyTotals[monthKey] !== undefined) {
                    allMonthlyTotals[monthKey] += Number(t.amount);
                }
            }
        });
    }

    // Oblicz kumulację od początku czasu
    const cumulativeTotals: Record<string, number> = {};
    let runningTotal = 0;
    
    if (oldestDate !== null) {
        const startDate = new Date((oldestDate as Date).getFullYear(), (oldestDate as Date).getMonth(), 1);
        const endDate = columns.length > 0 ? columns[columns.length - 1].date : new Date();
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const key = getMonthKey(currentDate);
            runningTotal += allMonthlyTotals[key] || 0;
            cumulativeTotals[key] = runningTotal;
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
    }

    return { 
      columns, 
      totalValuesMap, 
      categoryTree, 
      monthlyTotals, 
      cumulativeTotals 
    };
  }, [transactions, categories, monthOffset, selectedYear]);


  // --- FUNKCJE ROZWIJANIA/ZWIJANIA ---
  const expandAllByOneLevel = () => {
    const newSet = new Set(expandedCats);
    categories.forEach(cat => {
      if (cat.parent === null) {
        // Rozwiń wszystkie kategorie główne (poziom 0)
        newSet.add(cat.id);
      }
    });
    setExpandedCats(newSet);
  };

  const collapseAllByOneLevel = () => {
    // Znajdź maksymalną głębokość rozwiniętych kategorii
    const getDepth = (catId: string): number => {
      const cat = categories.find(c => c.id === catId);
      if (!cat || !cat.parent) return 0;
      return 1 + getDepth(cat.parent);
    };

    const expandedWithDepth = Array.from(expandedCats).map(id => ({
      id,
      depth: getDepth(id)
    }));

    if (expandedWithDepth.length === 0) return;

    const maxDepth = Math.max(...expandedWithDepth.map(item => item.depth));
    
    // Usuń kategorie z maksymalną głębokością
    const newSet = new Set(expandedCats);
    expandedWithDepth.forEach(item => {
      if (item.depth === maxDepth) {
        newSet.delete(item.id);
      }
    });
    
    setExpandedCats(newSet);
  };

  // --- FILTROWANIE KATEGORII ---
  const shouldShowCategory = (category: any, parentMatches: boolean = false): boolean => {
    if (!categoryFilter.trim()) return true;
    
    const filterLower = categoryFilter.toLowerCase();
    const nameMatches = category.name.toLowerCase().includes(filterLower);
    
    // Jeśli kategoria pasuje do filtra, pokaż ją
    if (nameMatches) return true;
    
    // Jeśli rodzic pasuje, pokaż wszystkie dzieci z is_expanded
    if (parentMatches && category.is_expanded) return true;
    
    // Sprawdź czy któreś z dzieci pasuje do filtra
    if (category.children && category.children.length > 0) {
      const hasMatchingChild = category.children.some((child: any) => 
        shouldShowCategory(child, nameMatches || parentMatches)
      );
      if (hasMatchingChild) return true;
    }
    
    return false;
  };

  // --- RENDEROWANIE WIERSZY ---
  const renderCategoryRow = (category: any, depth = 0, parentMatches = false) => {
    // Sprawdź czy kategoria powinna być widoczna
    if (!shouldShowCategory(category, parentMatches)) return null;
    
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCats.has(category.id);
    const paddingLeft = depth * 20 + 10;
    
    // Oblicz czy nazwa tej kategorii pasuje do filtra
    const filterLower = categoryFilter.toLowerCase();
    const nameMatches = categoryFilter.trim() ? category.name.toLowerCase().includes(filterLower) : false;

    // Pobieramy wartość z mapy TOTAL (czyli suma kaskadowa)
    // Jeśli chcesz widzieć tylko direct, zmień totalValuesMap na directValuesMap
    const values = pivotData.totalValuesMap[category.id] || {};

    const currentRow = (
        <TableRow key={category.id} className="hover:bg-neutral-900/50 border-b border-neutral-800 group">
          <TableCell className="font-medium p-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 min-w-[200px]">
            <div 
                className="flex items-center text-sm h-full py-2 cursor-pointer hover:text-blue-400 transition-colors"
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={() => hasChildren && toggleCategory(category.id)}
            >
               {hasChildren ? (
                   isExpanded ? <ChevronDown className="w-4 h-4 mr-1 text-blue-500"/> : <ChevronRight className="w-4 h-4 mr-1 text-neutral-500"/>
               ) : (
                   <div className="w-5" /> // Placeholder na ikonę
               )}
               <span className={depth === 0 ? "text-white font-bold" : "text-neutral-300"}>
                 {category.name}
               </span>
            </div>
          </TableCell>
          {pivotData.columns.map(col => {
             const val = values[col.key] || 0;
             return (
               <TableCell 
                 key={col.key} 
                 className="text-right p-2 min-w-[80px] text-xs cursor-pointer hover:bg-blue-900/30 transition-colors"
                 onClick={() => handleCellClick(category.id, col.key, col.label)}
               >
                 {val !== 0 ? (
                   <span className={val < 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                     {formatCurrency(val)}
                   </span>
                 ) : (
                   <span className="text-neutral-800">-</span>
                 )}
               </TableCell>
             );
          })}
        </TableRow>
    );

    // Renderuj dzieci tylko jeśli kategoria jest rozwinięta
    const childrenRows = (hasChildren && isExpanded)
        ? category.children.map((child: any) => renderCategoryRow(child, depth + 1, nameMatches || parentMatches)).filter(Boolean)
        : [];

    return [currentRow, ...childrenRows];
  };

  const MenuContent = () => (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BROKEBUSTER
          </h1>
          <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <div className="space-y-1 mb-6">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Analizy</h3>
            <Button variant={activeView === "p1" ? "secondary" : "ghost"} className={`w-full justify-start ${activeView === "p1" ? "bg-neutral-800" : "text-neutral-400 hover:text-white"}`} onClick={() => { setActiveView("p1"); setIsMenuOpen(false); }}>
                <Ghost className="mr-2 h-4 w-4" /> Dashboard (Pivot)
            </Button>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Tabele</h3>
            {[
              { id: "transactions", label: "Transakcje", icon: LayoutDashboard },
              { id: "accounts", label: "Konta", icon: Wallet },
              { id: "categories", label: "Kategorie", icon: ListOrdered },
              { id: "weight", label: "Waga", icon: Scale },
              { id: "rules", label: "Reguły", icon: Settings },
            ].map((item) => (
                <Button key={item.id} variant={activeView === item.id ? "secondary" : "ghost"} className={`w-full justify-start ${activeView === item.id ? "bg-neutral-800" : "text-neutral-400 hover:text-white"}`} onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }}>
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
              </Button>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-neutral-800">
           <form action="/auth/signout" method="post">
            <Button variant="outline" className="w-full border-neutral-700 text-neutral-400">
              <LogOut className="mr-2 h-4 w-4" /> Wyloguj
            </Button>
          </form>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center h-16 px-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-4 text-white hover:bg-neutral-800"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r border-neutral-800 bg-neutral-950 w-72"><MenuContent /></SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold tracking-tight">{activeView === 'p1' ? 'Dashboard Finansowy' : activeView.toUpperCase()}</h1>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
        {activeView === "p1" ? (
             <Card className="bg-neutral-900 border-neutral-800 h-full flex flex-col overflow-hidden">
                {/* SEKCJA INFORMACJI O KLIKNIĘTEJ KOMÓRCE */}
                {clickedCell && (
                  <div 
                    className={`border-b-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-neutral-800 shadow-xl shadow-purple-900/20 transition-all duration-300 overflow-hidden ${
                      isCellInfoExpanded ? 'h-[65vh] md:h-[50vh]' : 'h-auto max-h-[40vh] md:max-h-none'
                    }`}
                  >
                    <div className="p-3 md:p-4 overflow-y-auto overflow-x-auto backdrop-blur-sm h-full">
                      {/* Nagłówek z przyciskiem expand */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCellInfoExpanded(!isCellInfoExpanded)}
                          className="border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                        >
                          {isCellInfoExpanded ? (
                            <>
                              <Minimize2 className="h-4 w-4" />
                              <span className="text-xs">Zwiń</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-4 w-4" />
                              <span className="text-xs">Rozwiń</span>
                            </>
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          {/* Podstawowe informacje - zawsze widoczne */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-medium">Miesiąc:</span>
                              <span className="text-white font-semibold">{clickedCell.monthLabel}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-medium">Kategoria:</span>
                              <span className="text-blue-400 font-semibold">
                                {clickedCell.categoryPath.join(' → ')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-medium">Done:</span>
                              <span className="text-green-400 font-semibold">
                                {clickedCell.doneCount} trans. / {formatCurrency(clickedCell.doneSum)} PLN
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-medium">Planned:</span>
                              <span className="text-yellow-400 font-semibold">
                                {clickedCell.plannedCount} trans. / {formatCurrency(clickedCell.plannedSum)} PLN
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rozszerzona sekcja - widoczna po kliknięciu expand */}
                      {isCellInfoExpanded && (
                        <div className="mt-4 p-3 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(65vh - 120px)' }}>
                          {/* TOGGLE BUTTON + FILTER na jednej linii */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                            {/* Toggle Button */}
                            <div className="flex items-center gap-1 bg-neutral-950 rounded-lg p-1 border border-neutral-700">
                              <button
                                onClick={handleToggleChange}
                                className={`px-2 py-1.5 rounded text-xs font-medium transition-all touch-manipulation flex-1 sm:flex-none ${
                                  !showUnassigned 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Przypisane
                              </button>
                              <button
                                onClick={handleToggleChange}
                                className={`px-2 py-1.5 rounded text-xs font-medium transition-all touch-manipulation flex-1 sm:flex-none ${
                                  showUnassigned 
                                    ? 'bg-orange-600 text-white' 
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Nieprzypisane
                              </button>
                            </div>
                            
                            {/* Pole filtrowania w tym samym wierszu */}
                            <input
                              type="text"
                              placeholder="Filtruj..."
                              value={transactionFilter}
                              onChange={(e) => setTransactionFilter(e.target.value)}
                              className="flex-1 h-9 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* Panel przypisywania kategorii - tylko dla widoku nieprzypisanych */}
                          {showUnassigned && selectedTransactionIds.size > 0 && (
                            <div className="mb-2 p-2 bg-neutral-950 rounded-lg border border-orange-500/50">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-neutral-300">
                                  Zaznaczono: <span className="font-bold text-orange-400">{selectedTransactionIds.size}</span>
                                </span>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                {/* Pole wyszukiwania kategorii */}
                                <input
                                  type="text"
                                  placeholder="Szukaj kategorii..."
                                  value={categorySearchFilter}
                                  onChange={(e) => setCategorySearchFilter(e.target.value)}
                                  className="h-9 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full touch-manipulation"
                                />
                                
                                <div className="flex gap-2">
                                  {/* Dropdown z posortowanymi i przefiltrowanymi kategoriami */}
                                  <select
                                    value={assignToCategoryId}
                                    onChange={(e) => setAssignToCategoryId(e.target.value)}
                                    className="flex-1 h-9 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation"
                                    size={1}
                                  >
                                    <option value="">Wybierz...</option>
                                    {getFilteredAndSortedCategories().map((cat: any) => (
                                      <option key={cat.id} value={cat.id}>
                                        {getCategoryPath(cat.id).join(' → ')}
                                      </option>
                                    ))}
                                  </select>
                                  
                                  <Button
                                    onClick={handleAssignToCategory}
                                    disabled={!assignToCategoryId}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation h-9 px-3 text-xs"
                                  >
                                    Przypisz
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Panel akcji dla przypisanych transakcji - PRZYCISKI W JEDNYM WIERSZU */}
                          {!showUnassigned && selectedTransactionIds.size > 0 && (
                            <div className="mb-2 p-2 bg-neutral-950 rounded-lg border border-blue-500/50">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-neutral-300">
                                  Zaznaczono: <span className="font-bold text-blue-400">{selectedTransactionIds.size}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-stretch gap-2">
                                <Button
                                  onClick={handleUnlinkFromCategory}
                                  size="sm"
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white touch-manipulation h-9 px-2 text-xs"
                                >
                                  Unlink (Odłącz)
                                </Button>
                                
                                <Button
                                  onClick={handleDeleteTransactions}
                                  size="sm"
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white touch-manipulation h-9 px-2 text-xs"
                                >
                                  Delete (Usuń)
                                </Button>
                                
                                <Button
                                  onClick={handleEditTransactions}
                                  size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white touch-manipulation h-9 px-2 text-xs"
                                >
                                  Edit (Edytuj)
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Tabela transakcji */}
                          <div className="overflow-auto flex-1">
                            <Table>
                              <TableHeader className="bg-neutral-950 sticky top-0 z-10">
                                <TableRow className="border-b border-neutral-700">
                                  {/* Checkbox column - dla wszystkich transakcji */}
                                  <TableHead className="w-10 text-center">
                                    <input
                                      type="checkbox"
                                      checked={getFilteredAndSortedTransactions().length > 0 && selectedTransactionIds.size === getFilteredAndSortedTransactions().length}
                                      onChange={toggleAllTransactions}
                                      className={`w-4 h-4 rounded border-neutral-600 bg-neutral-800 focus:ring-2 cursor-pointer ${
                                        showUnassigned 
                                          ? 'text-orange-600 focus:ring-orange-500' 
                                          : 'text-blue-600 focus:ring-blue-500'
                                      }`}
                                    />
                                  </TableHead>
                                  {[
                                    { key: 'date', label: 'Data' },
                                    { key: 'transaction_type', label: 'Typ' },
                                    { key: 'amount', label: 'Kwota' },
                                    { key: 'payee', label: 'Odbiorca' },
                                    { key: 'description', label: 'Opis' },
                                    { key: 'origin', label: 'Pochodzenie' },
                                    { key: 'source', label: 'Źródło' },
                                  ].map(col => (
                                    <TableHead 
                                      key={col.key}
                                      className="text-xs cursor-pointer hover:bg-neutral-800 transition-colors whitespace-nowrap"
                                      onClick={() => handleSort(col.key)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortColumn === col.key && (
                                          <span className="text-blue-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                          </span>
                                        )}
                                      </div>
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getFilteredAndSortedTransactions().length > 0 ? (
                                  getFilteredAndSortedTransactions().map((transaction, idx) => (
                                    <TableRow 
                                      key={transaction.id || idx} 
                                      className="hover:bg-neutral-800/50 border-b border-neutral-800"
                                    >
                                      {/* Checkbox cell - dla wszystkich transakcji */}
                                      <TableCell className="w-10 text-center">
                                        <input
                                          type="checkbox"
                                          checked={selectedTransactionIds.has(transaction.id)}
                                          onChange={() => toggleTransactionSelection(transaction.id)}
                                          className={`w-4 h-4 rounded border-neutral-600 bg-neutral-800 focus:ring-2 cursor-pointer ${
                                            showUnassigned 
                                              ? 'text-orange-600 focus:ring-orange-500' 
                                              : 'text-blue-600 focus:ring-blue-500'
                                          }`}
                                        />
                                      </TableCell>
                                      <TableCell className="text-xs whitespace-nowrap">
                                        {formatDate(transaction.date)}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          transaction.transaction_type === 'done' 
                                            ? 'bg-green-900/30 text-green-400' 
                                            : 'bg-yellow-900/30 text-yellow-400'
                                        }`}>
                                          {transaction.transaction_type}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs text-right">
                                        <span className={Number(transaction.amount) < 0 ? 'text-red-400' : 'text-green-400'}>
                                          {formatCurrency(Number(transaction.amount))}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs text-neutral-300 max-w-[200px] truncate">
                                        {transaction.payee || '-'}
                                      </TableCell>
                                      <TableCell className="text-xs text-neutral-400 max-w-[250px] truncate">
                                        {transaction.description || '-'}
                                      </TableCell>
                                      <TableCell className="text-xs text-neutral-300 max-w-[150px] truncate">
                                        {transaction.origin || '-'}
                                      </TableCell>
                                      <TableCell className="text-xs text-neutral-500">
                                        {transaction.source || '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                                      {showUnassigned ? 'Brak nieprzypisanych transakcji w tym miesiącu' : 'Brak transakcji do wyświetlenia'}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <CardHeader className="flex flex-col py-2 gap-2">
                    {/* WSZYSTKIE PRZYCISKI W JEDNYM WIERSZU */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {/* PRZYCISKI ROZWIJANIA/ZWIJANIA */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={expandAllByOneLevel}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-green-500 transition-colors touch-manipulation"
                            title="Rozwiń o jeden poziom"
                        >
                            <Maximize2 className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={collapseAllByOneLevel}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-orange-500 transition-colors touch-manipulation"
                            title="Zwiń o jeden poziom"
                        >
                            <Minimize2 className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                            className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-purple-500 transition-colors touch-manipulation ${showCategoryFilter ? 'bg-purple-900 border-purple-500' : ''}`}
                            title="Filtruj kategorie"
                        >
                            <Filter className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        {/* SEPARADOR (opcjonalnie) */}
                        <div className="w-px h-6 bg-neutral-700 mx-1"></div>
                        
                        {/* PRZYCISKI NAWIGACYJNE */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(m => m - 12)}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
                            title="-12 miesięcy"
                        >
                            <ChevronsLeft className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(m => m - 1)}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
                            title="-1 miesiąc"
                        >
                            <ChevronLeft className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(0)}
                            className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation ${monthOffset === 0 ? 'bg-blue-900 border-blue-500' : ''}`}
                            title="Obecny miesiąc"
                        >
                            <Circle className={`h-5 w-5 ${monthOffset === 0 ? 'text-blue-400 fill-blue-400' : 'text-neutral-400'}`} />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(m => m + 1)}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
                            title="+1 miesiąc"
                        >
                            <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(m => m + 12)}
                            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
                            title="+12 miesięcy"
                        >
                            <ChevronsRight className="h-5 w-5 text-neutral-400" />
                        </Button>
                    </div>
                    
                    {/* POLE FILTROWANIA KATEGORII - poniżej przycisków, pełna szerokość */}
                    {showCategoryFilter && (
                        <input
                            type="text"
                            placeholder="Filtruj kategorie..."
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-8 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                        />
                    )}
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto p-0 relative">
                    <Table>
                        <TableHeader className="bg-neutral-950 sticky top-0 z-20 shadow-md">
                            <TableRow className="hover:bg-neutral-950 border-b border-neutral-800">
                                <TableHead className="w-[200px] sticky left-0 bg-neutral-950 z-30 border-r border-neutral-800 text-white font-bold">
                                    KATEGORIA
                                </TableHead>
                                {pivotData.columns.map(col => (
                                    <TableHead key={col.key} className="text-right min-w-[80px] text-neutral-400 font-normal text-xs">
                                        {col.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotData.categoryTree.map(cat => renderCategoryRow(cat)).filter(Boolean)}
                        </TableBody>
                        <TableFooter className="bg-neutral-900 border-t-2 border-neutral-700 sticky bottom-0 z-20">
                            {/* Row 1: Bilans Miesięczny (Monthly Totals) */}
                            <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
                                <TableCell className="font-bold text-white sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-3">
                                    Bilans Miesięczny
                                </TableCell>
                                {pivotData.columns.map(col => {
                                    const val = pivotData.monthlyTotals[col.key] || 0;
                                    return (
                                        <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs font-bold">
                                            {val !== 0 ? (
                                                <span className={val < 0 ? "text-red-400" : "text-green-400"}>
                                                    {formatCurrency(val)}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-600">-</span>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                            
                            {/* Row 2: Bilans Narastająco (Cumulative Totals) */}
                            <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
                                <TableCell className="italic text-neutral-300 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-3">
                                    Bilans Narastająco
                                </TableCell>
                                {pivotData.columns.map(col => {
                                    const val = pivotData.cumulativeTotals[col.key] || 0;
                                    return (
                                        <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs italic">
                                            {val !== 0 ? (
                                                <span className={val < 0 ? "text-red-300" : "text-green-300"}>
                                                    {formatCurrency(val)}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-600">-</span>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                            
                            {/* Row 3: Placeholder 1 */}
                            <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
                                <TableCell className="text-neutral-500 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-2">
                                    Placeholder 1
                                </TableCell>
                                {pivotData.columns.map(col => (
                                    <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs text-neutral-700">
                                        -
                                    </TableCell>
                                ))}
                            </TableRow>
                            
                            {/* Row 4: Placeholder 2 */}
                            <TableRow className="hover:bg-neutral-900">
                                <TableCell className="text-neutral-500 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-2">
                                    Placeholder 2
                                </TableCell>
                                {pivotData.columns.map(col => (
                                    <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs text-neutral-700">
                                        -
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        ) : (
           <Card className="bg-neutral-900 border-neutral-800">
             <CardHeader><CardTitle>{activeView}</CardTitle></CardHeader>
             <CardContent>
                 <Table>
                    <TableHeader>
                      <TableRow><TableHead>Dane surowe</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell>Widok {activeView} - surowe dane dostępne w kodzie.</TableCell></TableRow>
                    </TableBody>
                 </Table>
             </CardContent>
           </Card>
        )}
      </main>
      
      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj transakcję</DialogTitle>
            <DialogDescription>
              Wprowadź zmiany w polach poniżej. Puste pola nie zostaną zaktualizowane.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right text-neutral-300">
                Data
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right text-neutral-300">
                Typ
              </Label>
              <select
                id="edit-type"
                value={editFormData.transaction_type}
                onChange={(e) => setEditFormData({...editFormData, transaction_type: e.target.value})}
                className="col-span-3 h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right text-neutral-300">
                Kwota
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-payee" className="text-right text-neutral-300">
                Odbiorca
              </Label>
              <Input
                id="edit-payee"
                value={editFormData.payee}
                onChange={(e) => setEditFormData({...editFormData, payee: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right text-neutral-300">
                Opis
              </Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-origin" className="text-right text-neutral-300">
                Pochodzenie
              </Label>
              <Input
                id="edit-origin"
                value={editFormData.origin}
                onChange={(e) => setEditFormData({...editFormData, origin: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-source" className="text-right text-neutral-300">
                Źródło
              </Label>
              <Input
                id="edit-source"
                value={editFormData.source}
                onChange={(e) => setEditFormData({...editFormData, source: e.target.value})}
                className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTransaction(null);
              }}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
