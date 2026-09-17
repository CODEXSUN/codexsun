import assert from "node:assert/strict";
import test from "node:test";
import type { MigrationDescriptor, SeederDescriptor } from "@codexsun/framework";
import { ModuleDataLifecyclePolicy, type ModuleDataLifecyclePlan } from "../src/index.js";

test("accepts module-owned migrations, seeders, and compatibility records", () => {
  const policy = new ModuleDataLifecyclePolicy();

  policy.validate(plan());
});

test("rejects descriptors owned by another module", () => {
  const policy = new ModuleDataLifecyclePolicy();
  const invalid = plan({ migrations: [migration("settings.001", "platform.identity")] });

  assert.throws(() => policy.validate(invalid), /cannot declare migration owned by platform.identity/u);
});

test("rejects duplicate descriptor IDs and incomplete compatibility records", () => {
  const policy = new ModuleDataLifecyclePolicy();
  const duplicate = plan({ migrations: [migration("settings.001"), migration("settings.001")] });
  const incomplete = plan({
    compatibility: { level: "coordinated-release", summary: "Requires paired deploy.", rollbackLimit: "" },
  });

  assert.throws(() => policy.validate(duplicate), /duplicate migration: settings.001/u);
  assert.throws(() => policy.validate(incomplete), /rollback limit is required/u);
});

function plan(overrides: Partial<ModuleDataLifecyclePlan> = {}): ModuleDataLifecyclePlan {
  return {
    moduleId: "platform.settings",
    migrations: [migration("settings.001")],
    seeders: [seeder("settings.seed.001")],
    compatibility: {
      level: "backward-compatible",
      summary: "Adds an optional settings table.",
      rollbackLimit: "Rollback removes only records created by this migration.",
    },
    ...overrides,
  };
}

function migration(id: string, owner = "platform.settings"): MigrationDescriptor {
  return { id, owner, description: "Create settings records.", apply: async () => undefined };
}

function seeder(id: string, owner = "platform.settings"): SeederDescriptor {
  return { id, owner, description: "Seed settings records.", seed: async () => undefined };
}
