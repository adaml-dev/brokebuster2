/**
 * CategoryRow Component
 * Pojedynczy wiersz kategorii w pivot table (z rekurencją dla dzieci)
 */

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Category, ColumnData } from "@/lib/types/dashboard";
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

  const currentRow = (
    <TableRow key={category.id} className="hover:bg-neutral-900/50 border-b border-neutral-800 group">
      <TableCell className="font-medium p-0 sticky left-0 bg-neutral-950 z-10 border-r border-neutral-800 min-w-[200px]">
        <div 
          className="flex items-center text-sm h-full py-2 cursor-pointer hover:text-blue-400 transition-colors"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => hasChildren && onToggleCategory(category.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1 text-blue-500"/>
            ) : (
              <ChevronRight className="w-4 h-4 mr-1 text-neutral-500"/>
            )
          ) : (
            <div className="w-5" /> 
          )}
          <span className={depth === 0 ? "text-white font-bold" : "text-neutral-300"}>
            {category.name}
          </span>
        </div>
      </TableCell>
      {columns.map(col => {
        const val = values[col.key] || 0;
        return (
          <TableCell 
            key={col.key} 
            className="text-right p-2 min-w-[80px] text-xs cursor-pointer hover:bg-blue-900/30 transition-colors"
            onClick={() => onCellClick(category.id, col.key, col.label)}
          >
            {val !== 0 ? (
              <span className={val < 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                {formatCurrency(val)}
              </span>
            ) : (
              <span className="text-neutral-800">-</span>
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
          values={{}} // Będzie przekazane przez PivotTable
          columns={columns}
          isExpanded={expandedCats.has(child.id)}
          expandedCats={expandedCats}
          categoryFilter={categoryFilter}
          onToggleCategory={onToggleCategory}
          onCellClick={onCellClick}
          shouldShowCategory={shouldShowCategory}
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
