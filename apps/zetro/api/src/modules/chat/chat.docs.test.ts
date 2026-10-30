import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { ZetroChatService } from "./chat.service.js";
import type { ZetroChatRepository, ZetroToolEvent, ZetroInteraction } from "./chat.repository.js";
import type { ZetroPolicyRepository } from "./chat.policy.js";
test("explicit /docs uses live Docs authority, audits citations and masks history after revocation", async () => {
  let allowed = true;
  let saved = "";
  let event: ZetroToolEvent | undefined;
  const repository = {
    get: async () => ({ id: 1, title: "Developer reference" }),
    messages: async () => [{ role: "assistant", content: saved }],
    allowedCapabilities: async () => ["docs.developer.read"],
    saveReply: async (
      _actor: string,
      _id: number | null,
      _prompt: string,
      reply: string,
      _interaction: ZetroInteraction,
      tool: ZetroToolEvent
    ) => {
      saved = reply;
      event = tool;
      return 1;
    },
    logFailed: async () => {}
  } as unknown as ZetroChatRepository;
  const service = new ZetroChatService(
    repository,
    { apiKey: "", baseUrl: "", model: "" },
    { canReadCapability: async () => false } as unknown as ZetroPolicyRepository,
    async () => {
      throw new Error("Billing lookup must not run");
    },
    async () => {
      throw new Error("Billing lookup must not run");
    },
    async () => {
      throw new Error("Billing lookup must not run");
    },
    undefined,
    async () => {
      if (!allowed) throw AppError.forbidden("Docs revoked");
      return [
        {
          title: "Billing Workflow",
          pageKey: "billing/workflow",
          url: "/app/docs/library?page=billing%2Fworkflow",
          sourcePath: "applications/billing/workflow.md",
          sourceHash: "a".repeat(64),
          revision: 2,
          origin: "database",
          excerpt: "Create a quotation, then record receipts."
        }
      ];
    }
  );
  const result = await service.send("developer@example.test", null, "/docs billing");
  assert.match(result.messages[0]!.content, /Billing Workflow/);
  assert.equal(event?.decision, "allowed");
  assert.equal(event?.capabilityKey, "docs.developer.read");
  allowed = false;
  const history = await service.get(1, "developer@example.test");
  assert.doesNotMatch(history.messages[0]!.content, /Create a quotation/);
  await service.send("developer@example.test", null, "/docs billing");
  assert.equal(event?.decision, "denied");
});
