/**
 * useTransactionActions Hook
 * Obsługuje wszystkie akcje API dla transakcji (assign, unlink, delete, edit, create)
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/lib/types/dashboard";
import { getCategoryPath } from "@/lib/utils/dashboard";
import { notifyError, notifySuccess } from "@/lib/notify";
import { confirmAction } from "@/components/ui/confirm-dialog";

interface UseTransactionActionsProps {
  categories: Category[];
  /** Wywoływane po udanej operacji (np. czyszczenie zaznaczenia) */
  onSuccess?: () => void;
}

export const useTransactionActions = ({
  categories,
  onSuccess,
}: UseTransactionActionsProps) => {
  const router = useRouter();

  // Odświeża dane z serwera bez przeładowania całej strony (stan klienta zostaje zachowany)
  const refreshData = useCallback(() => {
    onSuccess?.();
    router.refresh();
  }, [onSuccess, router]);

  // Assign transactions to category
  const assignToCategory = useCallback(async (
    transactionIds: Set<string>,
    categoryId: string
  ) => {
    if (!categoryId || transactionIds.size === 0) {
      notifyError('Wybierz kategorię i zaznacz co najmniej jedną transakcję');
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);
    const categoryPath = selectedCategory ? getCategoryPath(categoryId, categories).join(' → ') : categoryId;

    const confirmed = await confirmAction({
      title: `Przypisać ${transactionIds.size} transakcji do kategorii?`,
      description: categoryPath,
      confirmLabel: 'Przypisz',
    });
    if (!confirmed) return;

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

      notifySuccess(`Przypisano ${result.updatedCount} transakcji`, categoryPath);

      refreshData();

    } catch (error) {
      console.error('Error assigning category:', error);
      notifyError('Nie udało się przypisać kategorii', error);
    }
  }, [categories, refreshData]);

  // Unlink transactions from category
  const unlinkFromCategory = useCallback(async (transactionIds: Set<string>) => {
    if (transactionIds.size === 0) {
      notifyError('Zaznacz co najmniej jedną transakcję');
      return;
    }

    const confirmed = await confirmAction({
      title: `Odłączyć ${transactionIds.size} transakcji od kategorii?`,
      description: 'Transakcje staną się nieprzypisane.',
      confirmLabel: 'Odłącz',
    });
    if (!confirmed) return;

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

      notifySuccess(`Odłączono ${result.updatedCount} transakcji od kategorii`);

      refreshData();

    } catch (error) {
      console.error('Error unlinking transactions:', error);
      notifyError('Nie udało się odłączyć transakcji', error);
    }
  }, [refreshData]);

  // Delete transactions
  const deleteTransactions = useCallback(async (transactionIds: Set<string>) => {
    if (transactionIds.size === 0) {
      notifyError('Zaznacz co najmniej jedną transakcję');
      return;
    }

    const confirmed = await confirmAction({
      title: `Trwale usunąć ${transactionIds.size} transakcji?`,
      description: 'Tej operacji nie można cofnąć.',
      confirmLabel: 'Usuń',
      destructive: true,
    });
    if (!confirmed) return;

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

      notifySuccess(`Usunięto ${result.deletedCount} transakcji`);

      refreshData();

    } catch (error) {
      console.error('Error deleting transactions:', error);
      notifyError('Nie udało się usunąć transakcji', error);
    }
  }, [refreshData]);

  // Edit transaction
  const editTransaction = useCallback(async (
    transactionId: string,
    updates: any,
    options?: { silent?: boolean }
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

      if (!options?.silent) notifySuccess('Transakcja została zaktualizowana');

      refreshData();

    } catch (error) {
      console.error('Error updating transaction:', error);
      notifyError('Nie udało się zaktualizować transakcji', error);
    }
  }, [refreshData]);

  // Create transaction
  const createTransaction = useCallback(async (formData: any) => {
    if (!formData.date || !formData.amount) {
      notifyError('Data i kwota są wymagane');
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

      const count = result.count || 1;
      notifySuccess(count === 1 ? 'Transakcja została dodana' : `Dodano ${count} transakcji (seria)`);

      refreshData();

    } catch (error) {
      console.error('Error creating transaction:', error);
      notifyError('Nie udało się dodać transakcji', error);
    }
  }, [refreshData]);

  return {
    assignToCategory,
    unlinkFromCategory,
    deleteTransactions,
    editTransaction,
    createTransaction,
  };
};
