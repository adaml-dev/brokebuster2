/**
 * usePivotCalculations Hook
 * Oblicza dane dla pivot table (kolumny, wartości, sumy)
 */

import { useMemo } from "react";
import { Transaction, Category, PivotData, ColumnData, AccountStatement } from "@/lib/types/dashboard";
import {
  getMonthKey,
  safeDate,
  shouldIncludeTransaction,
  buildCategoryTree,
} from "@/lib/utils/dashboard";

interface UsePivotCalculationsProps {
  transactions: Transaction[];
  categories: Category[];
  selectedYear: number;
  monthOffset: number;
  accountStatements: AccountStatement[];
  calculationMode: 'mixed' | 'planned' | 'done' | 'diff';
  starredOnly?: boolean;
  hideUnstarredParents?: boolean;
  numMonths?: number;
}

export const usePivotCalculations = ({
  transactions,
  categories,
  selectedYear,
  monthOffset,
  accountStatements,
  calculationMode,
  starredOnly = false,
  hideUnstarredParents = false,
  numMonths = 12,
}: UsePivotCalculationsProps): PivotData => {
  return useMemo(() => {
    const today = new Date();
    const currentMonthKey = getMonthKey(today);

    // Helpers to match category efficiently
    const categoryMap = new Map<string, Category>();
    const categoryNameMap = new Map<string, Category>();

    categories.forEach(c => {
      categoryMap.set(c.id, c);
      categoryNameMap.set(c.name.toLowerCase().trim(), c);
    });

    const getMatchedCategory = (t: Transaction): Category | undefined => {
      if (!t.category) return undefined;
      const idMatch = categoryMap.get(t.category);
      if (idMatch) return idMatch;
      const name = t.category.toString().trim().toLowerCase();
      return categoryNameMap.get(name);
    };

    // 1. Kolumny - numMonths miesięcy
    const columns: ColumnData[] = [];
    for (let i = 0; i < numMonths; i++) {
      const d = new Date(selectedYear, 0 + monthOffset + i, 1);
      columns.push({
        date: d,
        key: getMonthKey(d),
        label: d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' })
      });
    }

    // 2. Mapa wartości BEZPOŚREDNICH (Direct Values)
    const directValuesMap: Record<string, Record<string, number>> = {};

    transactions.forEach(t => {
      const matchedCategory = getMatchedCategory(t);

      if (matchedCategory) {
        const monthKey = getMonthKey(safeDate(t.date));
        let amountToAdd = 0;

        const isDone = t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true;
        const isPlanned = t.transaction_type === 'planned';

        if (calculationMode === 'mixed') {
          if (shouldIncludeTransaction(t, currentMonthKey)) {
            amountToAdd = Number(t.amount);
          }
        } else if (calculationMode === 'planned') {
          if (isPlanned) amountToAdd = Number(t.amount);
        } else if (calculationMode === 'done') {
          if (isDone) amountToAdd = Number(t.amount);
        } else if (calculationMode === 'diff') {
          if (isPlanned) amountToAdd -= Number(t.amount);
          if (isDone) amountToAdd += Number(t.amount);
        }

        if (amountToAdd !== 0) {
          const catId = matchedCategory.id;
          if (!directValuesMap[catId]) directValuesMap[catId] = {};
          if (!directValuesMap[catId][monthKey]) directValuesMap[catId][monthKey] = 0;
          directValuesMap[catId][monthKey] += amountToAdd;
        }
      }
    });

    // Cache archived category IDs
    const archivedCategoryIds = new Set<string>();
    
    const isCategoryArchived = (catId: string): boolean => {
      let current = categoryMap.get(catId);
      while (current) {
        if (current.is_archived) return true;
        current = current.parent ? categoryMap.get(current.parent) : undefined;
      }
      return false;
    };

    categories.forEach(cat => {
      if (isCategoryArchived(cat.id)) {
        archivedCategoryIds.add(cat.id);
      }
    });

    const activeCategories = categories.filter(cat => !archivedCategoryIds.has(cat.id));

    // 3. Budowa drzewa
    const categoryTree = buildCategoryTree(activeCategories);

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

    // Pruning logic for starredOnly (Case A: tree structure preserved)
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

    // Flat tree logic for starredOnly (Case B: unstarred parents hidden)
    const buildFlatTree = (): Category[] => {
      // 1. Filter categories to only keep visible ones
      const visibleCats = activeCategories.filter(c => c.is_starred || hasStarredAncestor(c.id));
      
      // 2. Create new nodes
      const map = new Map<string, Category>();
      visibleCats.forEach(c => {
        map.set(c.id, { ...c, children: [] });
      });

      const roots: Category[] = [];
      
      // 3. Link them
      visibleCats.forEach(c => {
        const node = map.get(c.id)!;
        if (c.parent && map.has(c.parent)) {
          map.get(c.parent)!.children!.push(node);
        } else {
          roots.push(node);
        }
      });

      // Sort by order/name
      const sortTree = (nodes: Category[]) => {
        nodes.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
        nodes.forEach(n => {
          if (n.children) sortTree(n.children);
        });
      };
      sortTree(roots);
      
      return roots;
    };

    let finalCategoryTree = categoryTree;
    const visibleCategoryIds = new Set<string>();

    if (starredOnly) {
      if (hideUnstarredParents) {
        finalCategoryTree = buildFlatTree();
      } else {
        finalCategoryTree = pruneTree(categoryTree);
      }
      
      const collectIds = (nodes: Category[]) => {
        nodes.forEach(n => {
          visibleCategoryIds.add(n.id);
          if (n.children) collectIds(n.children);
        });
      };
      collectIds(finalCategoryTree);
    }

    // 4. Mapa wartości CAŁKOWITYCH (Total Values - z rekurencją)
    const totalValuesMap: Record<string, Record<string, number>> = {};

    // Funkcja rekurencyjna która zwraca sumy dla danego węzła (swoje + dzieci)
    const calculateTotals = (node: Category): Record<string, number> => {
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
        node.children.forEach((child: Category) => {
          if (!starredOnly || visibleCategoryIds.has(child.id)) {
            const childTotals = calculateTotals(child);
            columns.forEach((col: ColumnData) => {
              nodeTotals[col.key] += childTotals[col.key];
            });
          }
        });
      }

      // Zapisz wynik w mapie globalnej
      totalValuesMap[node.id] = nodeTotals;
      return nodeTotals;
    };

    // Uruchom obliczanie dla wszystkich głównych gałęzi w finalnym drzewie
    finalCategoryTree.forEach((rootNode: Category) => calculateTotals(rootNode));

    // Oblicz sumy dla "Reszty kategorii" oraz "Reszty transakcji" (zarchiwizowane)
    const restCategoriesTotals: Record<string, number> = {};
    const restTransactionsTotals: Record<string, number> = {};
    columns.forEach(col => {
      restCategoriesTotals[col.key] = 0;
      restTransactionsTotals[col.key] = 0;
    });

    categories.forEach(cat => {
      const isArchived = archivedCategoryIds.has(cat.id);
      if (isArchived) {
        if (directValuesMap[cat.id]) {
          columns.forEach(col => {
            restTransactionsTotals[col.key] += (directValuesMap[cat.id][col.key] || 0);
          });
        }
      } else if (starredOnly && !visibleCategoryIds.has(cat.id)) {
        if (directValuesMap[cat.id]) {
          columns.forEach(col => {
            restCategoriesTotals[col.key] += (directValuesMap[cat.id][col.key] || 0);
          });
        }
      }
    });

    // 5. OBLICZ MONTHLY TOTALS
    const monthlyTotals: Record<string, number> = {};
    columns.forEach((col: ColumnData) => monthlyTotals[col.key] = 0);

    transactions.forEach(t => {
      const monthKey = getMonthKey(safeDate(t.date));
      if (monthlyTotals[monthKey] === undefined) return;

      // Only include categorized transactions in the balance
      const matchedCategory = getMatchedCategory(t);
      if (!matchedCategory) return;

      const isDone = t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true;
      const isPlanned = t.transaction_type === 'planned';

      if (calculationMode === 'mixed') {
        if (shouldIncludeTransaction(t, currentMonthKey)) {
          monthlyTotals[monthKey] += Number(t.amount);
        }
      } else if (calculationMode === 'planned') {
        if (isPlanned) monthlyTotals[monthKey] += Number(t.amount);
      } else if (calculationMode === 'done') {
        if (isDone) monthlyTotals[monthKey] += Number(t.amount);
      } else if (calculationMode === 'diff') {
        if (isPlanned) monthlyTotals[monthKey] -= Number(t.amount);
        if (isDone) monthlyTotals[monthKey] += Number(t.amount);
      }
    });

    // 6. OBLICZ CUMULATIVE TOTALS
    let oldestDate: Date | null = null;
    for (const t of transactions) {
      if (shouldIncludeTransaction(t, currentMonthKey)) {
        const tDate = safeDate(t.date);
        if (!oldestDate || tDate < oldestDate) {
          oldestDate = tDate;
        }
      }
    }

    // Oblicz wszystkie miesięczne sumy od najstarszej daty
    const allMonthlyTotals: Record<string, number> = {};
    if (oldestDate) {
      const startDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
      const endDate = columns.length > 0 ? columns[columns.length - 1].date : new Date();

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const key = getMonthKey(currentDate);
        allMonthlyTotals[key] = 0;
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }

      // Wypełnij wartościami z transakcji
      transactions.forEach(t => {
        const monthKey = getMonthKey(safeDate(t.date));
        if (allMonthlyTotals[monthKey] === undefined) return;

        // Only include categorized transactions in the balance
        const matchedCategory = getMatchedCategory(t);
        if (!matchedCategory) return;

        const isDone = t.transaction_type === 'done' || t.source === 'import' || t.is_archived === true;
        const isPlanned = t.transaction_type === 'planned';

        if (calculationMode === 'mixed') {
          if (shouldIncludeTransaction(t, currentMonthKey)) {
            allMonthlyTotals[monthKey] += Number(t.amount);
          }
        } else if (calculationMode === 'planned') {
          if (isPlanned) allMonthlyTotals[monthKey] += Number(t.amount);
        } else if (calculationMode === 'done') {
          if (isDone) allMonthlyTotals[monthKey] += Number(t.amount);
        } else if (calculationMode === 'diff') {
          if (isPlanned) allMonthlyTotals[monthKey] -= Number(t.amount);
          if (isDone) allMonthlyTotals[monthKey] += Number(t.amount);
        }
      });
    }

    // Oblicz kumulację od początku czasu
    const cumulativeTotals: Record<string, number> = {};
    let runningTotal = 0;

    if (oldestDate) {
      const startDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
      const endDate = columns.length > 0 ? columns[columns.length - 1].date : new Date();

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const key = getMonthKey(currentDate);
        runningTotal += allMonthlyTotals[key] || 0;
        cumulativeTotals[key] = runningTotal;
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    }

    // 7. OBLICZ ACCOUNT BALANCES (Stany kont)
    const accountBalances: Record<string, number | null> = {};
    const balanceDiffs: Record<string, number | null> = {};

    columns.forEach(col => {
      // Sprawdzamy czy w TYM MIESIĄCU były jakiekolwiek zapisy stanu konta
      const hasStatementsInMonth = accountStatements.some(s => {
        try {
          const sDate = new Date(s.date);
          const sYear = sDate.getFullYear();
          const sMonth = sDate.getMonth();
          const colDate = col.date;
          return sYear === colDate.getFullYear() && sMonth === colDate.getMonth();
        } catch {
          return false;
        }
      });

      if (!hasStatementsInMonth) {
        accountBalances[col.key] = null;
        balanceDiffs[col.key] = null;
        return;
      }

      // Dla każdej kolumny (miesiąca) obliczamy stan kont na koniec tego miesiąca
      // Bierzemy ostatni dzień miesiąca
      const lastDayOfMonth = new Date(col.date.getFullYear(), col.date.getMonth() + 1, 0);
      lastDayOfMonth.setHours(23, 59, 59, 999);

      // Grupujemy statementy po account_id i bierzemy najmłodszy nie późniejszy niż lastDayOfMonth
      const latestStatements = new Map<string, AccountStatement>();

      accountStatements.forEach(s => {
        const sDate = new Date(s.date);
        // Check if statement belongs to the current column month
        if (getMonthKey(sDate) === col.key) {
          const existing = latestStatements.get(s.account_id);
          if (!existing || new Date(s.date) > new Date(existing.date)) {
            latestStatements.set(s.account_id, s);
          } else if (new Date(s.date).getTime() === new Date(existing.date).getTime()) {
            // Jeśli daty są identyczne, bierzemy ten z późniejszą datą utworzenia
            if (s.created_at && existing.created_at && new Date(s.created_at) > new Date(existing.created_at)) {
              latestStatements.set(s.account_id, s);
            }
          }
        }
      });

      // Sumujemy saldo ze wszystkich kont
      let total = 0;
      latestStatements.forEach(s => total += Number(s.balance));
      accountBalances[col.key] = total;

      // Oblicz różnicę miedzy stanem kont a bilansem narastającym
      const cumulative = cumulativeTotals[col.key] || 0;
      balanceDiffs[col.key] = total - cumulative;
    });

    return {
      columns,
      totalValuesMap,
      categoryTree: finalCategoryTree,
      monthlyTotals,
      cumulativeTotals,
      accountBalances,
      balanceDiffs,
      currentMonthKey,
      restCategoriesTotals,
      restTransactionsTotals
    };
  }, [transactions, categories, monthOffset, selectedYear, accountStatements, calculationMode, starredOnly, hideUnstarredParents]);
};
