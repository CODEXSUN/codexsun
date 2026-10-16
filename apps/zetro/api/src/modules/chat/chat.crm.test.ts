import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ZetroChatRepository, ZetroInteraction, ZetroToolEvent } from "./chat.repository.js";
import type { ZetroPolicyRepository } from "./chat.policy.js";
import { ZetroChatService } from "./chat.service.js";
import { ZETRO_QUERY_PATTERNS, ZETRO_REVIEW_PATTERNS } from "./chat.patterns.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("answers only assigned Local enquiries after a live grant", async () => {
  let permitted = false;
  let lookupCount = 0;
  let savedReply = "";
  const events: ZetroToolEvent[] = [];
  const repository = {
    saveReply: async (
      _owner: string,
      _id: number | null,
      _prompt: string,
      reply: string,
      _interaction: ZetroInteraction,
      event: ZetroToolEvent
    ) => {
      savedReply = reply;
      events.push(event);
      return 1;
    },
    get: async () => ({ id: 1, uuid: "00000001", title: "My enquiries" }),
    messages: async () => [{ id: 1, role: "assistant", content: savedReply }],
    allowedCapabilities: async () => []
  } as unknown as ZetroChatRepository;
  const policy = { canReadCapability: async () => permitted } as unknown as ZetroPolicyRepository;
  globalThis.fetch = async () => {
    throw new Error("An exact question must not require provider classification");
  };
  const service = new ZetroChatService(
    repository,
    { apiKey: "test", baseUrl: "https://example.com/v1", model: "test" },
    policy,
    async () => ({ companyName: "", financialYearName: "", matches: [] }),
    async () => {
      throw new Error("Billing must not run");
    },
    async () => {
      throw new Error("Billing must not run");
    },
    async () => {
      lookupCount += 1;
      return {
        source: "local",
        asOf: "2026-10-11",
        total: 4,
        active: 3,
        newCalls: 1,
        attention: 2
      };
    }
  );
  await service.send("staff@example.com", null, "How many enquiries are assigned to me?");
  assert.equal(lookupCount, 0);
  assert.equal(events[0]?.decision, "denied");
  assert.match(savedReply, /current permissions/);

  permitted = true;
  await service.send("staff@example.com", null, "My assigned enquiries");
  assert.equal(lookupCount, 1);
  assert.equal(events[1]?.decision, "allowed");
  assert.match(savedReply, /4 total, 3 active, 1 new, and 2 needing attention/);
  assert.match(savedReply, /only enquiries assigned to your signed-in account/);
});

test("does not claim Local CRM results when Frappe is selected", async () => {
  let reply = "";
  let event: ZetroToolEvent | null = null;
  const repository = {
    saveReply: async (
      _owner: string,
      _id: number | null,
      _prompt: string,
      answer: string,
      _interaction: ZetroInteraction,
      toolEvent: ZetroToolEvent
    ) => {
      reply = answer;
      event = toolEvent;
      return 1;
    },
    get: async () => ({ id: 1, uuid: "00000001", title: "My enquiries" }),
    messages: async () => [],
    allowedCapabilities: async () => []
  } as unknown as ZetroChatRepository;
  const service = new ZetroChatService(
    repository,
    { apiKey: "test", baseUrl: "https://example.com/v1", model: "test" },
    { canReadCapability: async () => true } as unknown as ZetroPolicyRepository,
    async () => ({ companyName: "", financialYearName: "", matches: [] }),
    async () => {
      throw new Error("Billing must not run");
    },
    async () => {
      throw new Error("Billing must not run");
    },
    async () => ({ source: "frappe" })
  );
  await service.send("staff@example.com", null, "My assigned enquiries");
  assert.match(reply, /currently use Frappe/);
  assert.equal((event as ZetroToolEvent | null)?.decision, "failed");
});

test("logs a review-only query without executing a record skill", async () => {
  let interaction: ZetroInteraction | null = null;
  let event: ZetroToolEvent | null = null;
  let savedReply = "";
  const repository = {
    saveReply: async (
      _owner: string,
      _id: number | null,
      _prompt: string,
      reply: string,
      metadata: ZetroInteraction,
      toolEvent: ZetroToolEvent | null
    ) => {
      savedReply = reply;
      interaction = metadata;
      event = toolEvent;
      return 1;
    },
    get: async () => ({ id: 1, uuid: "00000001", title: "Supplier" }),
    messages: async () => [],
    allowedCapabilities: async () => []
  } as unknown as ZetroChatRepository;
  globalThis.fetch = async () => {
    throw new Error("An exact supplier question must not call the provider");
  };
  const service = new ZetroChatService(
    repository,
    { apiKey: "test", baseUrl: "https://example.com/v1", model: "test" },
    {
      canReadCapability: async () => {
        throw new Error("No grant check for a draft");
      }
    } as unknown as ZetroPolicyRepository,
    async () => {
      throw new Error("No Billing read for a draft");
    },
    async () => {
      throw new Error("No Billing read for a draft");
    },
    async () => {
      throw new Error("No Billing read for a draft");
    }
  );
  await service.send("staff@example.com", null, "What do we owe supplier ACME?");
  assert.match(savedReply, /review catalog/);
  assert.equal(
    (interaction as ZetroInteraction | null)?.patternUuid,
    ZETRO_REVIEW_PATTERNS[0]?.uuid
  );
  assert.equal(event, null);
});

test("live and review patterns have unique serials and UUIDs", () => {
  const patterns = [...ZETRO_QUERY_PATTERNS, ...ZETRO_REVIEW_PATTERNS];
  assert.equal(patterns.length, 36);
  assert.equal(
    ZETRO_QUERY_PATTERNS.find((pattern) => pattern.serialNo === 36)?.queryPattern,
    "docs.developer.read"
  );
  assert.equal(new Set(patterns.map((pattern) => pattern.serialNo)).size, patterns.length);
  assert.equal(new Set(patterns.map((pattern) => pattern.uuid)).size, patterns.length);
});
