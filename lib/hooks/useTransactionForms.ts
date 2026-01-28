
import { useState, useCallback } from 'react';
import { useTransactionActions } from './useTransactionActions';
import { Transaction, Category } from '@/lib/types/dashboard';

interface UseTransactionFormsProps {
  transactions: Transaction[];
  categories: Category[];
  dashboardState: any; // Simplified for now, should be typed
}

export const useTransactionForms = ({ transactions, categories, dashboardState }: UseTransactionFormsProps) => {
  const transactionActions = useTransactionActions({
    categories,
    dashboardState,
    expandedCats: dashboardState.expandedCats,
    monthOffset: dashboardState.monthOffset,
    categoryFilter: dashboardState.categoryFilter,
  });

  // === EDIT DIALOG STATE ===
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  // === MANUAL ENTRY DIALOG STATE ===
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

  // === DIALOG OPEN HANDLERS ===
  const handleOpenEditDialog = useCallback((selectedTransactionIds: Set<string>) => {
    if (selectedTransactionIds.size !== 1) {
      alert(selectedTransactionIds.size === 0 
        ? 'Zaznacz transakcję do edycji.' 
        : 'Można edytować tylko jedną transakcję na raz.'
      );
      return;
    }
    const transactionId = selectedTransactionIds.values().next().value;
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
      setEditingTransaction(transaction);
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
    }
  }, [transactions]);

  const handleOpenManualEntryDialog = useCallback(() => {
    if (!dashboardState.clickedCell) {
      alert('Najpierw kliknij na komórkę w tabeli, aby wybrać kategorię i miesiąc.');
      return;
    }
    
    const [year, month] = dashboardState.clickedCell.monthKey.split('-');
    const firstDayOfMonth = `${year}-${month}-01`;
    
    setManualEntryFormData(prev => ({
      ...prev,
      date: firstDayOfMonth,
      category: dashboardState.clickedCell.categoryId,
      amount: '',
      payee: '',
      description: '',
      seriesRepetitions: 1,
      seriesIntervalMonths: 1,
    }));
    
    setIsManualEntryDialogOpen(true);
  }, [dashboardState.clickedCell]);

  // === SAVE HANDLERS ===
  const handleSaveEdit = useCallback(async () => {
    if (!editingTransaction) return;

    await transactionActions.editTransaction(editingTransaction.id, editFormData);
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  }, [editingTransaction, editFormData, transactionActions]);

  const handleSaveManualEntry = useCallback(async () => {
    await transactionActions.createTransaction(manualEntryFormData);
    setIsManualEntryDialogOpen(false);
  }, [manualEntryFormData, transactionActions]);

  return {
    // Edit Dialog
    isEditDialogOpen,
    setIsEditDialogOpen,
    editFormData,
    setEditFormData,
    handleOpenEditDialog,
    handleSaveEdit,
    editingTransaction,
    setEditingTransaction,

    // Manual Entry Dialog
    isManualEntryDialogOpen,
    setIsManualEntryDialogOpen,
    manualEntryFormData,
    setManualEntryFormData,
    handleOpenManualEntryDialog,
    handleSaveManualEntry,
  };
};
