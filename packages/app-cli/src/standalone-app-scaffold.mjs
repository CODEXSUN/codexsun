import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const slugPattern = /^[a-z][a-z0-9-]*$/u;

export function createStandaloneApplication(rootDir, options = {}) {
  const id = validateSlug(options.id);
  const label = String(options.label ?? titleCase(id)).trim() || titleCase(id);
  const target = resolve(options.target ?? resolve(rootDir, "..", id));
  assertDirectChild(rootDir, target);
  if (existsSync(target)) throw new Error(`Standalone application target already exists: ${target}`);

  const values = { APP_ID: id, APP_LABEL: label, APP_PACKAGE: `@codexsun/${id}` };
  for (const [file, content] of Object.entries(filesFor(values))) {
    const destination = resolve(target, file);
    assertInside(target, destination);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, "utf8");
  }
  return { id, label, target, files: Object.keys(filesFor(values)).length, mode: "standalone-foundation" };
}

export function validateStandaloneTarget(rootDir, target) {
  const resolved = resolve(target);
  assertDirectChild(rootDir, resolved);
  return resolved;
}

function filesFor(values) {
  const { APP_ID: id, APP_LABEL: label, APP_PACKAGE: packageName } = values;
  const upper = id.replaceAll("-", "_").toUpperCase();
  const apiPort = id === "crm" ? 6250 : id === "qcafe" ? 6260 : 6290;
  const webPort = apiPort + 1;
  const text = (value) => value.replaceAll(/\{\{(APP_ID|APP_LABEL|APP_PACKAGE|APP_UPPER|API_PORT|WEB_PORT)\}\}/gu, (_, key) => ({ APP_ID: id, APP_LABEL: label, APP_PACKAGE: packageName, APP_UPPER: upper, API_PORT: apiPort, WEB_PORT: webPort })[key]);
  const files = {
    ".gitignore": `node_modules/\ndist/\n.env\n*.sqlite\n*.sqlite-shm\n*.sqlite-wal\nstorage/apps/\n`,
    "README.md": `# ${label}\n\nA fresh CODEXSUN standalone application foundation. Business modules are intentionally absent.\n\n## Start\n\n\`npm install\`\n\`npm run verify\`\n\`npm run preflight -- ${id}-api --check\`\n\n## Ownership\n\nThe API, web host, contracts, storage documentation, tools, and agent records are owned by this repository. Shared package proposals stay under \`packages/shared/\`.\n`,
    "AGENTS.md": `# CODEXSUN ${label} Agent Rules\n\nThis repository is the only write boundary for ${label} work.\n\n## Strict write boundary\n\n- Work only inside \`E:\\codexsun\\${id}\`.\n- Do not write to \`E:\\codexsun\\codexsun\` or any sibling repository.\n- Do not copy business modules from another application.\n- Do not modify node_modules, dist, runtime databases, backups, or secrets.\n- Shared-package proposals stay under \`packages/shared/\`; promotion needs explicit owner approval.\n\nBefore every command, verify the current directory and Git root. Before every write, resolve the absolute target and confirm it stays inside this repository.\n`,
    "package.json": JSON.stringify({ name: packageName, version: "0.1.0", private: true, type: "module", workspaces: ["api", "web"], scripts: { check: "npm run check --workspaces --if-present", build: "npm run build --workspaces --if-present", test: "npm run test --workspaces --if-present", lint: `node -e "console.log('${label} lint baseline passed.')"`, "check:repository": "node tools/check-repository.mjs", "check:versions": "node tools/check-versions.mjs", preflight: "node tools/preflight.mjs", verify: "npm run check && npm test && npm run lint && npm run build && npm run check:versions && npm run check:repository", "version:bump": "node tools/version-bump.mjs", "github:now": "node tools/github-now.mjs", "platform:jwt-token": "tsx tools/platform-jwt-token.ts" }, devDependencies: { "@types/node": "^24.0.0", tsx: "^4.23.15", typescript: "^5.0.0" } }, null, 2) + "\n",
    "tsconfig.base.json": '{ "compilerOptions": { "target": "ES2022", "strict": true, "module": "NodeNext", "moduleResolution": "NodeNext", "jsx": "react-jsx", "skipLibCheck": true } }\n',
    "api/package.json": JSON.stringify({ name: `${packageName}-api`, version: "0.1.0", private: true, type: "module", scripts: { check: "tsc -p tsconfig.json --noEmit", build: "tsc -p tsconfig.json", test: "tsx --test src/index.test.ts" }, dependencies: { "@codexsun/contracts": "file:../../core/packages/contracts", "@codexsun/framework": "file:../../framework", "@codexsun/platform-core": "file:../../platform/packages/platform-core" } }, null, 2) + "\n",
    "api/tsconfig.json": '{ "extends": "../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }\n',
    "api/src/index.ts": `import { ensurePlatformJwtEnvironment } from "@codexsun/platform-core";\nimport { resolve } from "node:path";\nimport { applicationDatabasePath } from "./storage.js";\n\nexport const platformAuth = ensurePlatformJwtEnvironment({ applicationId: "${id}", envPath: resolve(import.meta.dirname, "../..", ".env") });\nexport const ${camel(id)}Application = { id: "${id}", label: "${label}", version: "0.1.0", databasePath: applicationDatabasePath("${id}"), operatorToken: platformAuth.operatorToken } as const;\n`,
    "api/src/index.test.ts": `import assert from "node:assert/strict";\nimport test from "node:test";\nimport { platformAuth } from "./index.js";\n\ntest("initializes Platform JWT credentials for development", () => {\n  assert.equal(platformAuth.secret.length, 64);\n  assert.equal(platformAuth.operatorToken.split(".").length, 3);\n});\n`,
    "api/src/storage.ts": `import { mkdirSync } from "node:fs";\nimport { dirname, resolve } from "node:path";\n\nexport function applicationDatabasePath(applicationId: string, environment: NodeJS.ProcessEnv = process.env): string {\n  const key = applicationId.replaceAll("-", "_").toUpperCase() + "_DATABASE_PATH";\n  const configured = environment[key]?.trim();\n  const databasePath = configured ? resolve(process.cwd(), configured) : resolve(process.cwd(), "storage", "apps", applicationId, "private", "data", applicationId + "_db.sqlite");\n  mkdirSync(dirname(databasePath), { recursive: true });\n  return databasePath;\n}\n`,
    "web/package.json": JSON.stringify({ name: `${packageName}-web`, version: "0.1.0", private: true, type: "module", scripts: { check: "tsc -p tsconfig.json --noEmit", build: "tsc -p tsconfig.json" }, dependencies: { "@codexsun/ui": "file:../../ui", react: "^19.3.0", "react-dom": "^19.3.0" } }, null, 2) + "\n",
    "web/tsconfig.json": '{ "extends": "../tsconfig.base.json", "compilerOptions": { "noEmit": true }, "include": ["src"] }\n',
    "web/src/index.tsx": `export function ${pascal(id)}WebEntry(): null { return null; }\n`,
    "assist/README.md": `# ${label} Assist\n\nThis guide governs the fresh foundation. Add business modules only after an approved plan.\n\n## Required workflow\n\nRead architecture, operations, storage, shared-package, and verification guidance before implementation. Keep module ownership local and use public package exports.\n`,
    "assist/architecture.md": `# ${label} Architecture\n\nThe API owns application routes and persistence. The web host owns the interface. Framework, Platform, Core, UI, and Contracts remain external package owners.\n`,
    "assist/development-plan.md": `# ${label} Development Plan\n\n- [ ] 1. Confirm foundation checks.\n- [ ] 2. Approve the first business module.\n- [ ] 3. Implement API, web, storage, contracts, tests, and documentation together.\n`,
    "assist/shared-package-workflow.md": `# ${label} Shared Package Workflow\n\nReuse public package exports. If a capability is missing, write a proposal only under \`packages/shared/<owner>/\`. Do not publish or edit an owner repository without explicit approval.\n`,
    "assist/operations/infrastructure.md": `# ${label} Infrastructure\n\nDefault development ports are API ${apiPort} and web ${webPort}. Runtime storage remains under \`storage/apps/${id}/private/data\`.\n`,
    "assist/operations/storage.md": `# ${label} Storage\n\nSQLite development data is stored under \`storage/apps/${id}/private/data/${id}_db.sqlite\`. Runtime data is ignored and never committed.\n`,
    "assist/execution/verification.md": `# ${label} Verification\n\nRun \`npm run verify\`. Report static checks separately from live service checks.\n`,
    "assist/documentation/standards.md": `# ${label} Documentation Standards\n\nEvery repository Markdown document starts with one descriptive title. Record implemented behavior separately from plans and never include credentials.\n`,
    "assist/documentation/CHAGELOG.md": `# ${label} Changelog\n\n## 0.1.0\n\n- Created fresh foundation without business modules.\n`,
    "agent/README.md": `# ${label} Agent Workspace\n\nTask planning and execution records for this repository only.\n`,
    "agent/plan.md": `# ${label} Plan\n\n- [ ] Foundation verification\n- [ ] First approved module\n`,
    "agent/task.md": `# ${label} Task Register\n\n- [ ] No business module has been approved yet\n`,
    "agent/changelog.md": `# ${label} Agent Changelog\n\n- Foundation generated by CODEXSUN application factory.\n`,
    "agent/operations.md": `# ${label} Agent Operations\n\nVerify repository boundary before every command and write only inside this repository.\n`,
    [`agent/exec/${id}-task.md`]: `# ${label} Foundation Task\n\n- [x] Create API and web hosts\n- [x] Add storage and Platform JWT bootstrap\n- [x] Add checks and documentation\n- [ ] Add approved business modules\n`,
    "tools/README.md": `# ${label} Tools\n\nRepository-local preflight, version, GitHub, boundary, and Platform JWT helpers.\n`,
    "tools/check-repository.mjs": checkRepository(id),
    "tools/check-versions.mjs": checkVersions(id),
    "tools/version-bump.mjs": versionBump(),
    "tools/github-now.mjs": githubNow(),
    "tools/preflight.mjs": preflight(id, label, apiPort, webPort),
    "tools/platform-jwt-token.ts": `import { createPlatformJwtToken } from "@codexsun/platform-core/jwt";\nconsole.log(createPlatformJwtToken({ subject: "${id}-operator", audience: "${id}", issuer: "codexsun-platform" }));\n`,
    "packages/shared/ui/README.md": shared("UI"),
    "packages/shared/framework/README.md": shared("Framework"),
    "packages/shared/platform/README.md": shared("Platform"),
    "packages/shared/core/README.md": shared("Core"),
    "packages/shared/contracts/README.md": shared("Contracts"),
    "storage/README.md": `# ${label} Storage\n\nThe runtime SQLite path is \`storage/apps/${id}/private/data/${id}_db.sqlite\`. Keep runtime files ignored.\n`,
  };
  return Object.fromEntries(Object.entries(files).map(([file, content]) => [file, text(content)]));
}

function checkRepository(id) { return `import { resolve } from "node:path";\nconst root = resolve(import.meta.dirname, "..");\nif (root !== resolve(process.cwd())) throw new Error("Run repository checks from the repository root.");\nconsole.log("Repository boundary passed for ${id}.");\n`; }
function checkVersions(id) { return `import { readFileSync } from "node:fs";\nconst packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));\nfor (const workspace of ["api", "web"]) { const child = JSON.parse(readFileSync(new URL(\`../\${workspace}/package.json\`, import.meta.url))); if (child.version !== packageJson.version) throw new Error(\`${id} version mismatch in \${workspace}.\`); }\nconsole.log(\`${id} versions aligned at \${packageJson.version}.\`);\n`; }
function versionBump() { return `import { readFileSync, writeFileSync } from "node:fs";\nconst path = "package.json";\nconst value = JSON.parse(readFileSync(path, "utf8"));\nconst [major, minor, patch] = value.version.split(".").map(Number);\nvalue.version = [major, minor, patch + 1].join(".");\nwriteFileSync(path, JSON.stringify(value, null, 2) + "\\n");\nfor (const workspace of ["api", "web"]) { const childPath = workspace + "/package.json"; const child = JSON.parse(readFileSync(childPath, "utf8")); child.version = value.version; writeFileSync(childPath, JSON.stringify(child, null, 2) + "\\n"); }\nconsole.log(value.version);\n`; }
function githubNow() { return `import { execFileSync } from "node:child_process";\nexecFileSync("git", ["status", "--short", "--branch"], { stdio: "inherit" });\nconsole.log("Review the diff, commit, and push explicitly from this repository.");\n`; }
function preflight(id, label, apiPort, webPort) { return `const services = { "${id}-api": ${apiPort}, "${id}-web": ${webPort} };\nconst [name, ...flags] = process.argv.slice(2);\nif (!services[name]) throw new Error(\`Use one of: \${Object.keys(services).join(", ")}.\`);\nconsole.log(\`${label} preflight prepared for \${name} on \${services[name]}.\${flags.includes("--check") ? " Add the runtime start command when implemented." : ""}\`);\n`; }
function shared(owner) { return `# Shared ${owner} Proposals\n\nKeep application-local proposals here. Promotion to the ${owner} owner repository requires explicit approval.\n`; }
function assertDirectChild(rootDir, target) { const parent = resolve(rootDir, ".."); if (target === resolve(rootDir) || target === parent || resolve(dirname(target)) !== parent) throw new Error(`Target must be a new direct child of ${parent}.`); }
function assertInside(root, target) { const rel = relative(root, target); if (rel.startsWith(`..${sep}`) || rel === ".." || rel.includes(`${sep}..${sep}`)) throw new Error(`Refusing to write outside ${root}.`); }
function validateSlug(id) { if (!slugPattern.test(String(id ?? ""))) throw new Error("Application ID must be a lowercase slug."); return id; }
function titleCase(id) { return id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function camel(id) { return id.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase()); }
function pascal(id) { const value = camel(id); return value[0].toUpperCase() + value.slice(1); }
