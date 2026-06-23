// Tiny CSV parser: handles quoted fields, embedded commas/newlines, and "" escapes.
// Returns the header row as `columns` and the rest as row objects keyed by header.

export function parseCsv(text: string): { columns: string[]; rows: Array<Record<string, string>> } {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { columns: [], rows: [] };

  const columns = nonEmpty[0].map((c) => c.trim());
  const dataRows = nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    columns.forEach((col, idx) => { obj[col] = (r[idx] ?? "").trim(); });
    return obj;
  });
  return { columns, rows: dataRows };
}
