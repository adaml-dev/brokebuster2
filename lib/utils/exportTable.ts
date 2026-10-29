import * as XLSX from "xlsx";
import Papa from "papaparse";

export type ExportFormat = "xlsx" | "csv" | "html" | "pdf";

export interface ExportColumn<T> {
  header: string;
  numeric?: boolean;
  value: (row: T) => string | number | null;
}

interface ExportOptions {
  filename: string; // without extension
  title: string;
}

const formatNumberPl = (value: number) =>
  value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function downloadBlob(content: BlobPart, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildHtmlDocument<T>(columns: ExportColumn<T>[], rows: T[], title: string, forPrint: boolean) {
  const head = columns
    .map((c) => `<th${c.numeric ? ' class="num"' : ""}>${escapeHtml(c.header)}</th>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const value = c.value(row);
          if (c.numeric && typeof value === "number") {
            return `<td class="num${value < 0 ? " neg" : ""}">${formatNumberPl(value)}</td>`;
          }
          return `<td>${escapeHtml(value == null ? "" : String(value))}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("\n");

  const generated = new Date().toLocaleString("pl-PL");

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #111; background: #fff; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .neg { color: #b91c1c; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body { margin: 0; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Wygenerowano: ${escapeHtml(generated)} · Wierszy: ${rows.length}</div>
<table>
<thead><tr>${head}</tr></thead>
<tbody>
${body}
</tbody>
</table>
${forPrint ? "<script>window.addEventListener('load', function () { window.focus(); window.print(); });</script>" : ""}
</body>
</html>`;
}

export function exportTable<T>(format: ExportFormat, columns: ExportColumn<T>[], rows: T[], options: ExportOptions) {
  const { filename, title } = options;

  switch (format) {
    case "xlsx": {
      const data = [
        columns.map((c) => c.header),
        ...rows.map((row) => columns.map((c) => c.value(row) ?? "")),
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Number format for numeric columns
      columns.forEach((c, colIdx) => {
        if (!c.numeric) return;
        for (let r = 1; r <= rows.length; r++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c: colIdx })];
          if (cell && cell.t === "n") cell.z = "#,##0.00";
        }
      });

      ws["!cols"] = columns.map((c, colIdx) => {
        const longest = data.reduce((max, row) => Math.max(max, String(row[colIdx] ?? "").length), 0);
        return { wch: Math.min(60, Math.max(8, longest + 2)) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transakcje");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      break;
    }

    case "csv": {
      // Semicolon + comma decimals so it opens correctly in Polish Excel
      const csv = Papa.unparse(
        {
          fields: columns.map((c) => c.header),
          data: rows.map((row) =>
            columns.map((c) => {
              const value = c.value(row);
              if (typeof value === "number") return String(value).replace(".", ",");
              return value ?? "";
            })
          ),
        },
        { delimiter: ";" }
      );
      downloadBlob("﻿" + csv, "text/csv;charset=utf-8", `${filename}.csv`);
      break;
    }

    case "html": {
      downloadBlob(buildHtmlDocument(columns, rows, title, false), "text/html;charset=utf-8", `${filename}.html`);
      break;
    }

    case "pdf": {
      // Uses the browser's print dialog ("Zapisz jako PDF") so Polish characters render correctly
      const win = window.open("", "_blank");
      if (!win) {
        alert("Przeglądarka zablokowała nowe okno. Zezwól na wyskakujące okna, aby wyeksportować PDF.");
        return;
      }
      win.document.open();
      win.document.write(buildHtmlDocument(columns, rows, title, true));
      win.document.close();
      break;
    }
  }
}
