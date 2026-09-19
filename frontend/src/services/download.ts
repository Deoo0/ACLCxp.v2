export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCsv(rows: unknown[][], filename: string) {
  const safe = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  downloadBlob(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(safe).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
    filename,
  );
}
