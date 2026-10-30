import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
type Send = (
  method: "GET" | "POST" | "PUT",
  url: string,
  payload?: unknown,
  token?: string
) => Promise<{ status: number; body: ReturnType<typeof JSON.parse> }>;
export async function verifySpecialPricing(send: Send) {
  const original = (await send("GET", "/qcafe/specials")).body.data;
  assert.deepEqual(original, { revision: 0, enabled: false, selectedPrefix: "", definitions: [] });
  const definitions = [
    { prefix: "SS", name: "Sunday Special", isEnabled: true },
    { prefix: "HS", name: "Holiday Special", isEnabled: true }
  ];
  const config = { ...original, definitions, enabled: true, selectedPrefix: "SS" };
  assert.equal((await send("PUT", "/qcafe/specials", config, "read-only")).status, 403);
  assert.equal(
    (await send("PUT", "/qcafe/specials", { ...config, selectedPrefix: "UNKNOWN" })).status,
    400
  );
  assert.equal(
    (
      await send("PUT", "/qcafe/specials", {
        ...config,
        definitions: [definitions[0], definitions[0]]
      })
    ).status,
    400
  );
  const first = await send("PUT", "/qcafe/specials", config);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  let settings = first.body.data;
  assert.equal((await send("PUT", "/qcafe/specials", config)).status, 409);
  assert.deepEqual(
    (await send("GET", "/qcafe/specials", undefined, "tenant-b")).body.data,
    original
  );
  const menuInput = {
    code: "COFFEE",
    name: "Special coffee",
    category: "Special tests",
    price: 4000,
    status: "active",
    specialPrices: [
      { prefix: "SS", price: 3000, isEnabled: true },
      { prefix: "HS", price: 3500, isEnabled: false }
    ]
  };
  assert.equal(
    (
      await send("POST", "/qcafe/menu", {
        ...menuInput,
        specialPrices: [{ prefix: "UNKNOWN", price: 1, isEnabled: true }]
      })
    ).status,
    400
  );
  assert.equal(
    (
      await send("POST", "/qcafe/menu", {
        ...menuInput,
        specialPrices: [menuInput.specialPrices[0], menuInput.specialPrices[0]]
      })
    ).status,
    400
  );
  assert.equal(
    (
      await send("POST", "/qcafe/menu", {
        ...menuInput,
        specialPrices: [{ prefix: "SS", price: 0, isEnabled: true }]
      })
    ).status,
    400
  );
  const item = await send("POST", "/qcafe/menu", menuInput);
  assert.equal(item.status, 200, JSON.stringify(item.body));
  const uuid = item.body.data.uuid;
  assert.deepEqual(item.body.data.specialPrices, menuInput.specialPrices);
  const effective = async () =>
    (await send("GET", "/qcafe/menu/pos")).body.data.find(
      (row: { uuid: string }) => row.uuid === uuid
    );
  assert.equal((await effective()).price, 3000);
  assert.equal((await effective()).normalPrice, 4000);
  assert.equal((await effective()).activeSpecial.name, "Sunday Special");
  const input = { requestId: randomUUID(), lines: [{ menuUuid: uuid, quantity: 2 }] };
  const bill = await send("POST", "/qcafe/pos", input);
  assert.equal(bill.status, 200, JSON.stringify(bill.body));
  assert.equal(bill.body.data.total, 6000);
  const orderUrl = `/qcafe/orders/${randomBytes(4).toString("hex")}`;
  const orderInput = {
    requestId: randomUUID(),
    revision: 0,
    action: "save",
    name: "Special order",
    mode: "TAKE AWAY",
    tableUuid: null,
    seats: [],
    lines: [{ menuUuid: uuid, quantity: 1 }]
  };
  const order = await send("PUT", orderUrl, orderInput);
  assert.equal(order.status, 200, JSON.stringify(order.body));
  assert.equal(order.body.data.lines[0].rate, 3000);
  const holiday = await send("PUT", "/qcafe/specials", { ...settings, selectedPrefix: "HS" });
  assert.equal(holiday.status, 200, JSON.stringify(holiday.body));
  settings = holiday.body.data;
  assert.equal((await effective()).price, 4000);
  assert.equal((await effective()).activeSpecial, null);
  assert.equal((await send("POST", "/qcafe/pos", input)).body.data.total, 6000);
  const billedOrder = await send("PUT", orderUrl, {
    ...orderInput,
    requestId: randomUUID(),
    revision: order.body.data.revision,
    action: "bill"
  });
  assert.equal(billedOrder.status, 200, JSON.stringify(billedOrder.body));
  assert.equal(billedOrder.body.data.lines[0].rate, 3000);
  assert.equal(
    (await send("GET", `/qcafe/pos/${billedOrder.body.data.billUuid}`)).body.data.total,
    3000
  );
  const disabled = await send("PUT", "/qcafe/specials", {
    ...settings,
    enabled: false,
    selectedPrefix: "SS"
  });
  assert.equal(disabled.status, 200);
  settings = disabled.body.data;
  assert.equal((await effective()).price, 4000);
  const normalBill = await send("POST", "/qcafe/pos", { ...input, requestId: randomUUID() });
  assert.equal(normalBill.body.data.total, 8000);
  const enabled = await send("PUT", "/qcafe/specials", { ...settings, enabled: true });
  assert.equal(enabled.status, 200);
  assert.equal((await effective()).price, 3000);
  assert.equal(
    (await send("GET", "/qcafe/menu")).body.data.find((row: { uuid: string }) => row.uuid === uuid)
      .price,
    4000
  );
  assert.equal((await send("GET", "/qcafe/menu/pos", undefined, "tenant-b")).body.data.length, 0);
  return { menuUuid: uuid, revision: enabled.body.data.revision };
}
