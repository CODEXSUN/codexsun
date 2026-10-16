import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import test from "node:test";
import { ComponentDocumentationAudit } from "./check-component-docs.mjs";
import { repositoryTempDirectory } from "./repository-temp.mjs";

test("new components require all four documents and exact portable filenames", () => {
  const root = mkdtempSync(join(repositoryTempDirectory(), "component-docs-"));
  assert.ok(root.startsWith(repositoryTempDirectory() + sep));
  try {
    const owner = join(root, "apps", "example");
    mkdirSync(join(owner, "agent"), { recursive: true });
    for (const file of ["README.md", "agent/TASK.md", "agent/PLAN.md", "agent/SKILLS.md"])
      writeFileSync(join(owner, file), `# Example\n\n${"Component-specific guidance. ".repeat(8)}`);
    assert.deepEqual(new ComponentDocumentationAudit(root).run().failures, []);
    renameSync(join(owner, "agent/SKILLS.md"), join(owner, "agent/skills.md"));
    assert.match(
      new ComponentDocumentationAudit(root).run().failures.join("\n"),
      /agent\/SKILLS.md/u
    );
    rmSync(join(owner, "agent/TASK.md"));
    assert.equal(new ComponentDocumentationAudit(root).run().failures.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("external CODEXSUN add-ons require local integration guides", () => {
  const root = mkdtempSync(join(repositoryTempDirectory(), "addon-docs-"));
  assert.ok(root.startsWith(repositoryTempDirectory() + sep));
  try {
    writeFileSync(
      join(root, "package-lock.json"),
      JSON.stringify({
        packages: {
          "node_modules/@codexsun/blog": { version: "1.0.16" },
          "node_modules/@codexsun/framework": { link: true }
        }
      })
    );
    const result = new ComponentDocumentationAudit(root).run();
    assert.equal(result.owners, 1);
    assert.equal(result.failures.length, 4);
    assert.ok(result.failures.every((failure) => failure.startsWith("addons/blog/")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
