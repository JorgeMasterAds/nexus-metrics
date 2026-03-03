export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const sep = ";"; // semicolon for PT-BR Excel compatibility
  const csvRows = [
    headers.join(sep),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? "");
      return val.includes(sep) || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(sep))
  ];
  // BOM for UTF-8 encoding in Excel
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${formatDateForFilename()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDateForFilename(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${y}-${m}-${d}`;
}
