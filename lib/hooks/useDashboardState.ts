/**
 * useDashboardState Hook
 * Zarządza stanem dashboardu i synchronizację z localStorage
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Category, CellInfo, Transaction } from "@/lib/types/dashboard";
import { getMonthKey, safeDate, getAllCategoryIds, getCategoryPath } from "@/lib/utils/dashboard";

// useLayoutEffect on the client (restores the view before first paint), useEffect on the server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface UseDashboardStateProps {
  categories: Category[];
  transactions: Transaction[];
  /** Prefiks klucza localStorage – każdy widok dashboardu pamięta swój stan osobno */
  storageKey?: string;
}

// Zapamiętany widok dashboardu
interface SavedViewState {
  firstMonth: string; // "YYYY-MM" – zapisany absolutnie, bo monthOffset liczy się od stycznia bieżącego roku
  starredOnly: boolean;
  hideUnstarredParents: boolean;
  expandedCats: string[];
}

// monthOffset jest liczony od stycznia bieżącego roku (jak selectedYear w dashboardach)
const offsetToMonth = (offset: number) => {
  const d = new Date(new Date().getFullYear(), offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthToOffset = (month: string): number | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  return (Number(match[1]) - new Date().getFullYear()) * 12 + Number(match[2]) - 1;
};

export const useDashboardState = ({ categories, transactions, storageKey = "dashboard" }: UseDashboardStateProps) => {
  const viewStorageKey = `${storageKey}ViewState`;

  // Stan rozwijania kategorii
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Widok tylko kategorii z gwiazdką
  const [starredOnly, setStarredOnly] = useState(false);
  const [hideUnstarredParents, setHideUnstarredParents] = useState(false);
  const [viewLoaded, setViewLoaded] = useState(false);

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

  // Stan trybu obliczeń
  const [calculationMode, setCalculationMode] = useState<'mixed' | 'planned' | 'done' | 'diff'>('mixed');

  // Efekt: Wyczyść zaznaczone transakcje, gdy zmieniają się filtry
  useEffect(() => {
    // Działaj tylko po pierwszym załadowaniu stanu
    if (stateLoadedRef.current) {
      setSelectedTransactionIds(new Set());
    }
  }, [transactionFilter, showUnassigned]);

  // Flaga wskazująca czy stan został już załadowany
  const stateLoadedRef = useRef(false);

  // Funkcja do kliknięcia komórki
  const handleCellClick = useCallback((
    categoryId: string,
    monthKey: string,
    monthLabel: string,
    starredOnly?: boolean,
    hideUnstarredParents?: boolean
  ) => {
    const isStarredOnly = starredOnly !== undefined ? starredOnly : (categoryId === "__REST_CATEGORIES__");
    const isHideUnstarredParents = hideUnstarredParents !== undefined ? hideUnstarredParents : false;

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const isCategoryArchived = (catId: string): boolean => {
      let current = categoryMap.get(catId);
      while (current) {
        if (current.is_archived) return true;
        current = current.parent ? categoryMap.get(current.parent) : undefined;
      }
      return false;
    };

    // Cache list of archived and active category IDs
    const archivedCategoryIds = new Set<string>();
    categories.forEach(cat => {
      if (isCategoryArchived(cat.id)) {
        archivedCategoryIds.add(cat.id);
      }
    });

    const activeCategories = categories.filter(cat => !archivedCategoryIds.has(cat.id));

    // For "__REST_CATEGORIES__", build visible Category list if starredOnly is true
    const visibleCategoryIds = new Set<string>();
    if (isStarredOnly) {
      const childrenMap = new Map<string, string[]>();
      activeCategories.forEach(c => {
        if (c.parent) {
          if (!childrenMap.has(c.parent)) childrenMap.set(c.parent, []);
          childrenMap.get(c.parent)!.push(c.id);
        }
      });

      const hasStarredAncestor = (catId: string): boolean => {
        let current = categoryMap.get(catId);
        while (current) {
          if (current.is_starred) return true;
          current = current.parent ? categoryMap.get(current.parent) : undefined;
        }
        return false;
      };

      const hasStarredDescendant = (catId: string): boolean => {
        const children = childrenMap.get(catId) || [];
        for (const childId of children) {
          const child = categoryMap.get(childId);
          if (child && (child.is_starred || hasStarredDescendant(childId))) {
            return true;
          }
        }
        return false;
      };

      const pruneTree = (nodes: Category[], parentStarred = false): Category[] => {
        return nodes
          .map(node => {
            const isNodeStarred = !!node.is_starred || parentStarred;
            const keepNode = isNodeStarred || hasStarredDescendant(node.id);
            if (keepNode) {
              const prunedChildren = node.children ? pruneTree(node.children, isNodeStarred) : [];
              return {
                ...node,
                children: prunedChildren
              } as Category;
            }
            return null;
          })
          .filter((node): node is Category => node !== null);
      };

      if (isHideUnstarredParents) {
        const visibleCats = activeCategories.filter(c => c.is_starred || hasStarredAncestor(c.id));
        visibleCats.forEach(c => visibleCategoryIds.add(c.id));
      } else {
        // build complete categoryTree first
        const buildCategoryTree = (cats: Category[]): Category[] => {
          const map = new Map<string, Category>();
          cats.forEach(c => map.set(c.id, { ...c, children: [] }));
          const roots: Category[] = [];
          cats.forEach(c => {
            const node = map.get(c.id)!;
            if (c.parent && map.has(c.parent)) {
              map.get(c.parent)!.children!.push(node);
            } else {
              roots.push(node);
            }
          });
          return roots;
        };

        const categoryTree = buildCategoryTree(activeCategories);
        const pruned = pruneTree(categoryTree);
        const collectIds = (nodes: Category[]) => {
          nodes.forEach(n => {
            visibleCategoryIds.add(n.id);
            if (n.children) collectIds(n.children);
          });
        };
        collectIds(pruned);
      }
    }

    const allCategoryIds = categoryId !== "__REST_TRANSACTIONS__" && categoryId !== "__REST_CATEGORIES__"
      ? getAllCategoryIds(categoryId, categories)
      : [];

    const categoryTransactions = transactions.filter(t => {
      const tMonthKey = getMonthKey(safeDate(t.date));
      if (tMonthKey !== monthKey) return false;

      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const matchedCategory = categories.find(c =>
        c.id === t.category ||
        c.name.toLowerCase().trim() === transCategoryName
      );

      if (!matchedCategory) return false;

      if (categoryId === "__REST_TRANSACTIONS__") {
        return archivedCategoryIds.has(matchedCategory.id);
      }

      if (categoryId === "__REST_CATEGORIES__") {
        return activeCategories.some(c => c.id === matchedCategory.id) && !visibleCategoryIds.has(matchedCategory.id);
      }

      if (allCategoryIds.includes(matchedCategory.id)) {
        return true;
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

    let categoryPath = ["Reszta transakcji"];
    if (categoryId === "__REST_CATEGORIES__") {
      categoryPath = ["Reszta kategorii"];
    } else if (categoryId !== "__REST_TRANSACTIONS__") {
      categoryPath = getCategoryPath(categoryId, categories);
    }

    setClickedCell({
      monthKey,
      monthLabel,
      categoryPath,
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
    setSelectedTransactionIds(new Set()); // Czyszczenie zaznaczonych transakcji
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

  // Efekt: Przywróć zapamiętany widok (pierwszy miesiąc, gwiazdka, rozwinięte gałęzie) przed pierwszym rysowaniem
  useIsomorphicLayoutEffect(() => {
    if (stateLoadedRef.current) return;
    stateLoadedRef.current = true;

    try {
      // Stary jednorazowy snapshot z czasów przeładowywania strony – po przejściu na router.refresh()
      // przywracał nieaktualny stan przy kolejnym wejściu na dashboard, więc tylko go sprzątamy
      localStorage.removeItem("dashboardState");

      const savedView = localStorage.getItem(viewStorageKey);
      if (savedView) {
        const parsed = JSON.parse(savedView) as Partial<SavedViewState>;
        if (Array.isArray(parsed.expandedCats)) setExpandedCats(new Set(parsed.expandedCats));
        const offset = typeof parsed.firstMonth === "string" ? monthToOffset(parsed.firstMonth) : null;
        if (offset !== null) setMonthOffset(offset);
        if (typeof parsed.starredOnly === "boolean") setStarredOnly(parsed.starredOnly);
        if (typeof parsed.hideUnstarredParents === "boolean") setHideUnstarredParents(parsed.hideUnstarredParents);
      } else {
        // Brak zapisanego widoku – rozwinięte gałęzie ze starszego klucza albo domyślne z bazy
        const savedExpanded = localStorage.getItem("dashboardExpandedCategories");
        const parsedExpanded = savedExpanded ? JSON.parse(savedExpanded) : null;
        if (Array.isArray(parsedExpanded)) {
          setExpandedCats(new Set(parsedExpanded));
        } else {
          setExpandedCats(new Set(categories.filter(c => c.is_expanded).map(c => c.id)));
        }
      }
    } catch (error) {
      console.error("Error loading saved dashboard view:", error);
    }

    setViewLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efekt: Zapisuj widok przy każdej zmianie (dopiero po przywróceniu, żeby nie nadpisać go wartościami domyślnymi)
  useEffect(() => {
    if (!viewLoaded) return;
    const view: SavedViewState = {
      firstMonth: offsetToMonth(monthOffset),
      starredOnly,
      hideUnstarredParents,
      expandedCats: Array.from(expandedCats),
    };
    try {
      localStorage.setItem(viewStorageKey, JSON.stringify(view));
    } catch {
      // Brak dostępu do localStorage – widok po prostu nie zostanie zapamiętany
    }
  }, [viewLoaded, viewStorageKey, monthOffset, starredOnly, hideUnstarredParents, expandedCats]);

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
    calculationMode,
    starredOnly,
    hideUnstarredParents,

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
    setCalculationMode,
    setStarredOnly,
    setHideUnstarredParents,

    // Funkcje
    handleCellClick,
    toggleCategory,
    expandAllByOneLevel,
    collapseAllByOneLevel,
  };
};
