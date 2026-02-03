/**
 * CategoryRow Component
 * Pojedynczy wiersz kategorii w pivot table (z rekurencją dla dzieci)
 */

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Category, ColumnData, CellInfo } from "@/lib/types/dashboard";
import { formatCurrency } from "@/lib/utils/dashboard";

interface CategoryRowProps {
  category: Category;
  depth: number;
  parentMatches?: boolean;
  values: Record<string, number>;
  columns: ColumnData[];
  isExpanded: boolean;
  expandedCats: Set<string>;
  categoryFilter: string;
  onToggleCategory: (catId: string) => void;
  onCellClick: (categoryId: string, monthKey: string, monthLabel: string) => void;
  shouldShowCategory: (category: Category, categoryFilter: string, categories: Category[], parentMatches?: boolean) => boolean;
  totalValuesMap: Record<string, Record<string, number>>;
  currentMonthKey: string;
  clickedCell: CellInfo | null;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  depth = 0,
  parentMatches = false,
  values,
  columns,
  isExpanded,
  expandedCats,
  categoryFilter,
  onToggleCategory,
  onCellClick,
  shouldShowCategory,
  totalValuesMap,
  currentMonthKey,
  clickedCell,
}) => {
  // Sprawdź czy kategoria powinna być widoczna
  if (!shouldShowCategory(category, categoryFilter, [], parentMatches)) {
    return null;
  }

  const hasChildren = category.children && category.children.length > 0;
  const paddingLeft = depth * 20 + 10;

  // Oblicz czy nazwa tej kategorii pasuje do filtra
  const filterLower = categoryFilter.toLowerCase();
  const nameMatches = categoryFilter.trim() ? category.name.toLowerCase().includes(filterLower) : false;

  const isRowSelected = clickedCell?.categoryId === category.id;

  const currentRow = (
    <TableRow
      key={category.id}
      className={`border-b border-neutral-800 group transition-colors ${isRowSelected ? "bg-blue-900/30" : "hover:bg-neutral-900/50"
        }`}
    >
      <TableCell className={`font-medium p-0 sticky left-0 z-10 border-r border-neutral-800 min-w-[200px] ${isRowSelected ? "bg-[#111827]" : "bg-neutral-950"
        }`}>
        <div
          className="flex items-center text-sm h-full py-2 cursor-pointer hover:text-blue-400 transition-colors"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => hasChildren && onToggleCategory(category.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1 text-blue-500" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1 text-neutral-500" />
            )
          ) : (
            <div className="w-5" />
          )}
          <span className={`transition-colors ${isRowSelected
              ? "text-blue-300 font-bold"
              : depth === 0 ? "text-white font-bold" : "text-neutral-300"
            }`}>
            {category.name}
          </span>
        </div>
      </TableCell>
      {columns.map(col => {
        const val = values[col.key] || 0;
        const isCurrent = col.key === currentMonthKey;
        const isColumnSelected = clickedCell?.monthKey === col.key;
        const isCellSelected = isRowSelected && isColumnSelected;

        // Bazowe style
        let cellClass = "text-right p-2 min-w-[80px] text-xs cursor-pointer transition-all duration-200 ";

        if (isCellSelected) {
          // GŁÓWNIE WYRÓŻNIONA KOMÓRKA (niebieskie tło, jasna ramka)
          cellClass += "bg-blue-600/40 border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10 scale-105 font-bold text-white relative ";
        } else if (isColumnSelected) {
          // WYRÓŻNIONA KOLUMNA (delikatniejsze niebieskie tło)
          cellClass += "bg-blue-900/40 border-x border-blue-500/30 ";
        } else if (isRowSelected) {
          // WYRÓŻNIONY WIERSZ (tło już jest na wierszu, ale dodajemy border)
          cellClass += "border-y border-blue-500/20 ";
        } else if (isCurrent) {
          // OBECNY MIESIĄC (jeszcze delikatniejsze)
          cellClass += "bg-blue-900/10 border-x border-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)] ";
        } else {
          // STANDARD
          cellClass += "hover:bg-blue-900/30 ";
        }

        return (
          <TableCell
            key={col.key}
            className={cellClass}
            onClick={() => onCellClick(category.id, col.key, col.label)}
          >
            {val !== 0 ? (
              <span className={val < 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                {formatCurrency(val)}
              </span>
            ) : (
              <span className={isCellSelected ? "text-blue-200" : "text-neutral-800"}>-</span>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );

  // Renderuj dzieci tylko jeśli kategoria jest rozwinięta
  const childrenRows = (hasChildren && isExpanded)
    ? category.children!.map((child: Category) => (
      <CategoryRow
        key={child.id}
        category={child}
        depth={depth + 1}
        parentMatches={nameMatches || parentMatches}
        values={totalValuesMap[child.id] || {}}
        columns={columns}
        isExpanded={expandedCats.has(child.id)}
        expandedCats={expandedCats}
        categoryFilter={categoryFilter}
        onToggleCategory={onToggleCategory}
        onCellClick={onCellClick}
        shouldShowCategory={shouldShowCategory}
        totalValuesMap={totalValuesMap}
        currentMonthKey={currentMonthKey}
        clickedCell={clickedCell}
      />
    ))
    : [];

  return (
    <>
      {currentRow}
      {childrenRows}
    </>
  );
};
