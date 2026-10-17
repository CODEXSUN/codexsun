import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
type Send = (
  method: "GET" | "POST" | "PUT",
  url: string,
  payload?: unknown,
  token?: string
) => Promise<{ status: number; body: ReturnType<typeof JSON.parse> }>;
export async function verifyKitchenDelivery(send: Send, menuUuid: string) {
  const waiter = await send("POST", "/qcafe/waiters", {
    code: "TEST-W01",
    name: "Kitchen test waiter",
    status: "active"
  });
  assert.equal(waiter.status, 200, JSON.stringify(waiter.body));
  assert.equal(
    (
      await send(
        "POST",
        "/qcafe/waiters",
        { code: "DENIED", name: "Denied", status: "active" },
        "read-only"
      )
    ).status,
    403
  );
  assert.equal((await send("GET", "/qcafe/waiters", undefined, "tenant-b")).body.data.length, 0);
  const table = await send("POST", "/qcafe/tables", {
    name: "Kitchen delivery",
    seats: 4,
    status: "active"
  });
  assert.equal(table.status, 200);
  const input = {
    requestId: randomUUID(),
    revision: 0,
    action: "kitchen",
    name: "Kitchen delivery",
    mode: "KOT",
    tableUuid: table.body.data.uuid,
    seats: [1, 2],
    lines: [{ menuUuid, quantity: 2 }]
  };
  const url = "/qcafe/orders/de110001";
  const created = await send("PUT", url, input);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const ticket = created.body.data.tickets[0];
  const second = await send("PUT", "/qcafe/orders/de110002", {
    ...input,
    requestId: randomUUID(),
    seats: [3]
  });
  assert.equal(second.status, 200);
  const later = second.body.data.tickets[0];
  const confirm = (
    token: string,
    action: "ready" | "delivered",
    waiterUuid: string | null = null,
    auth?: string
  ) => send("POST", "/qcafe/kitchen/confirm", { token, action, waiterUuid }, auth);
  assert.equal((await confirm(later.number, "ready")).status, 409);
  assert.equal((await confirm(ticket.number, "ready", null, "read-only")).status, 403);
  assert.equal((await confirm(ticket.number, "ready", null, "tenant-b")).status, 404);
  assert.equal((await confirm(ticket.number, "delivered", waiter.body.data.uuid)).status, 409);
  const billInput = {
    ...input,
    requestId: randomUUID(),
    revision: created.body.data.revision,
    action: "bill"
  };
  assert.equal((await send("PUT", url, billInput)).status, 409);
  assert.equal((await confirm(ticket.number, "ready")).status, 200);
  assert.equal((await confirm(ticket.number, "delivered")).status, 400);
  assert.equal((await confirm(ticket.number, "delivered", waiter.body.data.uuid)).status, 200);
  assert.equal((await confirm(ticket.number, "delivered", waiter.body.data.uuid)).status, 200);
  const queue = (await send("GET", "/qcafe/kitchen")).body.data;
  assert.equal(queue.find((row: { uuid: string }) => row.uuid === ticket.uuid).status, "delivered");
  assert.equal((await send("PUT", url, billInput)).status, 200);
  const floorBills = (await send("GET", "/qcafe/orders/floor-bills")).body.data;
  assert.equal(
    floorBills.find((row: { uuid: string }) => row.uuid === "de110001").name,
    "Kitchen delivery"
  );
  assert.deepEqual(
    (await send("GET", "/qcafe/orders/floor-bills", undefined, "tenant-b")).body.data,
    []
  );
  assert.equal((await send("GET", "/qcafe/orders/floor-bills", undefined, "denied")).status, 403);
  assert.equal((await confirm(later.number, "ready")).status, 200);
  assert.equal((await confirm(later.number, "delivered", waiter.body.data.uuid)).status, 200);
}
