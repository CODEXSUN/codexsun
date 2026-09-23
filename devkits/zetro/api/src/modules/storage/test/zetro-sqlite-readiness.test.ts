import assert from "node:assert/strict";
import test from "node:test";
import { ZetroSqliteReadiness } from "../zetro-sqlite-readiness";

test("checks the configured SQLite connection through Platform Core", async () => {
  const readiness = new ZetroSqliteReadiness(":memory:");
  assert.equal(await readiness.check(), true);
});
