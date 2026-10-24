export type PreviewRow = Record<string, unknown>;
export type RowComparison = "Match" | "No match" | "Not compared";

export function compareVisibleRows(rows: PreviewRow[], otherRows: PreviewRow[], columns: string[]) {
  const signatures = new Set(otherRows.map((row) => signature(row, columns)).filter(Boolean));
  return rows.map((row): RowComparison => {
    const value = signature(row, columns);
    return value === null ? "Not compared" : signatures.has(value) ? "Match" : "No match";
  });
}

function signature(row: PreviewRow, columns: string[]): string | null {
  if (
    !columns.length ||
    columns.some((column) => row[column] === "[redacted]" || !(column in row))
  ) {
    return null;
  }
  return JSON.stringify(columns.map((column) => normalize(row[column])));
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)])
    );
  }
  return value;
}
