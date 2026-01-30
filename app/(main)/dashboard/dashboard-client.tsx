/**
 * DashboardClient - REFACTORED VERSION
 * Orkiestrator komponentów dashboardu (bez headera - jest w layout)
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Hooki
import { usePivotCalculations } from "@/lib/hooks/usePivotCalculations";
import { useDashboardState } from "@/lib/hooks/useDashboardState";
import { useTransactionFilters } from "@/lib/hooks/useTransactionFilters";
import { useTransactionActions } from "@/lib/hooks/useTransactionActions";
import { useTransactionForms } from "@/lib/hooks/useTransactionForms";

// Komponenty
import { ToolBar } from "@/components/dashboard/ToolBar";
import { PivotTable } from "@/components/dashboard/PivotTable";
import { TransactionPanel } from "@/components/dashboard/TransactionPanel";
import { EditTransactionDialog } from "@/components/dashboard/EditTransactionDialog";
import { ManualEntryDialog } from "@/components/dashboard/ManualEntryDialog";

// Typy
import { Transaction, Account, Category, WeightLog, Rule, AccountStatement } from "@/lib/types/dashboard";

interface DashboardClientProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  weightLogs: WeightLog[];
  rules: Rule[];
  accountStatements: AccountStatement[];
}

export default function DashboardClient({
  transactions,
  accounts,
  categories,
  weightLogs,
  rules,
  accountStatements,
}: DashboardClientProps) {
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
    accountStatements,
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

  const formActions = useTransactionForms({
    transactions,
    categories,
    dashboardState,
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
    dashboardState.setAssignToCategoryId('');
    dashboardState.setTransactionFilter('');
  };

  // === RENDER ===

  return (
    <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
      <Card className="bg-neutral-900 border-neutral-800 h-full flex flex-col overflow-hidden">
        {/* Transaction Panel (optional - pokazuje się po kliknięciu komórki) */}
        <TransactionPanel
          clickedCell={dashboardState.clickedCell}
          isCellInfoExpanded={dashboardState.isCellInfoExpanded}
          onToggleExpand={() => dashboardState.setIsCellInfoExpanded(!dashboardState.isCellInfoExpanded)}
          onOpenManualEntry={formActions.handleOpenManualEntryDialog}
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
          onEditTransactions={() => formActions.handleOpenEditDialog(dashboardState.selectedTransactionIds)}
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
            onOpenManualEntry={formActions.handleOpenManualEntryDialog}
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

      <EditTransactionDialog
        isOpen={formActions.isEditDialogOpen}
        onOpenChange={formActions.setIsEditDialogOpen}
        formData={formActions.editFormData}
        onFormChange={formActions.setEditFormData}
        onSave={formActions.handleSaveEdit}
        onCancel={() => {
          formActions.setIsEditDialogOpen(false);
          formActions.setEditingTransaction(null);
        }}
      />

      <ManualEntryDialog
        isOpen={formActions.isManualEntryDialogOpen}
        onOpenChange={formActions.setIsManualEntryDialogOpen}
        formData={formActions.manualEntryFormData}
        onFormChange={formActions.setManualEntryFormData}
        onSave={formActions.handleSaveManualEntry}
        categories={categories}
        uniqueOrigins={uniqueOrigins}
      />
    </div>
  );
}
