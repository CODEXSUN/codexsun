import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

test("validates the CXForge task contract used by Zuno", () => {
  const taskSchema = z.object({ title: z.string().trim().min(3), repository: z.string().trim().min(1), ownedPaths: z.array(z.string().trim().min(1)).min(1) });
  assert.equal(taskSchema.safeParse({ title: "Dispatch worker", repository: "repo", ownedPaths: ["apps/zuno"] }).success, true);
  assert.equal(taskSchema.safeParse({ title: "No", repository: "repo", ownedPaths: [] }).success, false);
});
