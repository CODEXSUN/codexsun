import * as ts from "typescript";
import { relative, resolve } from "node:path";
import type { FilesystemTools } from "./filesystem-tools.js";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const MAX_FILES = 500;
const MAX_ITEMS = 500;

type SourceFile = { relativePath: string; absolutePath: string; content: string; version: string };
type PositionInput = { path: string; line: number; column: number };

export class CodeIntelligence {
  constructor(private readonly filesystem: FilesystemTools) {}

  async diagnostics(path?: string) {
    const service = await this.languageService();
    const files = path ? [this.sourcePath(path)] : service.files;
    return { languageServer: "typescript", files: files.flatMap((file) => this.diagnosticsFor(service.languageService, file)) };
  }

  async symbols(path?: string) {
    const service = await this.languageService();
    const files = path ? [this.sourcePath(path)] : service.files;
    return { languageServer: "typescript", symbols: files.flatMap((file) => this.symbolsFor(service.languageService, file)) };
  }

  async references(input: PositionInput) {
    const service = await this.languageService();
    const file = this.sourcePath(input.path);
    const position = this.position(service.languageService, file, input);
    const references = service.languageService.getReferencesAtPosition(file, position) ?? [];
    return { languageServer: "typescript", references: references.slice(0, MAX_ITEMS).map((reference) => this.location(service, reference.fileName, reference.textSpan)) };
  }

  async definition(input: PositionInput) {
    const service = await this.languageService();
    const file = this.sourcePath(input.path);
    const position = this.position(service.languageService, file, input);
    const definitions = service.languageService.getDefinitionAtPosition(file, position) ?? [];
    return { languageServer: "typescript", definitions: definitions.slice(0, MAX_ITEMS).map((definition) => this.location(service, definition.fileName, definition.textSpan)) };
  }

  async ast(path: string, maxNodes = MAX_ITEMS) {
    const service = await this.languageService();
    const file = this.sourcePath(path);
    const source = service.sourceFiles.get(file);
    if (!source) throw new Error("TypeScript source file not found.");
    const sourceFile = ts.createSourceFile(file, source.content, ts.ScriptTarget.Latest, true, scriptKind(file));
    let count = 0;
    const visit = (node: ts.Node, depth: number): unknown => {
      if (count++ >= Math.min(Math.max(maxNodes, 1), MAX_ITEMS)) return undefined;
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const item: { kind: string; line: number; column: number; name?: string; children?: unknown[]; truncated?: boolean } = { kind: ts.SyntaxKind[node.kind], line: start.line + 1, column: start.character + 1 };
      const name = (node as ts.NamedDeclaration).name;
      if (name && ts.isIdentifier(name)) item.name = name.text;
      if (depth < 20) {
        const children = node.getChildren(sourceFile).map((child) => visit(child, depth + 1)).filter((child) => child !== undefined);
        if (children.length) item.children = children;
      }
      return item;
    };
    const tree = visit(sourceFile, 0);
    return { languageServer: "typescript", path, ast: tree, truncated: count >= maxNodes };
  }

  private async languageService() {
    const listing = await this.filesystem.list(".", true, MAX_FILES);
    const sourceFiles = new Map<string, SourceFile>();
    for (const item of listing.items.filter((entry) => entry.kind === "file" && SOURCE_EXTENSIONS.has(extension(entry.path)))) {
      const content = await this.filesystem.read(item.path).catch(() => undefined);
      if (!content) continue;
      const absolutePath = this.absolute(item.path);
      sourceFiles.set(absolutePath, { relativePath: item.path, absolutePath, content: content.content, version: content.modifiedAt });
    }
    const files = [...sourceFiles.keys()];
    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({ allowJs: true, allowNonTsExtensions: true, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, noEmit: true, target: ts.ScriptTarget.ES2022 }),
      getCurrentDirectory: () => this.filesystem.root,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      getScriptFileNames: () => files,
      getScriptKind: (fileName) => scriptKind(fileName),
      getScriptSnapshot: (fileName) => {
        const source = sourceFiles.get(fileName);
        if (source) return ts.ScriptSnapshot.fromString(source.content);
        const content = ts.sys.readFile(fileName);
        return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
      },
      getScriptVersion: (fileName) => sourceFiles.get(fileName)?.version ?? "lib",
      fileExists: (fileName) => sourceFiles.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => sourceFiles.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: ts.sys.readDirectory,
      getNewLine: () => "\n",
    };
    return { files, sourceFiles, languageService: ts.createLanguageService(host, ts.createDocumentRegistry()) };
  }

  private diagnosticsFor(service: ts.LanguageService, file: string) {
    const diagnostics = [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)];
    return diagnostics.slice(0, MAX_ITEMS).map((diagnostic) => {
      const start = diagnostic.start ?? 0;
      const source = service.getProgram()?.getSourceFile(file);
      const position = source?.getLineAndCharacterOfPosition(start) ?? { line: 0, character: 0 };
      return { path: this.relative(file), line: position.line + 1, column: position.character + 1, code: diagnostic.code, severity: diagnosticCategory(diagnostic.category), message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") };
    });
  }

  private symbolsFor(service: ts.LanguageService, file: string) {
    const tree = service.getNavigationTree(file);
    const symbols: { name: string; kind: string; path: string; line: number; column: number }[] = [];
    const visit = (item: ts.NavigationTree): void => {
      if (item.text !== "<global>" && item.spans?.[0] && symbols.length < MAX_ITEMS) {
        const source = service.getProgram()?.getSourceFile(file);
        const position = source?.getLineAndCharacterOfPosition(item.spans[0].start) ?? { line: 0, character: 0 };
        symbols.push({ name: item.text, kind: item.kind, path: this.relative(file), line: position.line + 1, column: position.character + 1 });
      }
      for (const child of item.childItems ?? []) visit(child);
    };
    if (tree) visit(tree);
    return symbols;
  }

  private position(service: ts.LanguageService, file: string, input: PositionInput): number {
    if (!Number.isInteger(input.line) || !Number.isInteger(input.column) || input.line < 1 || input.column < 1) throw new Error("line and column are one-based positive integers.");
    const source = service.getProgram()?.getSourceFile(file);
    if (!source) throw new Error("TypeScript source file not found.");
    return source.getPositionOfLineAndCharacter(input.line - 1, input.column - 1);
  }

  private location(service: Awaited<ReturnType<CodeIntelligence["languageService"]>>, file: string, span: ts.TextSpan) {
    const source = service.languageService.getProgram()?.getSourceFile(file);
    const position = source?.getLineAndCharacterOfPosition(span.start) ?? { line: 0, character: 0 };
    return { path: this.relative(file), line: position.line + 1, column: position.character + 1, length: span.length };
  }

  private sourcePath(path: string): string { const absolute = this.absolute(path); if (!SOURCE_EXTENSIONS.has(extension(path))) throw new Error("Language intelligence currently supports TypeScript and JavaScript files."); return absolute; }
  private absolute(path: string): string { return resolve(this.filesystem.root, path); }
  private relative(path: string): string { return relative(this.filesystem.root, path).replaceAll("\\", "/"); }
}

function extension(path: string): string { const dot = path.lastIndexOf("."); return dot >= 0 ? path.slice(dot).toLowerCase() : ""; }
function scriptKind(path: string): ts.ScriptKind { const value = extension(path); return value === ".tsx" ? ts.ScriptKind.TSX : value === ".jsx" ? ts.ScriptKind.JSX : value === ".js" || value === ".mjs" ? ts.ScriptKind.JS : ts.ScriptKind.TS; }
function diagnosticCategory(category: ts.DiagnosticCategory): "error" | "warning" | "suggestion" | "message" { return category === ts.DiagnosticCategory.Error ? "error" : category === ts.DiagnosticCategory.Warning ? "warning" : category === ts.DiagnosticCategory.Suggestion ? "suggestion" : "message"; }
