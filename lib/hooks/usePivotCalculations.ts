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
}

export const usePivotCalculations = ({
  transactions,
  categories,
  selectedYear,
  monthOffset,
  accountStatements,
}: UsePivotCalculationsProps): PivotData => {
  return useMemo(() => {
    const today = new Date();
    const currentMonthKey = getMonthKey(today);

    // 1. Kolumny - 12 miesięcy
    const columns: ColumnData[] = [];
    for (let i = 0; i < 12; i++) {
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
      const transCategoryName = (t.category || "").toString().trim().toLowerCase();
      const matchedCategory = categories.find(c =>
        c.id === t.category ||
        c.name.toLowerCase().trim() === transCategoryName
      );

      if (matchedCategory) {
        if (shouldIncludeTransaction(t, currentMonthKey)) {
          const catId = matchedCategory.id;
          const monthKey = getMonthKey(safeDate(t.date));

          if (!directValuesMap[catId]) directValuesMap[catId] = {};
          if (!directValuesMap[catId][monthKey]) directValuesMap[catId][monthKey] = 0;

          directValuesMap[catId][monthKey] += Number(t.amount);
        }
      }
    });

    // 3. Budowa drzewa
    const categoryTree = buildCategoryTree(categories);

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
          const childTotals = calculateTotals(child);
          columns.forEach((col: ColumnData) => {
            nodeTotals[col.key] += childTotals[col.key];
          });
        });
      }

      // Zapisz wynik w mapie globalnej
      totalValuesMap[node.id] = nodeTotals;
      return nodeTotals;
    };

    // Uruchom obliczanie dla wszystkich głównych gałęzi
    categoryTree.forEach((rootNode: Category) => calculateTotals(rootNode));

    // 5. OBLICZ MONTHLY TOTALS
    const monthlyTotals: Record<string, number> = {};
    columns.forEach((col: ColumnData) => monthlyTotals[col.key] = 0);

    transactions.forEach(t => {
      if (shouldIncludeTransaction(t, currentMonthKey)) {
        const monthKey = getMonthKey(safeDate(t.date));
        if (monthlyTotals[monthKey] !== undefined) {
          monthlyTotals[monthKey] += Number(t.amount);
        }
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
        if (shouldIncludeTransaction(t, currentMonthKey)) {
          const monthKey = getMonthKey(safeDate(t.date));
          if (allMonthlyTotals[monthKey] !== undefined) {
            allMonthlyTotals[monthKey] += Number(t.amount);
          }
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
      categoryTree,
      monthlyTotals,
      cumulativeTotals,
      accountBalances,
      balanceDiffs
    };
  }, [transactions, categories, monthOffset, selectedYear, accountStatements]);
};
