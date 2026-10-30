import assert from "node:assert/strict";
import { test } from "node:test";
import type { Kysely } from "kysely";
import { ZetroChatRepository } from "./chat.repository.js";
import type { ZetroDatabase } from "./chat.types.js";

test("a failed tool audit aborts the reply transaction", async () => {
  const writes: string[] = [];
  let committed = false;
  const transaction = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          where: () => ({ where: () => ({ executeTakeFirst: async () => ({ id: 4 }) }) })
        })
      })
    }),
    insertInto: (table: string) => ({
      values: () => ({
        execute: async () => {
          writes.push(table);
          if (table === "zetro_tool_events") throw new Error("Audit insert failed");
        }
      })
    })
  };
  const database = {
    transaction: () => ({
      execute: async (callback: (trx: typeof transaction) => Promise<unknown>) => {
        const result = await callback(transaction);
        committed = true;
        return result;
      }
    })
  } as unknown as Kysely<ZetroDatabase>;
  const repository = new ZetroChatRepository(database);
  await assert.rejects(
    repository.saveReply(
      "manager@example.com",
      4,
      "ACME balance",
      "ACME owes 120.50",
      {
        intent: "customer_outstanding",
        skillKey: "billing.customer-outstanding.read",
        skillDecision: "allowed",
        rulesHash: "rules",
        patternUuid: null
      },
      {
        capabilityKey: "billing.customer-outstanding.read",
        decision: "allowed",
        request: { contact: "ACME" },
        result: { balance: 120.5 }
      }
    ),
    /Audit insert failed/
  );
  assert.deepEqual(writes, ["zetro_messages", "zetro_interaction_logs", "zetro_tool_events"]);
  assert.equal(committed, false);
});
