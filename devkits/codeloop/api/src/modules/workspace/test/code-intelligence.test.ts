import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { CodeIntelligence } from "../code-intelligence.js";
import { FilesystemTools } from "../filesystem-tools.js";

test("TypeScript language service returns diagnostics, symbols, references, definitions, and AST", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "code-intelligence-test-"));
  const filesystem = new FilesystemTools(root, "read-write");
  const intelligence = new CodeIntelligence(filesystem);
  try {
    await filesystem.write("src/example.ts", "interface User { name: string }\nfunction greet(user: User) { return user.name; }\nconst result = greet({ name: 'A' });\n");
    const symbols = await intelligence.symbols("src/example.ts");
    assert.ok(symbols.symbols.some((symbol) => symbol.name === "User"));
    assert.ok(symbols.symbols.some((symbol) => symbol.name === "greet"));
    assert.ok((await intelligence.references({ path: "src/example.ts", line: 3, column: 16 })).references.length >= 1);
    assert.equal((await intelligence.definition({ path: "src/example.ts", line: 3, column: 16 })).definitions[0].line, 2);
    assert.equal((await intelligence.ast("src/example.ts", 50)).languageServer, "typescript");
    assert.ok((await intelligence.diagnostics("src/example.ts")).files.every((diagnostic) => diagnostic.severity !== "error"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
