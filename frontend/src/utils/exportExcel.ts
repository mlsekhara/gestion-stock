export function exporterCSV(filename: string, colonnes: string[], lignes: (string | number)[][]) {
  const BOM = "﻿";
  const header = colonnes.map(escapeCSV).join(";");
  const rows = lignes.map((row) => row.map(escapeCSV).join(";"));
  const csv = BOM + [header, ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  telecharger(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

function escapeCSV(val: string | number): string {
  const s = String(val ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function telecharger(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
