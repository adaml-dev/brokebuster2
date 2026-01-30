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
import { PivotData } from "@/lib/types/dashboard";
import { formatCurrency, shouldShowCategory } from "@/lib/utils/dashboard";

interface PivotTableProps {
  pivotData: PivotData;
  expandedCats: Set<string>;
  categoryFilter: string;
  onToggleCategory: (catId: string) => void;
  onCellClick: (categoryId: string, monthKey: string, monthLabel: string) => void;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  pivotData,
  expandedCats,
  categoryFilter,
  onToggleCategory,
  onCellClick,
}) => {
  return (
    <Table>
      <TableHeader className="bg-neutral-950 sticky top-0 z-20 shadow-md">
        <TableRow className="hover:bg-neutral-950 border-b border-neutral-800">
          <TableHead className="w-[200px] sticky left-0 bg-neutral-950 z-30 border-r border-neutral-800 text-white font-bold">
            KATEGORIA
          </TableHead>
          {pivotData.columns.map(col => (
            <TableHead key={col.key} className="text-right min-w-[80px] text-neutral-400 font-normal text-xs">
              {col.label}
            </TableHead>
          ))}
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
            />
          );
        })}
      </TableBody>
      <TableFooter className="bg-neutral-900 border-t-2 border-neutral-700 sticky bottom-0 z-20">
        {/* Row 1: Bilans Miesięczny (Monthly Totals) */}
        <TableRow className="hover:bg-neutral-900 border-b border-neutral-800">
          <TableCell className="font-bold text-white sticky left-0 bg-neutral-900 z-10 border-r border-neutral-800 min-w-[200px] py-3">
            Bilans Miesięczny
          </TableCell>
          {pivotData.columns.map(col => {
            const val = pivotData.monthlyTotals[col.key] || 0;
            return (
              <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs font-bold">
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
            return (
              <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs italic">
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
            return (
              <TableCell key={col.key} className="text-right p-2 min-w-[80px] text-xs italic">
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
