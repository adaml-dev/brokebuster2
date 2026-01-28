/**
 * TransactionPanel Component
 * Panel z transakcjami dla wybranej komórki (miesiąc + kategoria)
 * TODO: Może być dalej podzielony na sub-komponenty
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Minimize2, Maximize2, Plus } from "lucide-react";
import { CellInfo, Transaction, Category } from "@/lib/types/dashboard";
import { formatCurrency, formatDate, getCategoryPath } from "@/lib/utils/dashboard";

interface TransactionPanelProps {
  clickedCell: CellInfo | null;
  isCellInfoExpanded: boolean;
  onToggleExpand: () => void;
  onOpenManualEntry: () => void;
  
  // Transaction display
  showUnassigned: boolean;
  onToggleUnassigned: () => void;
  filteredTransactions: Transaction[];
  transactionFilter: string;
  onTransactionFilterChange: (filter: string) => void;
  
  // Sorting
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  
  // Selection
  selectedTransactionIds: Set<string>;
  onToggleTransaction: (id: string) => void;
  onToggleAllTransactions: () => void;
  
  // Actions
  onAssignToCategory: () => void;
  onUnlinkFromCategory: () => void;
  onDeleteTransactions: () => void;
  onEditTransactions: () => void;
  
  // Category assignment
  categories: Category[];
  assignToCategoryId: string;
  onAssignToCategoryIdChange: (id: string) => void;
  categorySearchFilter: string;
  onCategorySearchFilterChange: (filter: string) => void;
  filteredCategories: Category[];
}

export const TransactionPanel: React.FC<TransactionPanelProps> = ({
  clickedCell,
  isCellInfoExpanded,
  onToggleExpand,
  onOpenManualEntry,
  showUnassigned,
  onToggleUnassigned,
  filteredTransactions,
  transactionFilter,
  onTransactionFilterChange,
  sortColumn,
  sortDirection,
  onSort,
  selectedTransactionIds,
  onToggleTransaction,
  onToggleAllTransactions,
  onAssignToCategory,
  onUnlinkFromCategory,
  onDeleteTransactions,
  onEditTransactions,
  categories,
  assignToCategoryId,
  onAssignToCategoryIdChange,
  categorySearchFilter,
  onCategorySearchFilterChange,
  filteredCategories,
}) => {
  if (!clickedCell) return null;

  return (
    <div 
      className={`border-b-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-neutral-800 shadow-xl shadow-purple-900/20 transition-all duration-300 overflow-hidden ${
        isCellInfoExpanded ? 'h-[65vh] md:h-[50vh]' : 'h-auto max-h-[40vh] md:max-h-none'
      }`}
    >
      <div className="p-3 md:p-4 overflow-y-auto overflow-x-auto backdrop-blur-sm h-full">
        {/* Nagłówek */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 mb-3">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
              title={isCellInfoExpanded ? "Zwiń" : "Rozwiń"}
            >
              {isCellInfoExpanded ? <Minimize2 className="h-5 w-5 text-neutral-400" /> : <Maximize2 className="h-5 w-5 text-neutral-400" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenManualEntry}
              className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-green-500 transition-colors touch-manipulation"
              title="Dodaj transakcję"
            >
              <Plus className="h-5 w-5 text-neutral-400" />
            </Button>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Miesiąc:</span>
                <span className="text-white font-semibold">{clickedCell.monthLabel}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Kategoria:</span>
                <span className="text-blue-400 font-semibold">{clickedCell.categoryPath.join(' → ')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Done:</span>
                <span className="text-green-400 font-semibold">{clickedCell.doneCount} trans. / {formatCurrency(clickedCell.doneSum)} PLN</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Planned:</span>
                <span className="text-yellow-400 font-semibold">{clickedCell.plannedCount} trans. / {formatCurrency(clickedCell.plannedSum)} PLN</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rozszerzona sekcja */}
        {isCellInfoExpanded && (
          <div className="mt-4 p-3 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(65vh - 120px)' }}>
            {/* Toggle i filtr */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-neutral-950 rounded-lg p-1 border border-neutral-700">
                <button
                  onClick={onToggleUnassigned}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all touch-manipulation flex-1 sm:flex-none ${
                    !showUnassigned ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Przypisane
                </button>
                <button
                  onClick={onToggleUnassigned}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all touch-manipulation flex-1 sm:flex-none ${
                    showUnassigned ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Nieprzypisane
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Filtruj..."
                value={transactionFilter}
                onChange={(e) => onTransactionFilterChange(e.target.value)}
                className="flex-1 h-9 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Panel przypisywania (unassigned) */}
            {showUnassigned && selectedTransactionIds.size > 0 && (
              <div className="mb-2 p-2 bg-neutral-950 rounded-lg border border-orange-500/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-neutral-300">Zaznaczono: <span className="font-bold text-orange-400">{selectedTransactionIds.size}</span></span>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Szukaj kategorii..."
                    value={categorySearchFilter}
                    onChange={(e) => onCategorySearchFilterChange(e.target.value)}
                    className="h-9 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full touch-manipulation"
                  />
                  <div className="flex gap-2">
                    <select
                      value={assignToCategoryId}
                      onChange={(e) => onAssignToCategoryIdChange(e.target.value)}
                      className="flex-1 h-9 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation"
                    >
                      <option value="">Wybierz...</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {getCategoryPath(cat.id, categories).join(' → ')}
                        </option>
                      ))}
                    </select>
                    <Button onClick={onAssignToCategory} disabled={!assignToCategoryId} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation h-9 px-3 text-xs">
                      Przypisz
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Panel akcji (assigned) */}
            {!showUnassigned && selectedTransactionIds.size > 0 && (
              <div className="mb-2 p-2 bg-neutral-950 rounded-lg border border-blue-500/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-neutral-300">Zaznaczono: <span className="font-bold text-blue-400">{selectedTransactionIds.size}</span></span>
                </div>
                <div className="flex items-stretch gap-2">
                  <Button onClick={onUnlinkFromCategory} size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white touch-manipulation h-9 px-2 text-xs">Unlink</Button>
                  <Button onClick={onDeleteTransactions} size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white touch-manipulation h-9 px-2 text-xs">Delete</Button>
                  <Button onClick={onEditTransactions} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white touch-manipulation h-9 px-2 text-xs">Edit</Button>
                </div>
              </div>
            )}
            
            {/* Tabela transakcji */}
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="bg-neutral-950 sticky top-0 z-10">
                  <TableRow className="border-b border-neutral-700">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredTransactions.length > 0 && selectedTransactionIds.size === filteredTransactions.length}
                        onChange={onToggleAllTransactions}
                        className={`w-4 h-4 rounded border-neutral-600 bg-neutral-800 focus:ring-2 cursor-pointer ${showUnassigned ? 'text-orange-600 focus:ring-orange-500' : 'text-blue-600 focus:ring-blue-500'}`}
                      />
                    </TableHead>
                    {[
                      { key: 'date', label: 'Data' },
                      { key: 'transaction_type', label: 'Typ' },
                      { key: 'amount', label: 'Kwota' },
                      { key: 'payee', label: 'Odbiorca' },
                      { key: 'description', label: 'Opis' },
                      { key: 'origin', label: 'Pochodzenie' },
                      { key: 'source', label: 'Źródło' },
                    ].map(col => (
                      <TableHead key={col.key} className="text-xs cursor-pointer hover:bg-neutral-800 transition-colors whitespace-nowrap" onClick={() => onSort(col.key)}>
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortColumn === col.key && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction, idx) => (
                      <TableRow key={transaction.id || idx} className="hover:bg-neutral-800/50 border-b border-neutral-800">
                        <TableCell className="w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTransactionIds.has(transaction.id)}
                            onChange={() => onToggleTransaction(transaction.id)}
                            className={`w-4 h-4 rounded border-neutral-600 bg-neutral-800 focus:ring-2 cursor-pointer ${showUnassigned ? 'text-orange-600 focus:ring-orange-500' : 'text-blue-600 focus:ring-blue-500'}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(transaction.date)}</TableCell>
                        <TableCell className="text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.transaction_type === 'done' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                            {transaction.transaction_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <span className={Number(transaction.amount) < 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(Number(transaction.amount))}</span>
                        </TableCell>
                        <TableCell className="text-xs text-neutral-300 max-w-[200px] truncate">{transaction.payee || '-'}</TableCell>
                        <TableCell className="text-xs text-neutral-400 max-w-[250px] truncate">{transaction.description || '-'}</TableCell>
                        <TableCell className="text-xs text-neutral-300 max-w-[150px] truncate">{transaction.origin || '-'}</TableCell>
                        <TableCell className="text-xs text-neutral-500">{transaction.source || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                        {showUnassigned ? 'Brak nieprzypisanych transakcji w tym miesiącu' : 'Brak transakcji do wyświetlenia'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
