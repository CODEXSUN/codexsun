import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { CodeTools } from "../code-tools.js";
import { FilesystemTools } from "../filesystem-tools.js";

test("code tools search source, symbols, references, definitions, and files", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "code-tools-test-"));
  const filesystem = new FilesystemTools(root, "read-write");
  const tools = new CodeTools(filesystem);
  try {
    await filesystem.write("src/example.ts", "export function greet() { return greetName; }\nconst greetName = 'hello';\n");
    assert.equal((await tools.search("greetName")).matches.length, 2);
    assert.equal((await tools.findSymbol("greetName"))[0].kind, "const");
    assert.equal((await tools.findDefinition("greet"))[0].kind, "function");
    assert.equal((await tools.findReferences("greetName")).matches.length, 2);
    assert.deepEqual(await tools.findFiles("**/*.ts"), { files: ["src/example.ts"], truncated: false });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
