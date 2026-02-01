/**
 * Dashboard Utility Functions
 * Funkcje pomocnicze używane w komponencie Dashboard
 */

import { Category, Transaction } from "@/lib/types/dashboard";

// --- FORMATOWANIE ---

export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pl-PL");
  } catch {
    return dateStr;
  }
};

// --- OPERACJE NA DATACH ---

export const safeDate = (dateStr: string): Date => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date();
    return d;
  } catch {
    return new Date();
  }
};

export const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- LOGIKA TRANSAKCJI ---

export const shouldIncludeTransaction = (
  transaction: Transaction,
  currentMonthKey: string
): boolean => {
  const tDate = safeDate(transaction.date);
  const tMonthKey = getMonthKey(tDate);

  if (tMonthKey < currentMonthKey) {
    // Przeszłość: Tylko DONE, Import lub Archiwalne
    return (
      transaction.transaction_type === 'done' ||
      transaction.source === 'import' ||
      transaction.is_archived === true
    );
  } else {
    // Przyszłość/Teraźniejszość: Tylko PLANNED
    return transaction.transaction_type === 'planned';
  }
};

// --- OPERACJE NA KATEGORIACH ---

export const getCategoryPath = (
  categoryId: string,
  categories: Category[]
): string[] => {
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

export const getAllCategoryIds = (
  categoryId: string,
  categories: Category[]
): string[] => {
  const ids = [categoryId];
  const category = categories.find(c => c.id === categoryId);

  if (category) {
    const children = categories.filter(c => c.parent === categoryId);
    children.forEach(child => {
      ids.push(...getAllCategoryIds(child.id, categories));
    });
  }

  return ids;
};

// --- FILTROWANIE KATEGORII ---

export const shouldShowCategory = (
  category: Category,
  categoryFilter: string,
  categories: Category[],
  parentMatches: boolean = false
): boolean => {
  if (!categoryFilter.trim()) return true;

  const filterLower = categoryFilter.toLowerCase();
  const nameMatches = category.name.toLowerCase().includes(filterLower);

  // Jeśli kategoria pasuje do filtra, pokaż ją
  if (nameMatches) return true;

  // Jeśli rodzic pasuje, pokaż wszystkie dzieci z is_expanded
  if (parentMatches && category.is_expanded) return true;

  // Sprawdź czy któreś z dzieci pasuje do filtra
  if (category.children && category.children.length > 0) {
    const hasMatchingChild = category.children.some((child: Category) =>
      shouldShowCategory(child, categoryFilter, categories, nameMatches || parentMatches)
    );
    if (hasMatchingChild) return true;
  }

  return false;
};

// --- BUDOWANIE DRZEWA KATEGORII ---

export const buildCategoryTree = (categories: Category[]): Category[] => {
  const sortedCats = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  const buildTree = (parentId: string | null): Category[] => {
    return sortedCats
      .filter((c): c is Category => c.parent === parentId)
      .map((c): Category => ({
        ...c,
        children: buildTree(c.id)
      }));
  };

  return buildTree(null);
};

// --- GŁĘBOKOŚĆ KATEGORII ---

export const getCategoryDepth = (categoryId: string, categories: Category[]): number => {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat || !cat.parent) return 0;
  return 1 + getCategoryDepth(cat.parent, categories);
};

// --- UNIKALNE WARTOŚCI ---

export const getUniqueOrigins = (transactions: Transaction[]): string[] => {
  const origins = new Set<string>();
  transactions.forEach(t => {
    if (t.origin && t.origin.trim()) {
      origins.add(t.origin.trim());
    }
  });
  const sorted = Array.from(origins).sort();
  // Upewnij się że "cash" jest na liście
  if (!sorted.includes('cash')) {
    sorted.unshift('cash');
  }
  return sorted;
};

// --- SPRAWDZANIE KATEGORII (LEAF) ---

export const isLeafCategory = (categoryId: string, categories: Category[]): boolean => {
  return !categories.some(c => c.parent === categoryId);
};

export const getLeafCategories = (categories: Category[]): Category[] => {
  const parentIds = new Set(
    categories
      .map(c => c.parent)
      .filter((id): id is string => id !== null)
  );

  return categories.filter(c => !parentIds.has(c.id));
};

