import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tag, Transaction } from "@/lib/types/dashboard";
import { TagBadge } from "./TagBadge";
import { ColumnSizing } from "./useColumnLayout";

export type TransactionRow = Transaction & { cumulativeBalance?: number };

export interface ColumnContext {
  getCategoryName: (categoryId: string | null | undefined) => string;
  onToggleRealized: (t: Transaction) => void;
  showTagsInDescription: boolean;
}

export interface TransactionColumn extends ColumnSizing {
  label: string;
  // Tooltip on the column header
  headerTitle?: string;
  sortKey?: string;
  align?: "right";
  numeric?: boolean;
  showTitle?: boolean;
  cellClassName?: string;
  // Classes for the content wrapper measured by auto-fit (defaults to "truncate")
  fitClassName?: string;
  render: (t: TransactionRow, ctx: ColumnContext) => React.ReactNode;
  exportValue: (t: TransactionRow, ctx: ColumnContext) => string | number | null;
}

export function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  const absRounded = Math.abs(rounded);
  let str = String(absRounded);
  const parts = [];
  while (str.length > 3) {
    parts.unshift(str.slice(-3));
    str = str.slice(0, -3);
  }
  if (str) {
    parts.unshift(str);
  }
  return (rounded < 0 ? "-" : "") + parts.join(" ");
}

const getOriginBadgeVariant = (origin: string | null | undefined) => {
  const lower = origin?.toLowerCase() || "";
  if (lower.includes("mbank")) return "info";
  if (lower.includes("ing")) return "warning";
  if (lower.includes("pekao")) return "success";
  if (lower.includes("cash")) return "secondary";
  return "default";
};

const typeLabel = (t: Transaction) =>
  t.transaction_type === "done" ? "Dokonana" : t.is_realized ? "Planowana (zrealizowana)" : "Planowana";

export const TRANSACTION_COLUMNS: TransactionColumn[] = [
  {
    id: "date",
    label: "Data",
    sortKey: "date",
    defaultWidth: 100,
    render: (t) => t.date,
    exportValue: (t) => t.date,
  },
  {
    id: "payee",
    label: "Odbiorca",
    sortKey: "payee",
    defaultWidth: 200,
    maxAutoWidth: 280,
    showTitle: true,
    render: (t) => t.payee,
    exportValue: (t) => t.payee ?? "",
  },
  {
    id: "description",
    label: "Opis",
    defaultWidth: 320,
    showTitle: true,
    fitClassName: "flex flex-col gap-1",
    render: (t, ctx) => (
      <>
        <span className="truncate">{t.description}</span>
        {ctx.showTagsInDescription && t.tags && t.tags.length > 0 && (
          <div className="flex gap-1 overflow-hidden">
            {t.tags.map((tag: Tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} className="scale-75 origin-left" />
            ))}
          </div>
        )}
      </>
    ),
    exportValue: (t) => t.description ?? "",
  },
  {
    id: "tags",
    label: "Tagi",
    defaultWidth: 160,
    defaultHidden: true,
    fitClassName: "flex gap-1 overflow-hidden",
    render: (t) =>
      t.tags?.map((tag: Tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />),
    exportValue: (t) => t.tags?.map((tag) => tag.name).join(", ") ?? "",
  },
  {
    id: "category",
    label: "Kategoria",
    sortKey: "category",
    defaultWidth: 160,
    showTitle: true,
    render: (t, ctx) => ctx.getCategoryName(t.category),
    exportValue: (t, ctx) => (t.category ? ctx.getCategoryName(t.category) : ""),
  },
  {
    id: "origin",
    label: "Pochodzenie",
    sortKey: "origin",
    defaultWidth: 100,
    render: (t) => <Badge variant={getOriginBadgeVariant(t.origin)}>{t.origin || "Nieznane"}</Badge>,
    exportValue: (t) => t.origin ?? "",
  },
  {
    id: "source",
    label: "Źródło",
    sortKey: "source",
    defaultWidth: 120,
    defaultHidden: true,
    render: (t) => t.source,
    exportValue: (t) => t.source ?? "",
  },
  {
    id: "type",
    label: "Typ",
    sortKey: "transaction_type",
    defaultWidth: 120,
    fitClassName: "flex items-center gap-2",
    render: (t, ctx) => (
      <>
        <Badge variant={t.transaction_type === "done" ? "success" : (t.is_realized ? "info" : "warning")}>
          {typeLabel(t)}
        </Badge>
        {t.transaction_type === "planned" && (
          <input
            type="checkbox"
            checked={t.is_realized || false}
            onChange={() => ctx.onToggleRealized(t)}
            title="Oznacz jako zrealizowaną"
            className="w-3.5 h-3.5 shrink-0 rounded border-neutral-600 bg-neutral-850 text-green-600 focus:ring-green-500 cursor-pointer"
          />
        )}
      </>
    ),
    exportValue: (t) => typeLabel(t),
  },
  {
    id: "amount",
    label: "Kwota",
    sortKey: "amount",
    align: "right",
    numeric: true,
    defaultWidth: 100,
    cellClassName: "font-medium",
    render: (t) => (
      <span className={(t.amount || 0) >= 0 ? "text-green-500" : "text-red-500"}>{formatAmount(t.amount || 0)}</span>
    ),
    exportValue: (t) => t.amount || 0,
  },
  {
    id: "balance",
    label: "Saldo narastające",
    headerTitle: "Suma kwot przefiltrowanych transakcji od najstarszej do danej (chronologicznie). Nie zależy od sortowania ani strony.",
    align: "right",
    numeric: true,
    defaultWidth: 100,
    cellClassName: "font-medium",
    render: (t) => formatAmount(t.cumulativeBalance ?? 0),
    exportValue: (t) => t.cumulativeBalance ?? 0,
  },
  {
    id: "created_at",
    label: "Utworzono",
    sortKey: "created_at",
    defaultWidth: 150,
    defaultHidden: true,
    render: (t) => (t.created_at ? new Date(t.created_at).toLocaleString("pl-PL") : ""),
    exportValue: (t) => (t.created_at ? new Date(t.created_at).toLocaleString("pl-PL") : ""),
  },
];

export const TRANSACTION_COLUMNS_BY_ID = Object.fromEntries(TRANSACTION_COLUMNS.map((c) => [c.id, c]));
