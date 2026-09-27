import type { FilesystemTools } from "./filesystem-tools.js";

const CODE_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".css", ".go", ".h", ".hpp", ".html", ".java", ".js", ".jsx", ".json", ".md", ".mjs", ".php", ".py", ".rb", ".rs", ".sql", ".tsx", ".ts", ".vue", ".yml", ".yaml"]);
const MAX_RESULTS = 1000;
export type CodeMatch = { path: string; line: number; column: number; text: string };
export type SymbolMatch = CodeMatch & { symbol: string; kind: string };

export class CodeTools {
  constructor(private readonly filesystem: FilesystemTools) {}

  async search(query: string, path = ".", caseSensitive = false, limit = 200): Promise<{ matches: CodeMatch[]; truncated: boolean }> {
    if (!query || query.length > 500) throw new Error("Search text must contain 1 to 500 characters.");
    const files = await this.codeFiles(path);
    const needle = caseSensitive ? query : query.toLowerCase();
    const matches: CodeMatch[] = [];
    for (const filePath of files.paths) {
      const content = await this.filesystem.read(filePath).catch(() => undefined);
      if (!content) continue;
      for (const [lineIndex, line] of content.content.split(/\r?\n/u).entries()) {
        const index = (caseSensitive ? line : line.toLowerCase()).indexOf(needle);
        if (index >= 0) matches.push({ path: filePath, line: lineIndex + 1, column: index + 1, text: line.slice(0, 1000) });
        if (matches.length >= boundedLimit(limit)) return { matches, truncated: true };
      }
    }
    return { matches, truncated: files.truncated };
  }

  async findFiles(pattern = "**/*", path = ".", limit = 200): Promise<{ files: string[]; truncated: boolean }> {
    const files = await this.codeFiles(path);
    const matcher = globMatcher(pattern);
    const matching = files.paths.filter((filePath) => matcher(filePath));
    return { files: matching.slice(0, boundedLimit(limit)), truncated: files.truncated || matching.length > boundedLimit(limit) };
  }

  async findSymbol(symbol: string, path = ".", limit = 100): Promise<SymbolMatch[]> {
    if (!/^[A-Za-z_$][\w$]*$/u.test(symbol)) throw new Error("Symbol must be a valid identifier.");
    const files = await this.codeFiles(path);
    const results: SymbolMatch[] = [];
    for (const filePath of files.paths) {
      const content = await this.filesystem.read(filePath).catch(() => undefined);
      if (!content) continue;
      for (const [lineIndex, line] of content.content.split(/\r?\n/u).entries()) {
        const definition = definitionOnLine(line, symbol);
        if (definition) results.push({ path: filePath, line: lineIndex + 1, column: definition.column, text: line.slice(0, 1000), symbol, kind: definition.kind });
        if (results.length >= boundedLimit(limit)) return results;
      }
    }
    return results;
  }

  async findDefinition(symbol: string, path = ".", limit = 20): Promise<SymbolMatch[]> { return this.findSymbol(symbol, path, limit); }

  async findReferences(symbol: string, path = ".", caseSensitive = true, limit = 200): Promise<{ matches: CodeMatch[]; truncated: boolean }> {
    if (!/^[A-Za-z_$][\w$]*$/u.test(symbol)) throw new Error("Symbol must be a valid identifier.");
    const files = await this.codeFiles(path);
    const expression = new RegExp(`(^|[^A-Za-z0-9_$])(${escapeRegExp(symbol)})(?=$|[^A-Za-z0-9_$])`, caseSensitive ? "u" : "iu");
    const matches: CodeMatch[] = [];
    for (const filePath of files.paths) {
      const content = await this.filesystem.read(filePath).catch(() => undefined);
      if (!content) continue;
      for (const [lineIndex, line] of content.content.split(/\r?\n/u).entries()) {
        const match = expression.exec(line);
        if (match) matches.push({ path: filePath, line: lineIndex + 1, column: (match.index ?? 0) + match[1].length + 1, text: line.slice(0, 1000) });
        if (matches.length >= boundedLimit(limit)) return { matches, truncated: true };
      }
    }
    return { matches, truncated: files.truncated };
  }

  private async codeFiles(path: string): Promise<{ paths: string[]; truncated: boolean }> {
    const listing = await this.filesystem.list(path, true, MAX_RESULTS);
    return { paths: listing.items.filter((item) => item.kind === "file" && CODE_EXTENSIONS.has(extension(item.path))).map((item) => item.path), truncated: listing.truncated };
  }
}

function definitionOnLine(line: string, symbol: string): { column: number; kind: string } | undefined {
  const pattern = new RegExp(`(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(function|class|interface|type|enum|const|let|var|def|struct|trait|mod|fn)\\s+${escapeRegExp(symbol)}\\b`, "u");
  const match = pattern.exec(line);
  return match ? { column: (match.index ?? 0) + 1, kind: match[1] } : undefined;
}
function extension(path: string): string { const dot = path.lastIndexOf("."); return dot >= 0 ? path.slice(dot).toLowerCase() : ""; }
function boundedLimit(value: number): number { return Math.min(Math.max(Number.isFinite(value) ? value : 200, 1), MAX_RESULTS); }
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"); }
function globMatcher(pattern: string): (value: string) => boolean {
  if (!pattern || pattern.length > 500) throw new Error("File pattern must contain 1 to 500 characters.");
  const expression = pattern.replaceAll("\\", "/").split("").map((char, index, all) => {
    if (char === "*" && all[index + 1] === "*") return "§";
    if (char === "*") return "[^/]*";
    if (char === "?") return "[^/]";
    return /[.+^${}()|[\]\\]/u.test(char) ? `\\${char}` : char;
  }).join("").replaceAll("§/", "(?:.*/)?").replaceAll("§", ".*");
  const regex = new RegExp(`^${expression}$`, "u");
  return (value) => regex.test(value);
}
