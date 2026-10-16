import assert from "node:assert/strict";
import test from "node:test";
import {
  ChatConnectionManager,
  ChatRealtimeBus,
  ChatRealtimeGateway,
  realtimeFrame,
  type ChatRealtimeConnection
} from "./chat.realtime.js";

function connection(overrides: Partial<ChatRealtimeConnection> & { connectionId: string }): {
  connection: ChatRealtimeConnection;
  frames: string[];
} {
  const frames: string[] = [];
  const connection: ChatRealtimeConnection = {
    channels: new Set(),
    context: {
      actorEmail: "ana@example.test",
      authorize: async () => {},
      companyId: 1,
      database: undefined as never,
      tenantDatabase: "tenant_test",
      tenantId: ""
    },
    socket: {
      close: () => {},
      send: (frame) => {
        frames.push(frame);
      }
    },
    ...overrides
  };
  return { connection, frames };
}

function frameOf(raw: string): { eventType: string; payload: Record<string, unknown> } {
  return JSON.parse(raw) as { eventType: string; payload: Record<string, unknown> };
}

test("realtime bus fans out only to subscribed connections", () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const first = connection({ connectionId: "one" });
  const second = connection({ connectionId: "two" });
  manager.admit(first.connection);
  manager.admit(second.connection);
  manager.subscribe("one", "channel-1");
  bus.publish("channel-1", realtimeFrame("message.created", { channelUuid: "channel-1" }));
  assert.equal(first.frames.length, 1);
  assert.equal(second.frames.length, 0);
});

test("realtime bus skips the excluded sender", () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const first = connection({ connectionId: "one" });
  manager.admit(first.connection);
  manager.subscribe("one", "channel-1");
  bus.publish("channel-1", realtimeFrame("typing.started", {}), "ana@example.test");
  assert.equal(first.frames.length, 0);
});

test("presence tracks subscribed channel members", () => {
  const manager = new ChatConnectionManager();
  const first = connection({ connectionId: "one" });
  const second = connection({
    connectionId: "two",
    context: { ...first.connection.context, actorEmail: "bob@example.test" }
  });
  manager.admit(first.connection);
  manager.admit(second.connection);
  manager.subscribe("one", "channel-1");
  manager.subscribe("two", "channel-1");
  assert.deepEqual(manager.onlineEmails("channel-1").sort(), [
    "ana@example.test",
    "bob@example.test"
  ]);
  manager.remove("two");
  assert.deepEqual(manager.onlineEmails("channel-1"), ["ana@example.test"]);
});

test("gateway answers ping and rejects malformed frames", async () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const gateway = new ChatRealtimeGateway(manager, bus);
  const peer = connection({ connectionId: "one" });
  manager.admit(peer.connection);
  await gateway.handle(
    "one",
    JSON.stringify({ eventId: "1", eventType: "chat.ping", payload: {} })
  );
  assert.equal(frameOf(peer.frames[0] ?? "").eventType, "pong");
  await gateway.handle("one", "not-json{{");
  assert.equal(frameOf(peer.frames[1] ?? "").eventType, "error");
  await gateway.handle(
    "one",
    JSON.stringify({ eventId: "2", eventType: "chat.nope", payload: {} })
  );
  assert.match(peer.frames[2] ?? "", /UNSUPPORTED_EVENT/);
});

test("gateway rejects oversized frames before parsing", async () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const gateway = new ChatRealtimeGateway(manager, bus);
  const peer = connection({ connectionId: "one" });
  manager.admit(peer.connection);
  await gateway.handle(
    "one",
    `{"eventId":"1","eventType":"chat.send","payload":{},"pad":"${"x".repeat(300 * 1024)}"}`
  );
  assert.match(peer.frames[0] ?? "", /PAYLOAD_TOO_LARGE/);
});

test("gateway typing fans out to other subscribers only", async () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const gateway = new ChatRealtimeGateway(manager, bus);
  const typer = connection({ connectionId: "typer" });
  const watcher = connection({
    connectionId: "watcher",
    context: { ...typer.connection.context, actorEmail: "bob@example.test" }
  });
  manager.admit(typer.connection);
  manager.admit(watcher.connection);
  manager.subscribe("typer", "channel-9");
  manager.subscribe("watcher", "channel-9");
  await gateway.handle(
    "typer",
    JSON.stringify({
      eventId: "1",
      eventType: "chat.typing",
      payload: { channelUuid: "channel-9", typing: true }
    })
  );
  assert.equal(typer.frames.length, 0);
  assert.equal(frameOf(watcher.frames[0] ?? "").eventType, "typing.started");
  await gateway.handle(
    "typer",
    JSON.stringify({
      eventId: "2",
      eventType: "chat.typing",
      payload: { channelUuid: "channel-9", typing: false }
    })
  );
  assert.equal(frameOf(watcher.frames[1] ?? "").eventType, "typing.stopped");
});

test("gateway reports unknown channels on subscribe without a database", async () => {
  const manager = new ChatConnectionManager();
  const bus = new ChatRealtimeBus(manager);
  const gateway = new ChatRealtimeGateway(manager, bus);
  const peer = connection({ connectionId: "one" });
  manager.admit(peer.connection);
  await gateway.handle(
    "one",
    JSON.stringify({
      eventId: "1",
      eventType: "chat.subscribe",
      payload: { channelUuid: "missing" }
    })
  );
  assert.match(peer.frames[0] ?? "", /UNKNOWN_CHANNEL/);
  assert.equal(manager.get("one")?.channels.size ?? -1, 0);
});
