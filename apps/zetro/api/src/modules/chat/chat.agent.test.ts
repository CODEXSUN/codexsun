import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { repositoryTemporaryDirectory } from "@codexsun/framework/storage";
import { loadZetroAgentRules } from "./chat.agent.js";

test("Zetro loads the canonical uppercase business rule file with its content hash", async () => {
  const text = (
    await readFile(new URL("../../../../agent/SKILLS.md", import.meta.url), "utf8")
  ).trim();
  assert.deepEqual(loadZetroAgentRules(), {
    text,
    hash: createHash("sha256").update(text).digest("hex")
  });
});

test("the rule loader fails closed for missing and empty files", async () => {
  const temporary = repositoryTemporaryDirectory();
  const fixture = await mkdtemp(join(temporary, "zetro-agent-rules-"));
  assert.ok(fixture.startsWith(temporary + sep));
  try {
    const module = join(fixture, "api/src/modules/chat/chat.agent.ts");
    await mkdir(join(fixture, "api/src/modules/chat"), { recursive: true });
    await copyFile(new URL("./chat.agent.ts", import.meta.url), module);
    const { loadZetroAgentRules: loadFixture } = await import(pathToFileURL(module).href);
    assert.throws(loadFixture, /Zetro business rules are unavailable/u);
    await mkdir(join(fixture, "agent"));
    await writeFile(join(fixture, "agent/SKILLS.md"), "   \n");
    assert.throws(loadFixture, /Zetro business rules are unavailable/u);
    await writeFile(
      join(fixture, "agent/SKILLS.md"),
      "# Business rules\n\nBackend permissions remain authoritative.\n"
    );
    assert.match(loadFixture().text, /Backend permissions remain authoritative/u);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
