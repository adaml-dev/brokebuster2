/**
 * useDashboardState Hook
 * Zarządza stanem dashboardu i synchronizację z localStorage
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Category, CellInfo, Transaction } from "@/lib/types/dashboard";
import { getMonthKey, safeDate, getAllCategoryIds, getCategoryPath } from "@/lib/utils/dashboard";

interface UseDashboardStateProps {
  categories: Category[];
  transactions: Transaction[];
}

export const useDashboardState = ({ categories, transactions }: UseDashboardStateProps) => {
  // Stan rozwijania kategorii
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  
  // Stan filtrowania kategorii
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  // Stan nawigacji
  const [monthOffset, setMonthOffset] = useState(0);
  
  // Stan klikniętej komórki
  const [clickedCell, setClickedCell] = useState<CellInfo | null>(null);
  const [isCellInfoExpanded, setIsCellInfoExpanded] = useState(false);
  
  // Stan sortowania i filtrowania transakcji
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionFilter, setTransactionFilter] = useState('');
  
  // Stan toggle button (assigned/unassigned transactions)
  const [showUnassigned, setShowUnassigned] = useState(false);
  
  // Stan zaznaczonych transakcji
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [assignToCategoryId, setAssignToCategoryId] = useState<string>('');
  const [categorySearchFilter, setCategorySearchFilter] = useState<string>('');
  
  // Flaga wskazująca czy stan został już załadowany
  const stateLoadedRef = useRef(false);

  // Funkcja do kliknięcia komórki
  const handleCellClick = useCallback((categoryId: string, monthKey: string, monthLabel: string) => {
    const allCategoryIds = getAllCategoryIds(categoryId, categories);
    
    const categoryTransactions = transactions.filter(t => {
      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const matchedCategory = categories.find(c => 
        c.id === t.category || 
        c.name.toLowerCase().trim() === transCategoryName 
      );
      
      if (matchedCategory && allCategoryIds.includes(matchedCategory.id)) {
        const tMonthKey = getMonthKey(safeDate(t.date));
        return tMonthKey === monthKey;
      }
      return false;
    });
    
    const doneTransactions = categoryTransactions.filter(t => 
      t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true
    );
    const plannedTransactions = categoryTransactions.filter(t => 
      t.transaction_type === 'planned'
    );
    
    const doneSum = doneTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const plannedSum = plannedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    setClickedCell({
      monthKey,
      monthLabel,
      categoryPath: getCategoryPath(categoryId, categories),
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
  }, [categories, transactions]);

  // Toggle kategoria
  const toggleCategory = useCallback((catId: string) => {
    const newSet = new Set(expandedCats);
    if (newSet.has(catId)) {
      newSet.delete(catId);
    } else {
      newSet.add(catId);
    }
    setExpandedCats(newSet);
  }, [expandedCats]);

  // Expand all by one level
  const expandAllByOneLevel = useCallback(() => {
    const newSet = new Set(expandedCats);
    categories.forEach(cat => {
      if (cat.parent === null) {
        newSet.add(cat.id);
      }
    });
    setExpandedCats(newSet);
  }, [categories, expandedCats]);

  // Collapse all by one level
  const collapseAllByOneLevel = useCallback(() => {
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
    
    const newSet = new Set(expandedCats);
    expandedWithDepth.forEach(item => {
      if (item.depth === maxDepth) {
        newSet.delete(item.id);
      }
    });
    
    setExpandedCats(newSet);
  }, [categories, expandedCats]);

  // Efekt: Załaduj stan z localStorage
  useEffect(() => {
    if (stateLoadedRef.current || categories.length === 0) {
      return;
    }
    
    stateLoadedRef.current = true;
    
    const savedState = localStorage.getItem('dashboardState');
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        
        if (parsed.expandedCats && Array.isArray(parsed.expandedCats)) {
          setExpandedCats(new Set(parsed.expandedCats));
        }
        
        if (typeof parsed.monthOffset === 'number') {
          setMonthOffset(parsed.monthOffset);
        }
        
        if (parsed.categoryFilter) {
          setCategoryFilter(parsed.categoryFilter);
        }
        
        if (parsed.clickedCell) {
          const categoryId = parsed.clickedCell.categoryId;
          const monthKey = parsed.clickedCell.monthKey;
          const monthLabel = parsed.clickedCell.monthLabel;
          
          setTimeout(() => {
            handleCellClick(categoryId, monthKey, monthLabel);
            
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
            if (parsed.sortColumn) {
              setSortColumn(parsed.sortColumn);
            }
            if (parsed.sortDirection) {
              setSortDirection(parsed.sortDirection);
            }
          }, 100);
        }
        
        localStorage.removeItem('dashboardState');
        
      } catch (error) {
        console.error('Error parsing saved dashboard state:', error);
        const initialExpanded = new Set<string>();
        categories.forEach(c => {
          if (c.is_expanded) initialExpanded.add(c.id);
        });
        setExpandedCats(initialExpanded);
      }
    } else {
      const initialExpanded = new Set<string>();
      categories.forEach(c => {
        if (c.is_expanded) initialExpanded.add(c.id);
      });
      setExpandedCats(initialExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  return {
    // Stan
    expandedCats,
    categoryFilter,
    showCategoryFilter,
    monthOffset,
    clickedCell,
    isCellInfoExpanded,
    sortColumn,
    sortDirection,
    transactionFilter,
    showUnassigned,
    selectedTransactionIds,
    assignToCategoryId,
    categorySearchFilter,
    
    // Akcje
    setExpandedCats,
    setCategoryFilter,
    setShowCategoryFilter,
    setMonthOffset,
    setClickedCell,
    setIsCellInfoExpanded,
    setSortColumn,
    setSortDirection,
    setTransactionFilter,
    setShowUnassigned,
    setSelectedTransactionIds,
    setAssignToCategoryId,
    setCategorySearchFilter,
    
    // Funkcje
    handleCellClick,
    toggleCategory,
    expandAllByOneLevel,
    collapseAllByOneLevel,
  };
};
