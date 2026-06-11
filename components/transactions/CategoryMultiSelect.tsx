"use client";

import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/lib/types/dashboard";
import { Search, X, FolderTree, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  label: string;
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  iconColorClass?: string;
}

export default function CategoryMultiSelect({
  label,
  categories,
  selectedIds,
  onChange,
  placeholder = "Filtruj kategorie...",
  iconColorClass = "text-blue-400",
}: CategoryMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Helper to recursively get a category's path
  const getCategoryPathString = (catId: string): string => {
    const path: string[] = [];
    let currentId: string | null = catId;
    while (currentId) {
      const cat = categories.find((c) => c.id === currentId);
      if (cat) {
        path.unshift(cat.name);
        currentId = cat.parent;
      } else {
        break;
      }
    }
    return path.join(" > ");
  };

  // Helper to traverse and build a flat sorted tree list of categories
  const sortedCategories = useMemo(() => {
    const roots = categories.filter((c) => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
    const result: { category: Category; depth: number }[] = [];

    const traverse = (catId: string, depth: number) => {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return;
      result.push({ category: cat, depth });
      const children = categories.filter((c) => c.parent === catId).sort((a, b) => (a.order || 0) - (b.order || 0));
      children.forEach((child) => traverse(child.id, depth + 1));
    };

    roots.forEach((root) => traverse(root.id, 0));
    return result;
  }, [categories]);

  // Filtered categories based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedCategories;
    }
    const term = searchTerm.toLowerCase();
    return sortedCategories.filter((item) =>
      item.category.name.toLowerCase().includes(term)
    );
  }, [sortedCategories, searchTerm]);

  const handleToggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-neutral-300 flex items-center gap-2 text-xs">
          <FolderTree className={cn("h-4 w-4", iconColorClass)} />
          {label}
        </Label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5"
          >
            <X className="h-3 w-3" />
            Wyczyść ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs bg-neutral-950 border-neutral-800 focus-visible:ring-blue-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-2.5 text-neutral-500 hover:text-neutral-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="border border-neutral-800 rounded-md bg-neutral-950/50 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {filteredItems.length > 0 ? (
          <div className="p-1 space-y-0.5">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.category.id);
              // When searching, show full path. When not, use tree indentation
              const displayName = searchTerm ? getCategoryPathString(item.category.id) : item.category.name;
              const itemStyle = !searchTerm && item.depth > 0 
                ? { marginLeft: `${item.depth * 12}px` }
                : undefined;

              return (
                <div
                  key={item.category.id}
                  onClick={() => handleToggleCategory(item.category.id)}
                  style={itemStyle}
                  className={cn(
                    "flex items-center space-x-2 p-1.5 rounded-sm hover:bg-neutral-800/60 cursor-pointer transition-colors",
                    isSelected ? "bg-neutral-800/30" : "",
                    !searchTerm && item.depth > 0 ? "pl-2 border-l border-neutral-800" : ""
                  )}
                >
                  <Checkbox
                    id={`filter-cat-${item.category.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCategory(item.category.id)}
                    className="border-neutral-700 h-3.5 w-3.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span
                    className={cn(
                      "text-xs select-none truncate cursor-pointer",
                      isSelected ? "text-white font-medium" : "text-neutral-400"
                    )}
                  >
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-neutral-500">
            Brak pasujących kategorii
          </div>
        )}
      </div>
    </div>
  );
}
