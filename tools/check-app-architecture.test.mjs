import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkAppArchitecture } from "./check-app-architecture.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "codexsun-app-architecture-"));
  write(root, "registry/profiles/development.json", JSON.stringify({ schemaVersion: 1, id: "development", enabledApplications: [], enabledAddons: [] }));
  return root;
}

function registerApplication(root, name, hosts) {
  write(
    root,
    `registry/applications/${name}.json`,
    JSON.stringify({
      kind: "application",
      schemaVersion: 1,
      id: name,
      label: name,
      taskPrefix: name[0],
      providers: [],
      hosts: hosts.map((kind) => ({
        kind,
        target: `${name}-${kind}`,
        displayName: `${name} ${kind}`,
        environmentDirectory: kind,
        envKey: `${name.toUpperCase()}_${kind.toUpperCase()}_PORT`,
        workspace: `@codexsun/${name}-${kind}`,
      })),
    }),
  );
}

function app(root, name, hosts) {
  write(root, `apps/${name}/README.md`, "# App\n");
  for (const host of hosts) {
    write(root, `apps/${name}/${host}/README.md`, "# Host\n");
    write(root, `apps/${name}/${host}/package.json`, JSON.stringify({ dependencies: { "@codexsun/ui": "*" } }));
    write(root, `apps/${name}/${host}/tsconfig.json`, "{}\n");
    write(root, `apps/${name}/${host}/.app.env.example`, "HOST=127.0.0.1\n");
    write(root, `apps/${name}/${host}/src/app.tsx`, 'import "@codexsun/ui";\n');
    write(root, `apps/${name}/${host}/src/main.tsx`, "export {};\n");
  }
}

function write(root, file, content) {
  const path = join(root, file);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
}

test("reports missing host and module architecture requirements", () => {
  const root = fixture();
  try {
    registerApplication(root, "platform", ["api", "web", "desktop", "mobile"]);
    assert.throws(() => checkAppArchitecture(root), /apps\/platform: missing application README/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("explains missing event declarations for a module provider", () => {
  const root = fixture();
  try {
    for (const [name, profile] of Object.entries({
      platform: ["api", "web", "desktop", "mobile"],
      docs: ["api", "web"],
      zetro: ["api", "web"],
      uiux: ["web"],
    })) {
      registerApplication(root, name, profile);
      app(root, name, profile);
    }

    write(root, "apps/platform/api/src/config.ts", "export {};\n");
    write(root, "apps/platform/api/src/server.ts", "export {};\n");
    write(
      root,
      "apps/platform/api/package.json",
      JSON.stringify({ dependencies: { "@codexsun/framework": "*", "@codexsun/platform-core": "*" } }),
    );
    write(root, "apps/platform/api/src/modules/demo/README.md", "# Demo\n");
    write(
      root,
      "apps/platform/api/src/modules/demo/provider.ts",
      'export const provider = { owner: "apps/platform/api/modules/demo" };\n',
    );
    write(root, "apps/platform/api/src/modules/demo/test/demo.test.ts", "export {};\n");

    assert.throws(() => checkAppArchitecture(root), /provider must declare published and consumed events/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
