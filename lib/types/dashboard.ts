/**
 * Dashboard Types
 * Typy danych używane w komponencie Dashboard
 */

// --- TYPY BAZY DANYCH ---

export interface Transaction {
  id: string;
  date: string;
  transaction_type: 'planned' | 'done';
  amount: number;
  payee?: string;
  description?: string;
  origin?: string;
  source?: string;
  category?: string;
  is_archived?: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  parent: string | null;
  order?: number;
  is_expanded?: boolean;
  children?: Category[];
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
}

// --- TYPY KOMPONENTU ---

export interface DashboardClientProps {
  userEmail: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  weightLogs: WeightLog[];
  rules: Rule[];
}

export interface CellInfo {
  monthKey: string;
  monthLabel: string;
  categoryPath: string[];
  categoryId: string;
  doneCount: number;
  plannedCount: number;
  doneSum: number;
  plannedSum: number;
  transactions: Transaction[];
}

export interface ColumnData {
  date: Date;
  key: string;
  label: string;
}

export interface PivotData {
  columns: ColumnData[];
  totalValuesMap: Record<string, Record<string, number>>;
  categoryTree: Category[];
  monthlyTotals: Record<string, number>;
  cumulativeTotals: Record<string, number>;
}

// --- TYPY FORMULARZY ---

export interface EditFormData {
  date: string;
  transaction_type: string;
  amount: string;
  payee: string;
  description: string;
  origin: string;
  source: string;
  category: string;
}

export interface ManualEntryFormData {
  date: string;
  transaction_type: string;
  amount: string;
  payee: string;
  description: string;
  origin: string;
  category: string;
  seriesRepetitions: number;
  seriesIntervalMonths: number;
}

// --- TYPY STATE ---

export interface DashboardState {
  expandedCats: string[];
  monthOffset: number;
  categoryFilter: string;
  clickedCell: CellInfo | null;
  isCellInfoExpanded: boolean;
  showUnassigned: boolean;
  transactionFilter: string;
  categorySearchFilter: string;
  assignToCategoryId: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

export type SortDirection = 'asc' | 'desc';
