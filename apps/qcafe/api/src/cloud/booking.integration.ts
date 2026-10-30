import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
type Send = (
  method: "GET" | "POST" | "PUT",
  url: string,
  payload?: unknown,
  token?: string
) => Promise<{ status: number; body: ReturnType<typeof JSON.parse> }>;
export async function verifyBookings(send: Send, menuUuid: string) {
  const details = {
    customerName: "Demo Pickup Customer",
    mobile: "0000000000",
    pickupAt: new Date(Date.now() + 86400000).toISOString()
  };
  const input = {
    requestId: randomUUID(),
    revision: 0,
    action: "save",
    name: "Booking test",
    mode: "TAKE AWAY",
    tableUuid: null,
    seats: [],
    lines: [],
    booking: details
  };
  const url = "/qcafe/orders/b00c1111";
  assert.equal((await send("PUT", url, input, "read-only")).status, 403);
  assert.equal(
    (await send("PUT", url, { ...input, booking: { ...details, mobile: "invalid" } })).status,
    400
  );
  assert.equal(
    (await send("PUT", url, { ...input, booking: { ...details, customerName: "" } })).status,
    400
  );
  assert.equal(
    (
      await send("PUT", url, {
        ...input,
        booking: { ...details, pickupAt: new Date(Date.now() - 60000).toISOString() }
      })
    ).status,
    400
  );
  assert.equal((await send("PUT", url, { ...input, mode: "KOT" })).status, 400);
  const created = await send("PUT", url, input);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const order = created.body.data;
  assert.match(order.bookingToken, /^BKG-\d{6,}$/u);
  assert.equal(order.parcelToken, null);
  assert.deepEqual(order.booking, details);
  assert.equal((await send("PUT", url, input)).body.data.revision, 1);
  assert.equal((await send("GET", url, undefined, "tenant-b")).status, 404);
  assert.equal((await send("GET", url)).body.data.bookingToken, order.bookingToken);
  const sentInput = {
    ...input,
    requestId: randomUUID(),
    revision: 1,
    action: "kitchen",
    lines: [{ menuUuid, quantity: 2 }]
  };
  const sent = await send("PUT", url, sentInput);
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  assert.equal((await send("PUT", url, sentInput)).body.data.tickets.length, 1);
  assert.equal(
    (
      await send("PUT", url, {
        ...sentInput,
        requestId: randomUUID(),
        revision: sent.body.data.revision,
        action: "save",
        booking: { ...details, customerName: "Changed" }
      })
    ).status,
    409
  );
  assert.equal(
    (
      await send("PUT", url, {
        ...sentInput,
        requestId: randomUUID(),
        revision: sent.body.data.revision,
        action: "save",
        booking: null
      })
    ).status,
    400
  );
  assert.deepEqual((await send("GET", "/qcafe/orders/occupied-seats")).body.data, []);
  const billed = await send("PUT", url, {
    ...sentInput,
    requestId: randomUUID(),
    revision: sent.body.data.revision,
    action: "bill"
  });
  assert.equal(billed.status, 200, JSON.stringify(billed.body));
  const receipt = (await send("GET", `/qcafe/pos/${billed.body.data.billUuid}`)).body.data;
  assert.deepEqual(receipt.serviceContext.booking, { ...details, token: order.bookingToken });
  assert.equal(receipt.serviceContext.parcelToken, null);
  assert.deepEqual(receipt.serviceContext.seats, []);
  assert.equal(
    (await send("GET", "/qcafe/orders")).body.data.some(
      (o: { uuid: string }) => o.uuid === order.uuid
    ),
    false
  );
  return { uuid: order.uuid, details, token: order.bookingToken };
}
