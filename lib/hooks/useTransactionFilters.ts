/**
 * useTransactionFilters Hook
 * Obsługuje sortowanie, filtrowanie i logikę transakcji
 */

import { useMemo, useCallback, useEffect } from "react";
import { Transaction, Category, CellInfo } from "@/lib/types/dashboard";
import { getMonthKey, safeDate, getCategoryPath, isLeafCategory } from "@/lib/utils/dashboard";

interface UseTransactionFiltersProps {
  transactions: Transaction[];
  categories: Category[];
  clickedCell: CellInfo | null;
  showUnassigned: boolean;
  transactionFilter: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  categorySearchFilter: string;
  setAssignToCategoryId: (id: string) => void;
}

export const useTransactionFilters = ({
  transactions,
  categories,
  clickedCell,
  showUnassigned,
  transactionFilter,
  sortColumn,
  sortDirection,
  categorySearchFilter,
  setAssignToCategoryId,
}: UseTransactionFiltersProps) => {

  // Funkcja do pobierania transakcji nieprzypisanych dla danego miesiąca
  const getUnassignedTransactionsForMonth = useCallback((monthKey: string): Transaction[] => {
    return transactions.filter(t => {
      const tMonthKey = getMonthKey(safeDate(t.date));

      if (tMonthKey !== monthKey) return false;

      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const hasCategory = categories.some(c =>
        c.id === t.category ||
        c.name.toLowerCase().trim() === transCategoryName
      );

      return !hasCategory || !t.category || t.category === '';
    });
  }, [transactions, categories]);

  // Funkcja sortowania transakcji
  const getFilteredAndSortedTransactions = useMemo(() => {
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
      let aVal = (a as any)[sortColumn];
      let bVal = (b as any)[sortColumn];

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
  }, [clickedCell, showUnassigned, transactionFilter, sortColumn, sortDirection, getUnassignedTransactionsForMonth]);

  // Funkcja pomocnicza do sprawdzania czy kategoria lub jej dzieci pasują do filtra
  const categoryMatchesFilter = useCallback((cat: Category, searchTerm: string): boolean => {
    if (!searchTerm) return true;

    const lowerSearch = searchTerm.toLowerCase();

    // Sprawdź czy nazwa tej kategorii pasuje
    if (cat.name.toLowerCase().includes(lowerSearch)) {
      return true;
    }

    // Sprawdź czy któreś z dzieci pasuje
    const children = categories.filter(c => c.parent === cat.id);
    return children.some(child => categoryMatchesFilter(child, searchTerm));
  }, [categories]);

  // Funkcja do filtrowania i sortowania kategorii dla dropdown
  // Funkcja do filtrowania i sortowania kategorii dla dropdown
  const getFilteredAndSortedCategories = useMemo(() => {
    // 1. Filtruj tylko liście (kategorie bez dzieci)
    let filtered = categories.filter(cat => isLeafCategory(cat.id, categories));

    // 2. Filtruj według wyszukiwania (szukamy w pełnej ścieżce)
    if (categorySearchFilter.trim()) {
      const lowerSearch = categorySearchFilter.toLowerCase();
      filtered = filtered.filter(cat => {
        const path = getCategoryPath(cat.id, categories).join(' ').toLowerCase();
        return path.includes(lowerSearch);
      });
    }

    // 3. Sortuj alfabetycznie według pełnej ścieżki (rosnąco)
    filtered = filtered.sort((a, b) => {
      const pathA = getCategoryPath(a.id, categories).join(' > ').toLowerCase();
      const pathB = getCategoryPath(b.id, categories).join(' > ').toLowerCase();
      return pathA.localeCompare(pathB, 'pl');
    });

    return filtered;
  }, [categories, categorySearchFilter]);

  // Pobierz unikalne wartości origin z transakcji
  const uniqueOrigins = useMemo(() => {
    const origins = new Set<string>();
    transactions.forEach(t => {
      if (t.origin && t.origin.trim()) {
        origins.add(t.origin.trim());
      }
    });
    const sorted = Array.from(origins).sort();
    if (!sorted.includes('cash')) {
      sorted.unshift('cash');
    }
    return sorted;
  }, [transactions]);

  // Efekt: Automatycznie wybierz pierwszą kategorię z przefiltrowanej listy
  useEffect(() => {
    if (categorySearchFilter.trim()) {
      const filtered = getFilteredAndSortedCategories;
      if (filtered.length > 0) {
        setAssignToCategoryId(filtered[0].id);
      } else {
        setAssignToCategoryId('');
      }
    } else {
      setAssignToCategoryId('');
    }
  }, [categorySearchFilter, getFilteredAndSortedCategories, setAssignToCategoryId]);

  return {
    getUnassignedTransactionsForMonth,
    getFilteredAndSortedTransactions,
    getFilteredAndSortedCategories,
    uniqueOrigins,
  };
};
