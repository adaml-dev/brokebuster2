import { StoredLayout } from "./useColumnLayout";

export type DatePreset = "dzis" | "tydz" | "mc" | "kwartal" | "rok";

export interface FilterPresetConfig {
  v: 1;
  filters: {
    searchRules: { text: string; operator: "AND" | "OR" }[];
    useAbsoluteAmount: boolean;
    linkStatus: string[];
    originFilter: string[];
    typeFilter: string[];
    selectedCategories: string[];
    excludedCategories: string[];
    selectedTags: string[];
    minAmount: string;
    maxAmount: string;
  };
  // A relative preset ("this month", "previous month", ...) or a fixed range
  date: { preset: DatePreset; offset: number } | { from: string; to: string };
  sort: { column: string; direction: "asc" | "desc" };
  columns: StoredLayout;
  itemsPerPage: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  config: FilterPresetConfig;
  updated_at: string;
}

// JSON with sorted object keys, so configs compare equal regardless of key order (jsonb reorders keys)
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const mondayOf = (d: Date) => {
  const day = startOfDay(d);
  const weekday = day.getDay();
  day.setDate(day.getDate() - (weekday === 0 ? 6 : weekday - 1));
  return day;
};

// How many preset periods `base` is away from `today` (0 = current, -1 = previous, ...)
export function getPresetOffset(preset: DatePreset, base: Date, today: Date): number {
  const months = (base.getFullYear() - today.getFullYear()) * 12 + (base.getMonth() - today.getMonth());
  switch (preset) {
    case "dzis":
      return Math.round((startOfDay(base).getTime() - startOfDay(today).getTime()) / DAY_MS);
    case "tydz":
      return Math.round((mondayOf(base).getTime() - mondayOf(today).getTime()) / (7 * DAY_MS));
    case "mc":
      return months;
    case "kwartal":
      return (base.getFullYear() * 4 + Math.floor(base.getMonth() / 3)) - (today.getFullYear() * 4 + Math.floor(today.getMonth() / 3));
    case "rok":
      return base.getFullYear() - today.getFullYear();
  }
}

// Base date for a preset shifted by `offset` periods from `today`
export function getPresetBaseDate(preset: DatePreset, offset: number, today: Date): Date {
  switch (preset) {
    case "dzis":
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    case "tydz":
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset * 7);
    case "mc":
      return new Date(today.getFullYear(), today.getMonth() + offset, 1);
    case "kwartal":
      return new Date(today.getFullYear(), today.getMonth() + offset * 3, 1);
    case "rok":
      return new Date(today.getFullYear() + offset, 0, 1);
  }
}

const PRESET_LABELS: Record<DatePreset, [string, string, string]> = {
  // [current, previous, generic]
  dzis: ["dziś", "wczoraj", "dzień"],
  tydz: ["ten tydzień", "poprzedni tydzień", "tydzień"],
  mc: ["ten miesiąc", "poprzedni miesiąc", "miesiąc"],
  kwartal: ["ten kwartał", "poprzedni kwartał", "kwartał"],
  rok: ["ten rok", "poprzedni rok", "rok"],
};

export function describeDate(date: FilterPresetConfig["date"]): string {
  if ("preset" in date) {
    const [current, previous, generic] = PRESET_LABELS[date.preset];
    if (date.offset === 0) return current;
    if (date.offset === -1) return previous;
    return `${generic} ${date.offset > 0 ? "+" : "−"}${Math.abs(date.offset)}`;
  }
  if (!date.from && !date.to) return "wszystkie daty";
  return `${date.from || "…"} – ${date.to || "…"}`;
}
