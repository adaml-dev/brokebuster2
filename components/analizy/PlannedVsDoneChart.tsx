"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Transaction, Category } from "@/lib/types/dashboard";
import { getMonthKey } from "@/lib/utils/dashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, BarChart3, Search, ChevronLeft } from "lucide-react";

interface PlannedVsDoneChartProps {
  transactions: Transaction[];
  categories: Category[];
}

// ---- helpers ----

function buildCategoryTree(flat: Category[]): Category[] {
  const map: Record<string, Category> = {};
  flat.forEach((c) => (map[c.id] = { ...c, children: [] }));
  const roots: Category[] = [];
  flat.forEach((c) => {
    if (c.parent && map[c.parent]) {
      map[c.parent].children!.push(map[c.id]);
    } else if (!c.parent) {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

function getAllDescendantIds(catId: string, categories: Category[]): string[] {
  const result: string[] = [catId];
  const cat = categories.find((c) => c.id === catId);
  if (cat?.children) {
    cat.children.forEach((child) => {
      result.push(...getAllDescendantIds(child.id, categories));
    });
  }
  return result;
}

function flattenTree(tree: Category[]): Category[] {
  const result: Category[] = [];
  const traverse = (nodes: Category[]) => {
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) traverse(n.children);
    });
  };
  traverse(tree);
  return result;
}

function formatMonthKey(key: string) {
  const [y, m] = key.split("-");
  const months = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Generate all month keys between two dates (inclusive)
function generateMonthRange(from: string, to: string): string[] {
  const result: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-400">{entry.name}:</span>
          <span className="font-mono text-white">{formatCurrency(entry.value)} zł</span>
        </div>
      ))}
    </div>
  );
};

// Sidebar category item
function CategoryItem({
  cat,
  level,
  selectedIds,
  onToggle,
  filterText,
}: {
  cat: Category;
  level: number;
  selectedIds: Set<string>;
  onToggle: (id: string, descendants: string[]) => void;
  filterText: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children && cat.children.length > 0;
  const isSelected = selectedIds.has(cat.id);

  if (filterText && !cat.name.toLowerCase().includes(filterText.toLowerCase())) {
    if (!hasChildren || !cat.children!.some((c) => c.name.toLowerCase().includes(filterText.toLowerCase()))) {
      return null;
    }
  }

  const descendants = cat.children ? flattenTree(cat.children).map((c) => c.id) : [];

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-neutral-800/70 cursor-pointer group transition-colors",
          isSelected && "bg-cyan-950/40"
        )}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
      >
        <div
          className="flex items-center justify-center w-4 h-4 shrink-0"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded((v) => !v); }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-neutral-500" />
            )
          ) : null}
        </div>
        <Checkbox
          id={`cat-${cat.id}`}
          checked={isSelected}
          onCheckedChange={() => onToggle(cat.id, descendants)}
          className="h-3.5 w-3.5 shrink-0"
        />
        <label
          htmlFor={`cat-${cat.id}`}
          className={cn(
            "text-xs cursor-pointer truncate flex-1 select-none",
            isSelected ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
          )}
        >
          {cat.name}
        </label>
      </div>
      {hasChildren && expanded && (
        <div>
          {cat.children!.map((child) => (
            <CategoryItem
              key={child.id}
              cat={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
              filterText={filterText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Month Range Picker component ----
const MONTH_LABELS_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function MonthRangePicker({
  label,
  value,
  onChange,
  minKey,
  maxKey,
}: {
  label: string;
  value: string;
  onChange: (key: string) => void;
  minKey?: string;
  maxKey?: string;
}) {
  const [year, month] = value.split("-").map(Number);
  const [pickerYear, setPickerYear] = useState(year);

  const makeKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
      {/* Year navigation */}
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={() => setPickerYear((y) => y - 1)}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold text-white tabular-nums">{pickerYear}</span>
        <button
          onClick={() => setPickerYear((y) => y + 1)}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Month grid */}
      <div className="grid grid-cols-4 gap-1">
        {MONTH_LABELS_SHORT.map((mLabel, idx) => {
          const m = idx + 1;
          const key = makeKey(pickerYear, m);
          const isSelected = key === value;
          const isDisabled =
            (minKey !== undefined && key < minKey) ||
            (maxKey !== undefined && key > maxKey);
          return (
            <button
              key={m}
              disabled={isDisabled}
              onClick={() => onChange(key)}
              className={cn(
                "py-1 rounded text-[10px] font-medium transition-all",
                isSelected
                  ? "bg-cyan-600 text-white"
                  : isDisabled
                  ? "text-neutral-700 cursor-not-allowed"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              )}
            >
              {mLabel}
            </button>
          );
        })}
      </div>
      {/* Current selection label */}
      <p className="text-[10px] text-center text-neutral-500">
        {MONTH_LABELS_SHORT[month - 1]} {year}
      </p>
    </div>
  );
}

export default function PlannedVsDoneChart({ transactions, categories }: PlannedVsDoneChartProps) {
  // Build flat categories with children populated
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatWithChildren = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  // Date range — derive min/max from transaction data
  const { minMonth, maxMonth } = useMemo(() => {
    const keys = transactions.map((t) => getMonthKey(new Date(t.date))).sort();
    return {
      minMonth: keys[0] || getMonthKey(new Date()),
      maxMonth: keys[keys.length - 1] || getMonthKey(new Date()),
    };
  }, [transactions]);

  const [dateFrom, setDateFrom] = useState(() => minMonth);
  const [dateTo, setDateTo] = useState(() => maxMonth);
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());
  const [cumulative, setCumulative] = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Toggle category selection
  const toggleCategory = (id: string, descendants: string[]) => {
    setSelectedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        descendants.forEach((d) => next.delete(d));
      } else {
        next.add(id);
        descendants.forEach((d) => next.add(d));
      }
      return next;
    });
  };

  // Month range in selection
  const monthRange = useMemo(() => generateMonthRange(dateFrom, dateTo), [dateFrom, dateTo]);

  // Compute per-month planned/done sums for selected categories
  const chartData = useMemo(() => {
    // Determine which transaction IDs to include
    const catIds = selectedCatIds.size > 0 ? selectedCatIds : new Set(flatWithChildren.map((c) => c.id));

    const monthly: Record<string, { planned: number; done: number }> = {};
    monthRange.forEach((mk) => {
      monthly[mk] = { planned: 0, done: 0 };
    });

    transactions.forEach((t) => {
      const mk = getMonthKey(new Date(t.date));
      if (!monthly[mk]) return;
      if (selectedCatIds.size > 0 && (!t.category || !catIds.has(t.category))) return;

      const isDone = t.transaction_type === "done" || t.source === "import" || t.is_archived === true;
      const isPlanned = t.transaction_type === "planned";

      if (isDone) monthly[mk].done += Number(t.amount);
      else if (isPlanned) monthly[mk].planned += Number(t.amount);
    });

    if (!cumulative) {
      return monthRange.map((mk) => ({
        month: formatMonthKey(mk),
        Planowane: monthly[mk].planned,
        Zrealizowane: monthly[mk].done,
      }));
    }

    // Cumulative
    let cumPlanned = 0, cumDone = 0;
    return monthRange.map((mk) => {
      cumPlanned += monthly[mk].planned;
      cumDone += monthly[mk].done;
      return {
        month: formatMonthKey(mk),
        Planowane: cumPlanned,
        Zrealizowane: cumDone,
      };
    });
  }, [transactions, selectedCatIds, monthRange, flatWithChildren, cumulative]);

  const noData = chartData.length === 0 || chartData.every((d) => d.Planowane === 0 && d.Zrealizowane === 0);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ---- LEFT SIDEBAR ---- */}
      <aside className="w-64 shrink-0 flex flex-col bg-neutral-950 border-r border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Planned vs Done
          </h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">Porównanie transakcji</p>
        </div>

        {/* Date range — FROM picker */}
        <div className="px-4 py-3 border-b border-neutral-800">
          <MonthRangePicker
            label="Od"
            value={dateFrom}
            onChange={(key) => {
              setDateFrom(key);
              if (key > dateTo) setDateTo(key);
            }}
            maxKey={dateTo}
          />
        </div>

        {/* Date range — TO picker */}
        <div className="px-4 py-3 border-b border-neutral-800">
          <MonthRangePicker
            label="Do"
            value={dateTo}
            onChange={(key) => {
              setDateTo(key);
              if (key < dateFrom) setDateFrom(key);
            }}
            minKey={dateFrom}
          />
        </div>

        {/* Chart options */}
        <div className="px-4 py-3 border-b border-neutral-800 space-y-2.5">
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Opcje</p>

          {/* Cumulative toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="cumulative-switch" className="text-xs text-neutral-300 cursor-pointer">
              Narastająco
            </Label>
            <Switch
              id="cumulative-switch"
              checked={cumulative}
              onCheckedChange={setCumulative}
              className="scale-75 origin-right"
            />
          </div>

          {/* Chart type toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-neutral-300">Typ wykresu</Label>
            <div className="flex bg-neutral-800 rounded-md p-0.5">
              <button
                onClick={() => setChartType("bar")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                  chartType === "bar"
                    ? "bg-cyan-700 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Słupki
              </button>
              <button
                onClick={() => setChartType("line")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                  chartType === "line"
                    ? "bg-cyan-700 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Linie
              </button>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="px-4 py-2 border-b border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Kategorie</p>
            {selectedCatIds.size > 0 && (
              <button
                onClick={() => setSelectedCatIds(new Set())}
                className="text-[10px] text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Wyczyść ({selectedCatIds.size})
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
            <Input
              placeholder="Szukaj kategorii..."
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="h-7 pl-6 text-xs bg-neutral-900 border-neutral-700"
            />
          </div>
          {selectedCatIds.size === 0 && (
            <p className="text-[10px] text-neutral-600 italic">Brak = wszystkie kategorie</p>
          )}
        </div>

        {/* Category tree */}
        <div className="flex-1 overflow-y-auto py-1">
          {categoryTree.map((cat) => (
            <CategoryItem
              key={cat.id}
              cat={cat}
              level={0}
              selectedIds={selectedCatIds}
              onToggle={toggleCategory}
              filterText={catFilter}
            />
          ))}
        </div>
      </aside>

      {/* ---- CHART AREA ---- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950 p-5">
        {/* Chart header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                {cumulative ? "Narastające sumy" : "Sumy miesięczne"} — Planned vs Done
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {selectedCatIds.size > 0
                  ? `${selectedCatIds.size} wybranych kategorii`
                  : "Wszystkie kategorie"}
                {" · "}
                {monthRange.length} {monthRange.length === 1 ? "miesiąc" : monthRange.length <= 4 ? "miesiące" : "miesięcy"}
              </p>
            </div>
            {/* Summary badges */}
            {!noData && (
              <div className="flex gap-3">
                {["Planowane", "Zrealizowane"].map((key) => {
                  const total = chartData.reduce((s, d) => s + (d as any)[key], 0);
                  const color = key === "Planowane" ? "text-violet-400" : "text-cyan-400";
                  return (
                    <div key={key} className="text-right">
                      <p className="text-[10px] text-neutral-500">{key}</p>
                      <p className={cn("text-sm font-mono font-semibold", color)}>
                        {formatCurrency(cumulative ? (chartData[chartData.length - 1] as any)?.[key] ?? 0 : total)} zł
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {noData ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Brak danych do wyświetlenia</p>
              <p className="text-xs mt-1 opacity-70">Zmień zakres dat lub wybór kategorii</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#737373", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#404040" }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#737373", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${formatCurrency(v)}`}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "#a3a3a3" }}
                  />
                  <ReferenceLine y={0} stroke="#525252" strokeWidth={1} />
                  <Bar dataKey="Planowane" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Zrealizowane" fill="#0891b2" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#737373", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#404040" }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#737373", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${formatCurrency(v)}`}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "#a3a3a3" }} />
                  <ReferenceLine y={0} stroke="#525252" strokeWidth={1} />
                  <Line
                    type="monotone"
                    dataKey="Planowane"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#7c3aed" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Zrealizowane"
                    stroke="#0891b2"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0891b2" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
