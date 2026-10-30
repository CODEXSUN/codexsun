import assert from "node:assert/strict";
import { test } from "node:test";
import { CallLogService } from "./call-log.service.js";
import type { CallLogRepository } from "./call-log.repository.js";

test("call log creation uses only the local repository contract", async () => {
  const calls: unknown[][] = [];
  const repository = {
    create: async (...args: unknown[]) => {
      calls.push(args);
      return { name: "CL-1" };
    }
  } as unknown as CallLogRepository;
  const service = new CallLogService(repository, "agent@example.com");

  const result = await service.create({
    type: "Incoming",
    from: "9876543210",
    to: "CRM",
    status: "Completed",
    duration: 30,
    user: null
  });

  assert.deepEqual(result, { name: "CL-1" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.length, 2);
  assert.equal(calls[0]?.[1], "agent@example.com");
});
