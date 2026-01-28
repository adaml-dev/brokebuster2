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
    dashboardState.setSelectedTransactionIds(new Set());
    dashboardState.setAssignToCategoryId('');
    dashboardState.setTransactionFilter('');
  };

  const handleEditTransactions = () => {
    if (dashboardState.selectedTransactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const selectedTransactions = transactionFilters.getFilteredAndSortedTransactions.filter(t => 
      dashboardState.selectedTransactionIds.has(t.id)
    );
    
    if (selectedTransactions.length === 1) {
      alert('Edit pojedynczej transakcji - TODO: Otwórz dialog edycji');
      // TODO: Implement edit dialog
    } else {
      alert(`📝 Edycja wielu transakcji:\n\nZaznaczono: ${selectedTransactions.length} transakcji\n\n⚠️ Edycja wielu transakcji jednocześnie nie jest dostępna.`);
    }
  };

  const handleOpenManualEntry = () => {
    if (!dashboardState.clickedCell) {
      alert('Najpierw kliknij na komórkę w tabeli, aby wybrać kategorię i miesiąc');
      return;
    }
    alert('Add transaction dialog - TODO: Implement');
    // TODO: Implement add transaction dialog
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
                onToggleCategoryFilter={() => dashboardState.setShowCategoryFilter(!dashboardState.showCategoryFilter)}
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
    </div>
  );
}
