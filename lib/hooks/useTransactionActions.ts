/**
 * useTransactionActions Hook
 * Obsługuje wszystkie akcje API dla transakcji (assign, unlink, delete, edit, create)
 */

import { useCallback } from "react";
import { Category, DashboardState } from "@/lib/types/dashboard";
import { getCategoryPath } from "@/lib/utils/dashboard";

interface UseTransactionActionsProps {
  categories: Category[];
  dashboardState: DashboardState;
  expandedCats: Set<string>;
  monthOffset: number;
  categoryFilter: string;
}

export const useTransactionActions = ({
  categories,
  dashboardState,
  expandedCats,
  monthOffset,
  categoryFilter,
}: UseTransactionActionsProps) => {
  
  // Funkcja do zapisywania stanu przed reload
  const saveStateBeforeReload = useCallback(() => {
    const stateToSave = {
      expandedCats: Array.from(expandedCats),
      monthOffset: monthOffset,
      categoryFilter: categoryFilter,
      clickedCell: dashboardState.clickedCell,
      isCellInfoExpanded: dashboardState.isCellInfoExpanded,
      showUnassigned: dashboardState.showUnassigned,
      transactionFilter: dashboardState.transactionFilter,
      categorySearchFilter: dashboardState.categorySearchFilter,
      assignToCategoryId: dashboardState.assignToCategoryId,
      sortColumn: dashboardState.sortColumn,
      sortDirection: dashboardState.sortDirection,
    };
    localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
  }, [expandedCats, monthOffset, categoryFilter, dashboardState]);

  // Assign transactions to category
  const assignToCategory = useCallback(async (
    transactionIds: Set<string>,
    categoryId: string
  ) => {
    if (!categoryId || transactionIds.size === 0) {
      alert('Wybierz kategorię i zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const selectedCategory = categories.find(c => c.id === categoryId);
    const categoryPath = selectedCategory ? getCategoryPath(categoryId, categories).join(' → ') : categoryId;
    
    const transactionCount = transactionIds.size;
    const confirmMessage = `Czy na pewno chcesz przypisać ${transactionCount} transakcji do kategorii:\n"${categoryPath}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await fetch('/api/transactions/assign-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(transactionIds),
          categoryId: categoryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign category');
      }

      saveStateBeforeReload();
      
      alert(`✅ Sukces!\n\nPrzypisano ${result.updatedCount} transakcji do kategorii:\n"${categoryPath}"\n\nStrona zostanie odświeżona.`);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error assigning category:', error);
      alert(`❌ Błąd podczas przypisywania kategorii:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  }, [categories, saveStateBeforeReload]);

  // Unlink transactions from category
  const unlinkFromCategory = useCallback(async (transactionIds: Set<string>) => {
    if (transactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const transactionCount = transactionIds.size;
    const confirmMessage = `Czy na pewno chcesz odłączyć ${transactionCount} transakcji od kategorii?\n\nTransakcje staną się nieprzypisane.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await fetch('/api/transactions/unlink-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(transactionIds),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unlink transactions');
      }

      saveStateBeforeReload();
      
      alert(`✅ Sukces!\n\nOdłączono ${result.updatedCount} transakcji od kategorii.\n\nStrona zostanie odświeżona.`);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error unlinking transactions:', error);
      alert(`❌ Błąd podczas odłączania transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  }, [saveStateBeforeReload]);

  // Delete transactions
  const deleteTransactions = useCallback(async (transactionIds: Set<string>) => {
    if (transactionIds.size === 0) {
      alert('Zaznacz co najmniej jedną transakcję');
      return;
    }
    
    const transactionCount = transactionIds.size;
    const confirmMessage = `❗ UWAGA ❗\n\nCzy na pewno chcesz TRWALE USUNĄĆ ${transactionCount} transakcji?\n\nTej operacji NIE MOŻNA cofnąć!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    const doubleConfirm = confirm(`Potwierdź ponownie:\n\nUsuwam ${transactionCount} transakcji bezpowrotnie.`);
    if (!doubleConfirm) {
      return;
    }
    
    try {
      const response = await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds: Array.from(transactionIds),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transactions');
      }

      saveStateBeforeReload();
      
      alert(`✅ Sukces!\n\nUsunięto ${result.deletedCount} transakcji.\n\nStrona zostanie odświeżona.`);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert(`❌ Błąd podczas usuwania transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  }, [saveStateBeforeReload]);

  // Edit transaction
  const editTransaction = useCallback(async (
    transactionId: string,
    updates: any
  ) => {
    try {
      const response = await fetch('/api/transactions/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          updates: updates,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction');
      }

      saveStateBeforeReload();
      
      alert(`✅ Sukces!\n\nTransakcja została zaktualizowana.\n\nStrona zostanie odświeżona.`);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert(`❌ Błąd podczas aktualizacji transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  }, [saveStateBeforeReload]);

  // Create transaction
  const createTransaction = useCallback(async (formData: any) => {
    if (!formData.date || !formData.amount) {
      alert('Data i kwota są wymagane');
      return;
    }
    
    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create transaction');
      }

      saveStateBeforeReload();
      
      const count = result.count || 1;
      const message = count === 1 
        ? `✅ Sukces!\n\nTransakcja została dodana.\n\nStrona zostanie odświeżona.`
        : `✅ Sukces!\n\nDodano ${count} transakcji (seria).\n\nStrona zostanie odświeżona.`;
      alert(message);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(`❌ Błąd podczas tworzenia transakcji:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nSpróbuj ponownie.`);
    }
  }, [saveStateBeforeReload]);

  return {
    assignToCategory,
    unlinkFromCategory,
    deleteTransactions,
    editTransaction,
    createTransaction,
  };
};
