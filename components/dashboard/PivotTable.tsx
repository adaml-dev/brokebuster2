/**
 * PivotTable Component
 * Główna tabela pivot z kategoriami i miesiącami
 */

import React from "react";
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { CategoryRow } from "./CategoryRow";
import { PivotData, CellInfo } from "@/lib/types/dashboard";
import { formatCurrency, shouldShowCategory } from "@/lib/utils/dashboard";

interface PivotTableProps {
  pivotData: PivotData;
  expandedCats: Set<string>;
  categoryFilter: string;
  onToggleCategory: (catId: string) => void;
  onCellClick: (categoryId: string, monthKey: string, monthLabel: string) => void;
  clickedCell: CellInfo | null;
  onToggleStar: (catId: string, isStarred: boolean) => void;
  onToggleArchive: (catId: string, isArchived: boolean) => void;
  starredOnly?: boolean;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  pivotData,
  expandedCats,
  categoryFilter,
  onToggleCategory,
  onCellClick,
  clickedCell,
  onToggleStar,
  onToggleArchive,
  starredOnly = false,
}) => {
  return (
    <Table>
      <TableHeader className="bg-neutral-950 sticky top-0 z-20 shadow-md">
        <TableRow className="hover:bg-neutral-950 border-b border-neutral-800">
          <TableHead className="w-[200px] sticky left-0 bg-neutral-950 z-30 border-r border-neutral-800 text-white font-bold">
            KATEGORIA
          </TableHead>
          {pivotData.columns.map(col => {
            const isCurrent = col.key === pivotData.currentMonthKey;
            const isSelected = clickedCell?.monthKey === col.key;

            let className = "text-right min-w-[80px] font-normal text-xs ";
            if (isSelected) {
              className += "text-blue-300 bg-blue-900/40 border-x border-blue-500/40 font-bold";
            } else if (isCurrent) {
              className += "text-blue-400 bg-blue-900/20 border-x border-blue-500/20";
            } else {
              className += "text-neutral-400";
            }

            return (
              <TableHead
                key={col.key}
                className={className}
              >
                {col.label}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pivotData.categoryTree.map(cat => {
          const values = pivotData.totalValuesMap[cat.id] || {};
          return (
            <CategoryRow
              key={cat.id}
              category={cat}
              depth={0}
              parentMatches={false}
              values={values}
              columns={pivotData.columns}
              isExpanded={expandedCats.has(cat.id)}
              expandedCats={expandedCats}
              categoryFilter={categoryFilter}
              onToggleCategory={onToggleCategory}
              onCellClick={onCellClick}
              shouldShowCategory={shouldShowCategory}
              totalValuesMap={pivotData.totalValuesMap}
              currentMonthKey={pivotData.currentMonthKey}
              clickedCell={clickedCell}
              onToggleStar={onToggleStar}
              onToggleArchive={onToggleArchive}
            />
          );
        })}
        {starredOnly && (
          <TableRow className={`border-b border-neutral-800 group transition-colors ${clickedCell?.categoryId === "__REST_CATEGORIES__" ? "bg-blue-900/30" : "hover:bg-neutral-900/50"}`}>
            <TableCell className={`font-semibold sticky left-0 z-10 border-r border-neutral-800 min-w-[200px] py-2.5 pl-[10px] ${clickedCell?.categoryId === "__REST_CATEGORIES__" ? "bg-[#111827] text-blue-300 font-bold" : "bg-neutral-950 text-neutral-300"}`}>
              Reszta kategorii
            </TableCell>
            {pivotData.columns.map(col => {
              const isRowSelected = clickedCell?.categoryId === "__REST_CATEGORIES__";
              const val = pivotData.restCategoriesTotals?.[col.key] || 0;
              const isCurrent = col.key === pivotData.currentMonthKey;
              const isColumnSelected = clickedCell?.monthKey === col.key;
              const isCellSelected = isRowSelected && isColumnSelected;

              let cellClass = "text-right p-2 min-w-[80px] text-xs cursor-pointer transition-all duration-200 ";
              if (isCellSelected) {
                cellClass += "bg-blue-600/40 border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10 scale-105 font-bold text-white relative ";
              } else if (isColumnSelected) {
                cellClass += "bg-blue-900/40 border-x border-blue-500/30 ";
              } else if (isRowSelected) {
                cellClass += "border-y border-blue-500/20 ";
              } else if (isCurrent) {
                cellClass += "bg-blue-900/10 border-x border-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)] ";
              } else {
                cellClass += "hover:bg-blue-900/30 ";
              }

              return (
                <TableCell
                  key={col.key}
                  className={cellClass}
                  onClick={() => onCellClick("__REST_CATEGORIES__", col.key, col.label)}
                >
                  {val !== 0 ? (
                    <span className={val < 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                      {formatCurrency(val)}
                    </span>
                  ) : (
                    <span className={isCellSelected ? "text-blue-200" : "text-neutral-600"}>-</span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        )}
        <TableRow className={`border-b border-neutral-800 group transition-colors ${clickedCell?.categoryId === "__REST_TRANSACTIONS__" ? "bg-blue-900/30" : "hover:bg-neutral-900/50"}`}>
          <TableCell className={`font-semibold sticky left-0 z-10 border-r border-neutral-800 min-w-[200px] py-2.5 pl-[10px] ${clickedCell?.categoryId === "__REST_TRANSACTIONS__" ? "bg-[#111827] text-blue-300 font-bold" : "bg-neutral-950 text-neutral-300"}`}>
            Reszta transakcji
          </TableCell>
          {pivotData.columns.map(col => {
            const isRowSelected = clickedCell?.categoryId === "__REST_TRANSACTIONS__";
            const val = pivotData.restTransactionsTotals?.[col.key] || 0;
            const isCurrent = col.key === pivotData.currentMonthKey;
            const isColumnSelected = clickedCell?.monthKey === col.key;
            const isCellSelected = isRowSelected && isColumnSelected;

            let cellClass = "text-right p-2 min-w-[80px] text-xs cursor-pointer transition-all duration-200 ";
            if (isCellSelected) {
              cellClass += "bg-blue-600/40 border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10 scale-105 font-bold text-white relative ";
            } else if (isColumnSelected) {
              cellClass += "bg-blue-900/40 border-x border-blue-500/30 ";
            } else if (isRowSelected) {
              cellClass += "border-y border-blue-500/20 ";
            } else if (isCurrent) {
              cellClass += "bg-blue-900/10 border-x border-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)] ";
            } else {
              cellClass += "hover:bg-blue-900/30 ";
            }

            return (
              <TableCell
                key={col.key}
                className={cellClass}
                onClick={() => onCellClick("__REST_TRANSACTIONS__", col.key, col.label)}
              >
                {val !== 0 ? (
                  <span className={val < 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                    {formatCurrency(val)}
                  </span>
                ) : (
                  <span className={isCellSelected ? "text-blue-200" : "text-neutral-600"}>-</span>
                )}
              </TableCell>
            );
          })}
        </TableRow>
      </TableBody>
      <TableFooter className="bg-neutral-900 border-t-2 border-neutral-700 sticky bottom-0 z-20">
        {/* Row 1: Bilans Miesięczny (Monthly Totals) */}
        <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
          <TableCell className="font-bold text-white sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-3">
            Bilans Miesięczny
          </TableCell>
          {pivotData.columns.map(col => {
            const val = pivotData.monthlyTotals[col.key] || 0;
            const isCurrent = col.key === pivotData.currentMonthKey;
            const isSelected = clickedCell?.monthKey === col.key;

            let className = "text-right p-2 min-w-[80px] text-xs font-bold ";
            if (isSelected) {
              className += "bg-blue-900/40 border-x border-blue-500/40";
            } else if (isCurrent) {
              className += "bg-blue-900/20 border-x border-blue-500/20";
            }

            return (
              <TableCell
                key={col.key}
                className={className}
              >
                {val !== 0 ? (
                  <span className={val < 0 ? "text-red-400" : "text-green-400"}>
                    {formatCurrency(val)}
                  </span>
                ) : (
                  <span className="text-neutral-600">-</span>
                )}
              </TableCell>
            );
          })}
        </TableRow>

        {/* Row 2: Bilans Narastająco (Cumulative Totals) */}
        <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
          <TableCell className="italic text-neutral-300 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-3">
            Bilans Narastająco
          </TableCell>
          {pivotData.columns.map(col => {
            const val = pivotData.cumulativeTotals[col.key] || 0;
            const isCurrent = col.key === pivotData.currentMonthKey;
            const isSelected = clickedCell?.monthKey === col.key;

            let className = "text-right p-2 min-w-[80px] text-xs italic ";
            if (isSelected) {
              className += "bg-blue-900/40 border-x border-blue-500/40";
            } else if (isCurrent) {
              className += "bg-blue-900/20 border-x border-blue-500/20";
            }

            return (
              <TableCell
                key={col.key}
                className={className}
              >
                {val !== 0 ? (
                  <span className={val < 0 ? "text-red-300" : "text-green-300"}>
                    {formatCurrency(val)}
                  </span>
                ) : (
                  <span className="text-neutral-600">-</span>
                )}
              </TableCell>
            );
          })}
        </TableRow>

        {/* Row 3: Stany kont (Account Balances) */}
        <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
          <TableCell className="text-neutral-300 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-2">
            Stany kont
          </TableCell>
          {pivotData.columns.map(col => {
            const val = pivotData.accountBalances[col.key];
            return (
              <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs font-medium text-neutral-400">
                {val !== null && val !== undefined ? formatCurrency(val) : ""}
              </TableCell>
            );
          })}
        </TableRow>

        {/* Row 4: Różnica (Difference Row) */}
        <TableRow className="hover:bg-neutral-900">
          <TableCell className="italic text-neutral-500 sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-2">
            Różnica
          </TableCell>
          {pivotData.columns.map(col => {
            const val = pivotData.balanceDiffs[col.key];
            const isCurrent = col.key === pivotData.currentMonthKey;
            const isSelected = clickedCell?.monthKey === col.key;

            let className = "text-right p-2 min-w-[80px] text-xs italic ";
            if (isSelected) {
              className += "bg-blue-900/40 border-x border-blue-500/40";
            } else if (isCurrent) {
              className += "bg-blue-900/20 border-x border-blue-500/20";
            }

            return (
              <TableCell
                key={col.key}
                className={className}
              >
                {val !== null && val !== undefined ? (
                  <span className={val < 0 ? "text-red-500/70" : "text-green-500/70"}>
                    {formatCurrency(val)}
                  </span>
                ) : (
                  ""
                )}
              </TableCell>
            );
          })}
        </TableRow>
      </TableFooter>
    </Table>
  );
};
