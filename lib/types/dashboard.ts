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
  is_archived?: boolean;
}

export interface AccountStatement {
  id: string;
  account_id: string;
  date: string;
  balance: number;
  created_at?: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
}

export interface Rule {
  id: string;
  keyword: string;
  field: 'payee' | 'description';
  category_id: string; // ID kategorii
  value_min?: number;
  value_max?: number;
  date_from?: string;
  date_to?: string;
  created_at?: string;
}

// --- TYPY KOMPONENTU ---

export interface DashboardClientProps {
  userEmail: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  weightLogs: WeightLog[];
  rules: Rule[];
  accountStatements: AccountStatement[];
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
  accountBalances: Record<string, number | null>;
  balanceDiffs: Record<string, number | null>;
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
  sortDirection: SortDirection;
  calculationMode: CalculationMode;
}

export type CalculationMode = 'mixed' | 'planned' | 'done' | 'diff';
export type SortDirection = 'asc' | 'desc';
