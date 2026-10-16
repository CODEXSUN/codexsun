import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { io, type Socket } from "socket.io-client";
import { CodexsunRealtimeService } from "./realtime.service.js";
import type { CodexsunSocketIdentity } from "./realtime.types.js";

test(
  "real sockets enforce identity, permissions, revocation and payload limits",
  { timeout: 15000 },
  async () => {
    const http = createServer();
    const identities = new Map<string, CodexsunSocketIdentity>([
      ["owner", identity("a", "owner")],
      ["other", identity("a", "other")],
      ["tenant-b", identity("b", "owner")],
      ["approver", identity("a", "reviewer", true)]
    ]);
    const realtime = new CodexsunRealtimeService(http, async (credentials) => {
      const result = identities.get(credentials.cookie);
      if (!result) throw new Error("No session");
      return structuredClone(result);
    });
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const address = http.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const sockets: Socket[] = [];
    function client(cookie: string, portal = "web", origin?: string) {
      const socket = io(base, {
        path: "/codexsun/socket.io",
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
        autoConnect: false,
        extraHeaders: { cookie, ...(origin ? { origin } : {}) },
        auth: { sessionSlot: "12345678901234567890123456789012", portal }
      });
      sockets.push(socket);
      return socket;
    }
    try {
      for (const socket of [
        client("missing"),
        client("owner", "web", "https://attacker.example"),
        client("owner", "invalid")
      ]) {
        const refused = socketEvent(socket, "connect_error");
        socket.connect();
        await refused;
        assert.equal(socket.connected, false);
      }
      const owner = client("owner"),
        mobile = client("owner", "mobile"),
        other = client("other"),
        tenantB = client("tenant-b"),
        approver = client("approver");
      await Promise.all(
        [owner, mobile, other, tenantB, approver].map(async (socket) => {
          const connected = socketEvent(socket, "connect");
          socket.connect();
          await connected;
        })
      );
      const unrelated: unknown[] = [];
      other.on("codexsun:signal", (data) => unrelated.push(data));
      tenantB.on("codexsun:signal", (data) => unrelated.push(data));
      approver.on("codexsun:signal", (data) => unrelated.push(data));
      const message = socketEvent(mobile, "codexsun:signal");
      assert.equal(
        (await owner.timeout(2000).emitWithAck("codexsun:signal", { nonce: "test", text: "hello" }))
          .nonce,
        "test"
      );
      assert.equal((await message)[0]?.text, "hello");
      assert.deepEqual(unrelated, []);
      assert.ok(
        (
          await owner
            .timeout(2000)
            .emitWithAck("codexsun:signal", { nonce: "test", text: "x".repeat(241) })
        ).error
      );
      const changed = socketEvent(owner, "codexsun:changed"),
        reviewed = socketEvent(approver, "codexsun:changed");
      const hidden: unknown[] = [];
      other.on("codexsun:changed", (data) => hidden.push(data));
      tenantB.on("codexsun:changed", (data) => hidden.push(data));
      await realtime.publishChange({
        tenantUuid: "a",
        actorEmail: "owner",
        resource: "requirements",
        uuid: "1234abcd",
        action: "updated",
        revision: 2
      });
      assert.equal((await changed)[0]?.revision, 2);
      await reviewed;
      assert.deepEqual(hidden, []);
      for (let index = 0; index < 29; index++)
        await owner.timeout(2000).emitWithAck("codexsun:ping", { nonce: `rate_${index}` });
      assert.ok(
        (await owner.timeout(2000).emitWithAck("codexsun:ping", { nonce: "limited" })).error
      );
      identities.delete("owner");
      const disconnected = socketEvent(mobile, "disconnect");
      await realtime.publishChange({
        tenantUuid: "a",
        actorEmail: "owner",
        resource: "requirements",
        uuid: "1234abcd",
        action: "updated"
      });
      await disconnected;
      assert.equal(owner.connected, false);
      identities.set("other", identity("b", "other"));
      const changedTenant = socketEvent(other, "disconnect");
      other.emit("codexsun:ping", { nonce: "stale" });
      await changedTenant;
      assert.equal(other.connected, false);
    } finally {
      sockets.forEach((socket) => socket.disconnect());
      realtime.close();
      await new Promise<void>((resolve, reject) =>
        http.close((error) => (error ? reject(error) : resolve()))
      );
    }
  }
);
function socketEvent(
  socket: Socket,
  event: string
): Promise<{ text?: string; revision?: number }[]> {
  return new Promise((resolve) => socket.once(event, (...values) => resolve(values)));
}
function identity(tenantUuid: string, actorEmail: string, approve = false): CodexsunSocketIdentity {
  return {
    tenantUuid,
    actorEmail,
    permissions: {
      "codexsun.overview.view": true,
      "codexsun.requirements.view": true,
      "codexsun.requirements.approve": approve,
      "codexsun.devices.view": true
    }
  };
}
