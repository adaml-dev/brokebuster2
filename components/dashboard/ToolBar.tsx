/**
 * ToolBar Component
 * Pasek narzędzi z nawigacją miesięcy i przyciskami expand/collapse
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Minimize2,
  Maximize2,
  Filter,
} from "lucide-react";

interface ToolBarProps {
  monthOffset: number;
  onMonthOffsetChange: (offset: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  categoryFilter: string;
  onCategoryFilterChange: (filter: string) => void;
  showCategoryFilter: boolean;
  onToggleCategoryFilter: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  monthOffset,
  onMonthOffsetChange,
  onExpandAll,
  onCollapseAll,
  categoryFilter,
  onCategoryFilterChange,
  showCategoryFilter,
  onToggleCategoryFilter,
}) => {
  return (
    <div className="flex flex-col py-2 gap-2">
      {/* WSZYSTKIE PRZYCISKI W JEDNYM WIERSZU */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {/* PRZYCISKI ROZWIJANIA/ZWIJANIA */}
        <Button
          variant="outline"
          size="icon"
          onClick={onExpandAll}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-green-500 transition-colors touch-manipulation"
          title="Rozwiń o jeden poziom"
        >
          <Maximize2 className="h-5 w-5 text-neutral-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onCollapseAll}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-orange-500 transition-colors touch-manipulation"
          title="Zwiń o jeden poziom"
        >
          <Minimize2 className="h-5 w-5 text-neutral-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleCategoryFilter}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-purple-500 transition-colors touch-manipulation ${
            showCategoryFilter ? 'bg-purple-900 border-purple-500' : ''
          }`}
          title="Filtruj kategorie"
        >
          <Filter className="h-5 w-5 text-neutral-400" />
        </Button>
        
        {/* SEPARADOR */}
        <div className="w-px h-6 bg-neutral-700 mx-1"></div>
        
        {/* PRZYCISKI NAWIGACYJNE */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthOffsetChange(monthOffset - 12)}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
          title="-12 miesięcy"
        >
          <ChevronsLeft className="h-5 w-5 text-neutral-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthOffsetChange(monthOffset - 1)}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
          title="-1 miesiąc"
        >
          <ChevronLeft className="h-5 w-5 text-neutral-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthOffsetChange(0)}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation ${
            monthOffset === 0 ? 'bg-blue-900 border-blue-500' : ''
          }`}
          title="Obecny miesiąc"
        >
          <Circle className={`h-5 w-5 ${monthOffset === 0 ? 'text-blue-400 fill-blue-400' : 'text-neutral-400'}`} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthOffsetChange(monthOffset + 1)}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
          title="+1 miesiąc"
        >
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthOffsetChange(monthOffset + 12)}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
          title="+12 miesięcy"
        >
          <ChevronsRight className="h-5 w-5 text-neutral-400" />
        </Button>
      </div>
      
      {/* POLE FILTROWANIA KATEGORII - poniżej przycisków, pełna szerokość */}
      {showCategoryFilter && (
        <input
          type="text"
          placeholder="Filtruj kategorie..."
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="h-8 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
        />
      )}
    </div>
  );
};
