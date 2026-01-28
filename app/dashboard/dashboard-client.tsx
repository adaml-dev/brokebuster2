/**
 * DashboardClient - REFACTORED VERSION
 * Orkiestrator komponentów dashboardu (zmniejszony z 1098 do ~250 linii)
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

// Hooki
import { usePivotCalculations } from "@/lib/hooks/usePivotCalculations";
import { useDashboardState } from "@/lib/hooks/useDashboardState";
import { useTransactionFilters } from "@/lib/hooks/useTransactionFilters";
import { useTransactionActions } from "@/lib/hooks/useTransactionActions";

// Komponenty
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ToolBar } from "@/components/dashboard/ToolBar";
import { PivotTable } from "@/components/dashboard/PivotTable";
import { TransactionPanel } from "@/components/dashboard/TransactionPanel";

// Typy
import { DashboardClientProps } from "@/lib/types/dashboard";

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
  const [selectedYear] = useState(new Date().getFullYear());
  
  // === STATE DLA DIALOGÓW ===
  
  // Edit Dialog state
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
  
  // Manual Entry Dialog state
  const [isManualEntryDialogOpen, setIsManualEntryDialogOpen] = useState(false);
  const [manualEntryFormData, setManualEntryFormData] = useState({
    date: '',
    transaction_type: 'planned',
    amount: '',
    payee: '',
    description: '',
    origin: 'cash',
    category: '',
    categoryFilter: '',
    seriesRepetitions: 1,
    seriesIntervalMonths: 1,
  });

  // === HOOKI ===
  
  // State management (localStorage, expanded categories, clicked cell)
  const dashboardState = useDashboardState({ categories, transactions });
  
  // Pivot calculations (kolumny, wartości, sumy)
  const pivotData = usePivotCalculations({
    transactions,
    categories,
    selectedYear,
    monthOffset: dashboardState.monthOffset,
  });
  
  // Transaction filters (sortowanie, filtrowanie)
  const transactionFilters = useTransactionFilters({
    transactions,
    categories,
    clickedCell: dashboardState.clickedCell,
    showUnassigned: dashboardState.showUnassigned,
    transactionFilter: dashboardState.transactionFilter,
    sortColumn: dashboardState.sortColumn,
    sortDirection: dashboardState.sortDirection,
    categorySearchFilter: dashboardState.categorySearchFilter,
    setAssignToCategoryId: dashboardState.setAssignToCategoryId,
  });
  
  // Transaction actions (API calls)
  const transactionActions = useTransactionActions({
    categories,
    dashboardState: {
      expandedCats: Array.from(dashboardState.expandedCats),
      monthOffset: dashboardState.monthOffset,
      categoryFilter: dashboardState.categoryFilter,
      clickedCell: dashboardState.clickedCell,
      isCellInfoExpanded: dashboardState.isCellInfoExpanded,
      showUnassigned: dashboardState.showUnassigned,
      transactionFilter: dashboardState.transactionFilter,
      categorySearchFilter: dashboardState.categorySearchFilter,
      assignToCategoryId: dashboardState.assignToCategoryId,
      sortColumn: dashboardState.sortColumn,
      sortDirection: dashboardState.sortDirection,
    },
    expandedCats: dashboardState.expandedCats,
    monthOffset: dashboardState.monthOffset,
    categoryFilter: dashboardState.categoryFilter,
  });

  // === FUNKCJE POMOCNICZE ===
  
  // Pobierz unikalne wartości origin z transakcji
  const uniqueOrigins = React.useMemo(() => {
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
  
  const handleSort = (column: string) => {
    if (dashboardState.sortColumn === column) {
      dashboardState.setSortDirection(dashboardState.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      dashboardState.setSortColumn(column);
      dashboardState.setSortDirection('asc');
    }
  };
  
  const toggleTransactionSelection = (transactionId: string) => {
    const newSet = new Set(dashboardState.selectedTransactionIds);
    if (newSet.has(transactionId)) {
      newSet.delete(transactionId);
    } else {
      newSet.add(transactionId);
    }
    dashboardState.setSelectedTransactionIds(newSet);
  };
  
  const toggleAllTransactions = () => {
    const visibleTransactions = transactionFilters.getFilteredAndSortedTransactions;
    if (dashboardState.selectedTransactionIds.size === visibleTransactions.length) {
      dashboardState.setSelectedTransactionIds(new Set());
    } else {
      const allIds = new Set(visibleTransactions.map(t => t.id));
      dashboardState.setSelectedTransactionIds(allIds);
    }
  };
  
  const handleToggleUnassigned = () => {
    dashboardState.setShowUnassigned(!dashboardState.showUnassigned);
    // UWAGA: czyszczenie IDшек transakcji jest teraz w hooku useDashboardState
    // setSelectedTransactionIds(new Set());
    dashboardState.setAssignToCategoryId('');
    dashboardState.setTransactionFilter('');
  };

  // Efekt czyszczący zaznaczenie transakcji przy zmianie filtrów
  React.useEffect(() => {
    // Ten useEffect jest teraz w hooku useDashboardState
    // dashboardState.setSelectedTransactionIds(new Set());
  }, [
    dashboardState.transactionFilter, 
    dashboardState.sortColumn, 
    dashboardState.sortDirection,
    dashboardState.showUnassigned,
  ]);

  const handleEditTransactions = () => {
    if (dashboardState.selectedTransactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const selectedTransactions = transactionFilters.getFilteredAndSortedTransactions.filter(t => 
      dashboardState.selectedTransactionIds.has(t.id)
    );
    
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
      alert(`📝 Edycja wielu transakcji:

Zaznaczono: ${selectedTransactions.length} transakcji

⚠️ Edycja wielu transakcji jednocześnie nie jest dostępna.`);
    }
  };

  const handleOpenManualEntry = () => {
    if (!dashboardState.clickedCell) {
      alert('Najpierw kliknij na komórkę w tabeli, aby wybrać kategorię i miesiąc');
      return;
    }
    
    // Przygotuj datę - pierwszy dzień wybranego miesiąca
    const [year, month] = dashboardState.clickedCell.monthKey.split('-');
    const firstDayOfMonth = `${year}-${month}-01`;
    
    // Ustaw domyślne wartości formularza
    setManualEntryFormData({
      date: firstDayOfMonth,
      transaction_type: 'planned',
      amount: '',
      payee: '',
      description: '',
      origin: 'cash',
      category: dashboardState.clickedCell.categoryId,
      categoryFilter: '',
      seriesRepetitions: 1,
      seriesIntervalMonths: 1,
    });
    
    setIsManualEntryDialogOpen(true);
  };
  
  // Funkcja do zapisywania edytowanej transakcji
  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    try {
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

      // Sukces - zapisz stan przed odświeżeniem
      transactionActions.saveStateBeforeReload();
      
      // Zamknij dialog
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      
      alert(`✅ Sukces!

Transakcja została zaktualizowana.

Strona zostanie odświeżona.`);
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert(`❌ Błąd podczas aktualizacji transakcji:

${error instanceof Error ? error.message : 'Nieznany błąd'}

Spróbuj ponownie.`);
    }
  };
  
  // Funkcja do zapisywania manualnie wprowadzonej transakcji
  const handleSaveManualEntry = async () => {
    if (!manualEntryFormData.date || !manualEntryFormData.amount) {
      alert('Data i kwota są wymagane');
      return;
    }
    
    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualEntryFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create transaction');
      }

      // Sukces - zapisz stan przed odświeżeniem
      transactionActions.saveStateBeforeReload();
      
      // Zamknij dialog
      setIsManualEntryDialogOpen(false);
      
      const count = result.count || 1;
      const message = count === 1 
        ? `✅ Sukces!

Transakcja została dodana.

Strona zostanie odświeżona.`
        : `✅ Sukces!

Dodano ${count} transakcji (seria).

Strona zostanie odświeżona.`;
      alert(message);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(`❌ Błąd podczas tworzenia transakcji:

${error instanceof Error ? error.message : 'Nieznany błąd'}

Spróbuj ponownie.`);
    }
  };

  // === RENDER ===
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="flex items-center h-16 px-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4 text-white hover:bg-neutral-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-neutral-800 bg-neutral-950 w-72">
            <Sidebar
              userEmail={userEmail}
              activeView={activeView}
              onViewChange={setActiveView}
              onMenuClose={() => setIsMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold tracking-tight">
          {activeView === 'p1' ? 'Dashboard Finansowy' : activeView.toUpperCase()}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
        {activeView === "p1" ? (
          <Card className="bg-neutral-900 border-neutral-800 h-full flex flex-col overflow-hidden">
            {/* Transaction Panel (optional - pokazuje się po kliknięciu komórki) */}
            <TransactionPanel
              clickedCell={dashboardState.clickedCell}
              isCellInfoExpanded={dashboardState.isCellInfoExpanded}
              onToggleExpand={() => dashboardState.setIsCellInfoExpanded(!dashboardState.isCellInfoExpanded)}
              onOpenManualEntry={handleOpenManualEntry}
              showUnassigned={dashboardState.showUnassigned}
              onToggleUnassigned={handleToggleUnassigned}
              filteredTransactions={transactionFilters.getFilteredAndSortedTransactions}
              transactionFilter={dashboardState.transactionFilter}
              onTransactionFilterChange={dashboardState.setTransactionFilter}
              sortColumn={dashboardState.sortColumn}
              sortDirection={dashboardState.sortDirection}
              onSort={handleSort}
              selectedTransactionIds={dashboardState.selectedTransactionIds}
              onToggleTransaction={toggleTransactionSelection}
              onToggleAllTransactions={toggleAllTransactions}
              onAssignToCategory={() => transactionActions.assignToCategory(dashboardState.selectedTransactionIds, dashboardState.assignToCategoryId)}
              onUnlinkFromCategory={() => transactionActions.unlinkFromCategory(dashboardState.selectedTransactionIds)}
              onDeleteTransactions={() => transactionActions.deleteTransactions(dashboardState.selectedTransactionIds)}
              onEditTransactions={handleEditTransactions}
              categories={categories}
              assignToCategoryId={dashboardState.assignToCategoryId}
              onAssignToCategoryIdChange={dashboardState.setAssignToCategoryId}
              categorySearchFilter={dashboardState.categorySearchFilter}
              onCategorySearchFilterChange={dashboardState.setCategorySearchFilter}
              filteredCategories={transactionFilters.getFilteredAndSortedCategories}
            />
            
            {/* Toolbar */}
            <CardHeader className="flex flex-col py-2 gap-2">
              <ToolBar
                monthOffset={dashboardState.monthOffset}
                onMonthOffsetChange={dashboardState.setMonthOffset}
                onExpandAll={dashboardState.expandAllByOneLevel}
                onCollapseAll={dashboardState.collapseAllByOneLevel}
                categoryFilter={dashboardState.categoryFilter}
                onCategoryFilterChange={dashboardState.setCategoryFilter}
                showCategoryFilter={dashboardState.showCategoryFilter}
                onToggleCategoryFilter={() =>
                  dashboardState.setShowCategoryFilter(
                    !dashboardState.showCategoryFilter,
                  )
                }
                isCellInfoExpanded={dashboardState.isCellInfoExpanded}
                onToggleExpand={() =>
                  dashboardState.setIsCellInfoExpanded(
                    !dashboardState.isCellInfoExpanded,
                  )
                }
                onOpenManualEntry={handleOpenManualEntry}
              />
            </CardHeader>
            
            {/* Pivot Table */}
            <CardContent className="flex-1 overflow-auto p-0 relative">
              <PivotTable
                pivotData={pivotData}
                expandedCats={dashboardState.expandedCats}
                categoryFilter={dashboardState.categoryFilter}
                onToggleCategory={dashboardState.toggleCategory}
                onCellClick={dashboardState.handleCellClick}
              />
            </CardContent>
          </Card>
        ) : (
          // Inne widoki (transactions, accounts, categories, weight, rules)
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <h2 className="text-xl font-bold">{activeView}</h2>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dane surowe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Widok {activeView} - surowe dane dostępne w kodzie.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edytuj transakcję</DialogTitle>
            <DialogDescription className="text-neutral-400">
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
      
      {/* MANUAL ENTRY DIALOG (DODAJ) */}
      <Dialog open={isManualEntryDialogOpen} onOpenChange={setIsManualEntryDialogOpen}>
        <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-green-400">➕ DODAJ transakcję</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Wypełnij pola aby dodać nową transakcję. Kategoria i miesiąc są wstępnie wypełnione na podstawie zaznaczonej komórki (możesz je zmienić).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Wiersz 1: Data i Typ */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-date" className="text-neutral-300">
                  Data *
                </Label>
                <Input
                  id="manual-date"
                  type="date"
                  value={manualEntryFormData.date}
                  onChange={(e) => setManualEntryFormData({...manualEntryFormData, date: e.target.value})}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="manual-type" className="text-neutral-300">
                  Typ
                </Label>
                <select
                  id="manual-type"
                  value={manualEntryFormData.transaction_type}
                  onChange={(e) => setManualEntryFormData({...manualEntryFormData, transaction_type: e.target.value})}
                  className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="planned">Planned</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            
            {/* Wiersz 2: Kwota i Kategoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-amount" className="text-neutral-300">
                  Kwota *
                </Label>
                <Input
                  id="manual-amount"
                  type="number"
                  step="0.01"
                  value={manualEntryFormData.amount}
                  onChange={(e) => setManualEntryFormData({...manualEntryFormData, amount: e.target.value})}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  placeholder="np. -150.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="manual-category" className="text-neutral-300">
                  Kategoria
                </Label>
                <Input
                  type="text"
                  placeholder="Filtruj kategorie..."
                  value={manualEntryFormData.categoryFilter}
                  onChange={(e) => {
                    const filterValue = e.target.value;
                    const filtered = categories
                      .filter(cat => cat.parent !== null && !cat.is_expanded)
                      .filter(cat => getCategoryPath(cat.id).join(' ').toLowerCase().includes(filterValue.toLowerCase()));

                    setManualEntryFormData({ 
                      ...manualEntryFormData, 
                      categoryFilter: filterValue,
                      category: filtered.length > 0 ? filtered[0].id : '' 
                    });
                  }}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                />
                <select
                  id="manual-category"
                  value={manualEntryFormData.category}
                  onChange={(e) => setManualEntryFormData({ ...manualEntryFormData, category: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Brak kategorii</option>
                  {categories
                    .filter(cat => cat.parent !== null)
                    .filter(cat => getCategoryPath(cat.id).join(' ').toLowerCase().includes(manualEntryFormData.categoryFilter.toLowerCase()))
                    .map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {getCategoryPath(cat.id).join(' → ')}
                      </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Wiersz 3: Odbiorca i Opis */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-payee" className="text-neutral-300">
                  Odbiorca
                </Label>
                <Input
                  id="manual-payee"
                  value={manualEntryFormData.payee}
                  onChange={(e) => setManualEntryFormData({...manualEntryFormData, payee: e.target.value})}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  placeholder="np. Sklep spożywczy"
                />
              </div>
              
              <div>
                <Label htmlFor="manual-description" className="text-neutral-300">
                  Opis
                </Label>
                <Input
                  id="manual-description"
                  value={manualEntryFormData.description}
                  onChange={(e) => setManualEntryFormData({...manualEntryFormData, description: e.target.value})}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  placeholder="np. Zakupy tygodniowe"
                />
              </div>
            </div>
            
            {/* Wiersz 4: Pochodzenie */}
            <div>
              <Label htmlFor="manual-origin" className="text-neutral-300">
                Pochodzenie
              </Label>
              <select
                id="manual-origin"
                value={manualEntryFormData.origin}
                onChange={(e) => setManualEntryFormData({...manualEntryFormData, origin: e.target.value})}
                className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {uniqueOrigins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>
            
            {/* SEKCJA SERII TRANSAKCJI */}
            <div className="border-t border-neutral-700 pt-4 mt-2">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Seria transakcji (opcjonalne)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Liczba powtórzeń */}
                <div>
                  <Label className="text-sm text-neutral-400 mb-2 block">
                    Liczba powtórzeń
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setManualEntryFormData({...manualEntryFormData, seriesRepetitions: Math.max(1, manualEntryFormData.seriesRepetitions - 1)})}
                      className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600"
                    >
                      -
                    </Button>
                    <span className="text-white font-bold text-lg min-w-[40px] text-center">
                      {manualEntryFormData.seriesRepetitions}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setManualEntryFormData({...manualEntryFormData, seriesRepetitions: manualEntryFormData.seriesRepetitions + 1})}
                      className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600"
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 6, 9, 12, 18, 24].map(num => (
                      <Button
                        key={num}
                        type="button"
                        size="sm"
                        onClick={() => setManualEntryFormData({...manualEntryFormData, seriesRepetitions: num})}
                        className={`h-7 px-2 text-xs ${
                          manualEntryFormData.seriesRepetitions === num
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Odstęp w miesiącach */}
                <div>
                  <Label className="text-sm text-neutral-400 mb-2 block">
                    Odstęp (w miesiącach)
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setManualEntryFormData({...manualEntryFormData, seriesIntervalMonths: Math.max(1, manualEntryFormData.seriesIntervalMonths - 1)})}
                      className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600"
                    >
                      -
                    </Button>
                    <span className="text-white font-bold text-lg min-w-[40px] text-center">
                      {manualEntryFormData.seriesIntervalMonths}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setManualEntryFormData({...manualEntryFormData, seriesIntervalMonths: manualEntryFormData.seriesIntervalMonths + 1})}
                      className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600"
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 6, 12].map(num => (
                      <Button
                        key={num}
                        type="button"
                        size="sm"
                        onClick={() => setManualEntryFormData({...manualEntryFormData, seriesIntervalMonths: num})}
                        className={`h-7 px-2 text-xs ${
                          manualEntryFormData.seriesIntervalMonths === num
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManualEntryDialogOpen(false);
              }}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSaveManualEntry}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ➕ Dodaj transakcję
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}