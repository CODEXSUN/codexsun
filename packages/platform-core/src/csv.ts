/** Escapes CSV cells and prefixes formula-like values to reduce spreadsheet formula injection risk. */
export function stringifyCsv(rows: readonly (readonly unknown[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  let cellStarted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      if (cellStarted) throw new Error("CSV quote must start at the beginning of a cell.");
      quoted = true;
      cellStarted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
      closedQuote = false;
      cellStarted = false;
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      closedQuote = false;
      cellStarted = false;
      if (character === "\r" && input[index + 1] === "\n") index += 1;
    } else {
      if (closedQuote) throw new Error("CSV quoted cell must end with a delimiter or line break.");
      cell += character;
      cellStarted = true;
    }
  }

  if (quoted) throw new Error("CSV input has an unterminated quoted cell.");
  if (cellStarted || cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function escapeCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/u.test(text)) text = `'${text}`;
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
