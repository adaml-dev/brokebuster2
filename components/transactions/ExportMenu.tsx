"use client";

import React from "react";
import { Download, FileSpreadsheet, FileText, FileCode, Printer } from "lucide-react";
import { ExportFormat } from "@/lib/utils/exportTable";
import DropdownPanel from "./DropdownPanel";

interface ExportMenuProps {
  rowCount: number;
  onExport: (format: ExportFormat) => void;
}

const OPTIONS: { format: ExportFormat; label: string; hint: string; icon: React.ElementType }[] = [
  { format: "xlsx", label: "Excel (.xlsx)", hint: "Arkusz z liczbami", icon: FileSpreadsheet },
  { format: "csv", label: "CSV (.csv)", hint: "Separator „;”, przecinek dziesiętny", icon: FileText },
  { format: "html", label: "HTML (.html)", hint: "Tabela do otwarcia w przeglądarce", icon: FileCode },
  { format: "pdf", label: "PDF", hint: "Okno drukowania → Zapisz jako PDF", icon: Printer },
];

export default function ExportMenu({ rowCount, onExport }: ExportMenuProps) {
  return (
    <DropdownPanel
      label={
        <>
          <Download className="h-4 w-4 mr-2" />
          Eksport
        </>
      }
      buttonClassName="flex-1 sm:flex-initial sm:w-36"
      panelClassName="w-64"
    >
      {(close) => (
        <div className="text-sm">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            {rowCount} wierszy · widoczne kolumny
          </div>
          {OPTIONS.map(({ format, label, hint, icon: Icon }) => (
            <button
              key={format}
              type="button"
              disabled={rowCount === 0}
              onClick={() => {
                close();
                onExport(format);
              }}
              className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-neutral-900 text-left disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Icon className="h-4 w-4 mt-0.5 text-neutral-400 shrink-0" />
              <span className="flex flex-col">
                <span>{label}</span>
                <span className="text-[10px] text-neutral-500">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </DropdownPanel>
  );
}
