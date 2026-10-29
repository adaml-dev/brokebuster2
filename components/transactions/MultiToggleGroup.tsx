"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MultiToggleGroupProps {
  options: { value: string; label: string }[];
  // Empty selection means "all"
  selected: string[];
  onChange: (selected: string[]) => void;
  columns?: number;
  allLabel?: string;
}

// Looks like the Tabs filter bar, but allows selecting several options at once
export default function MultiToggleGroup({ options, selected, onChange, columns = 3, allLabel = "Wszystkie" }: MultiToggleGroupProps) {
  const toggle = (value: string) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    // Selecting every option is the same as "all"
    onChange(next.length === options.length ? [] : next);
  };

  const items = [{ value: "__all__", label: allLabel }, ...options];

  return (
    <div
      className="grid gap-1 rounded-lg bg-muted p-1 text-muted-foreground mt-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map(({ value, label }) => {
        const isAll = value === "__all__";
        const active = isAll ? selected.length === 0 : selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => (isAll ? onChange([]) : toggle(value))}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-background text-foreground shadow" : "hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
