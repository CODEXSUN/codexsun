import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const owner = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(owner, "../../..");
const bash = process.env.BASH_EXECUTABLE || "bash";

function run(action, args = [], networkExists = false, configured = true, failAt = "") {
  mkdirSync(resolve(root, "dist/agentcrew"), { recursive: true });
  const fixture = mkdtempSync(resolve(root, "dist/agentcrew/lifecycle-"));
  try {
    mkdirSync(resolve(fixture, ".container"));
    for (const name of ["ollama-common.sh", `ollama-${action}.sh`]) {
      copyFileSync(resolve(owner, name), resolve(fixture, name));
    }
    writeFileSync(resolve(fixture, ".container/.env.example"), "AGENTCREW_TOKEN=\n");
    if (configured) writeFileSync(resolve(fixture, ".container/.env"), "AGENTCREW_TOKEN=test-fixture-only\n");
    const log = resolve(fixture, "calls.log");
    writeFileSync(log, "");
    const mock = resolve(fixture, "mock.sh");
    writeFileSync(
      mock,
      `docker() {
      printf '%s\\n' "$*" >> "$CALL_LOG"
      if [[ -n "$FAIL_AT" && "$*" == *"$FAIL_AT"* ]]; then return 1; fi
      case "$*" in
        'network inspect codexsun-network') [[ "$NETWORK_EXISTS" == true ]]; return ;;
        *'process.env.AGENTCREW_EMBED_MODEL'*) printf 'nomic-embed-text\\n' ;;
        *'process.env.AGENTCREW_MODEL'*) printf 'qwen3:4b\\n' ;;
      esac
      return 0
    }
    `,
    );
    const result = spawnSync(bash, [resolve(fixture, `ollama-${action}.sh`), ...args], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        BASH_ENV: mock.replaceAll("\\", "/"),
        CALL_LOG: log.replaceAll("\\", "/"),
        NETWORK_EXISTS: String(networkExists),
        FAIL_AT: failAt,
      },
    });
    assert.ifError(result.error);
    return { ...result, calls: readFileSync(log, "utf8") };
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

test("setup creates a missing network and installs requested models", () => {
  const result = run("setup", ["--pull-models"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.calls, /network create codexsun-network/);
  assert.match(result.calls, /compose --project-name cx-agentcrew /);
  assert.match(result.calls, /up -d --wait --wait-timeout 180/);
  assert.match(result.calls, /ollama pull qwen3:4b/);
  assert.match(result.calls, /ollama pull nomic-embed-text/);
});

test("update reuses a network and preserves models without explicit download", () => {
  const result = run("update", ["--gpu"], true);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.calls, /network create|ollama pull|down|prune/);
  assert.match(result.calls, /compose.gpu.yml/);
  assert.match(result.calls, /build --pull api web/);
});

test("drop preserves data and never removes the shared network", () => {
  const result = run("drop");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.calls, / down\n/);
  assert.doesNotMatch(result.calls, /--volumes|network |prune/);
});

test("purge requires both confirmation flags", () => {
  for (const flag of ["--purge-data", "--confirm-cx-agentcrew"]) {
    const result = run("drop", [flag]);
    assert.equal(result.status, 2);
    assert.equal(result.calls, "");
  }
  const result = run("drop", ["--purge-data", "--confirm-cx-agentcrew"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.calls, /down --volumes/);
  assert.doesNotMatch(result.calls, /network |prune/);
});

test("invalid options and missing configuration fail without deployment", () => {
  assert.equal(run("setup", ["--purge-data"]).status, 2);
  assert.equal(run("drop", ["--pull-models"]).status, 2);
  assert.equal(run("drop", ["--purge-data", "--confirm-agentcrew-local"]).status, 2);
  assert.equal(run("update", ["--unknown"]).status, 2);
  const result = run("setup", [], false, false);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Configure/);
  assert.doesNotMatch(result.calls, /network | up |build|pull/);
});

test("build and configuration failures stop subsequent mutations", () => {
  const build = run("update", ["--pull-models"], true, true, "build --pull");
  assert.equal(build.status, 1);
  assert.doesNotMatch(build.calls, /up -d|ollama pull/);
  const config = run("drop", [], true, true, "config --quiet");
  assert.equal(config.status, 1);
  assert.doesNotMatch(config.calls, / down/);
});
