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
  Plus,
  ArrowDownToLine,
  Layers,
  CalendarClock,
  CheckCircle,
  Percent,
} from "lucide-react";
import { CalculationMode } from "@/lib/types/dashboard";

interface ToolBarProps {
  monthOffset: number;
  onMonthOffsetChange: (offset: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  categoryFilter: string;
  onCategoryFilterChange: (filter: string) => void;
  showCategoryFilter: boolean;
  onToggleCategoryFilter: () => void;
  isCellInfoExpanded: boolean;
  onToggleExpand: () => void;
  onOpenManualEntry: () => void;
  calculationMode: CalculationMode;
  onCalculationModeChange: (mode: CalculationMode) => void;
  currentMonthOffset: number;
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
  isCellInfoExpanded,
  onToggleExpand,
  onOpenManualEntry,
  calculationMode,
  onCalculationModeChange,
  currentMonthOffset,
}) => {
  return (
    <div className="flex flex-col py-2 gap-2">
      {/* WSZYSTKIE PRZYCISKI W JEDNYM WIERSZU */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleExpand}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation"
          title={isCellInfoExpanded ? "Zwiń" : "Rozwiń"}
        >
          {isCellInfoExpanded ? (
            <Minimize2 className="h-5 w-5 text-neutral-400" />
          ) : (
            <ArrowDownToLine className="h-5 w-5 text-neutral-400" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenManualEntry}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-green-500 transition-colors touch-manipulation relative"
          title="Dodaj transakcję"
        >
          <Plus className="h-4 w-4 text-neutral-400 absolute top-1 left-1" />
          <span className="absolute bottom-1 right-1 text-xs font-bold text-neutral-400">
            T
          </span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            /* Placeholder */
          }}
          className="h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-yellow-500 transition-colors touch-manipulation relative"
          title="Dodaj kategorię"
        >
          <Plus className="h-4 w-4 text-neutral-400 absolute top-1 left-1" />
          <span className="absolute bottom-1 right-1 text-xs font-bold text-neutral-400">
            K
          </span>
        </Button>

        {/* SEPARADOR */}
        <div className="w-px h-6 bg-neutral-700 mx-1"></div>

        {/* PRZYCISKI TRYBU OBLICZEŃ */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCalculationModeChange('mixed')}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation ${calculationMode === 'mixed' ? 'bg-blue-900 border-blue-500' : ''
            }`}
          title="Tryb mieszany (Done przeszłe, Planned obecne/przyszłe)"
        >
          <Layers className={`h-5 w-5 ${calculationMode === 'mixed' ? 'text-blue-400' : 'text-neutral-400'}`} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onCalculationModeChange('planned')}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-yellow-500 transition-colors touch-manipulation ${calculationMode === 'planned' ? 'bg-yellow-900/50 border-yellow-500' : ''
            }`}
          title="Tylko Planned"
        >
          <CalendarClock className={`h-5 w-5 ${calculationMode === 'planned' ? 'text-yellow-400' : 'text-neutral-400'}`} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onCalculationModeChange('done')}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-green-500 transition-colors touch-manipulation ${calculationMode === 'done' ? 'bg-green-900 border-green-500' : ''
            }`}
          title="Tylko Done"
        >
          <CheckCircle className={`h-5 w-5 ${calculationMode === 'done' ? 'text-green-400' : 'text-neutral-400'}`} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onCalculationModeChange('diff')}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-red-500 transition-colors touch-manipulation ${calculationMode === 'diff' ? 'bg-red-900 border-red-500' : ''
            }`}
          title="Różnica (Planned - Done)"
        >
          <Percent className={`h-5 w-5 ${calculationMode === 'diff' ? 'text-red-400' : 'text-neutral-400'}`} />
        </Button>
        {/* SEPARADOR */}
        <div className="w-px h-6 bg-neutral-700 mx-1"></div>
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
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-purple-500 transition-colors touch-manipulation ${showCategoryFilter ? 'bg-purple-900 border-purple-500' : ''
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
          onClick={() => onMonthOffsetChange(currentMonthOffset)}
          className={`h-8 w-8 p-0 flex-shrink-0 rounded-lg border-neutral-700 hover:bg-neutral-800 hover:border-blue-500 transition-colors touch-manipulation ${monthOffset === currentMonthOffset ? 'bg-blue-900 border-blue-500' : ''
            }`}
          title="Obecny miesiąc"
        >
          <Circle className={`h-5 w-5 ${monthOffset === currentMonthOffset ? 'text-blue-400 fill-blue-400' : 'text-neutral-400'}`} />
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
