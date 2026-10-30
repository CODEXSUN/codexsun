import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
type Send = (
  method: "GET" | "POST" | "PUT",
  url: string,
  payload?: unknown,
  token?: string
) => Promise<{ status: number; body: ReturnType<typeof JSON.parse> }>;
export async function verifySettingsAndDemo(send: Send) {
  const initial = (await send("GET", "/qcafe/settings")).body.data;
  assert.equal(initial.revision, 0);
  assert.equal(initial.gstRate, 0);
  const input = {
    ...initial,
    restaurantName: "Test South Indian Restaurant",
    gstRate: 5,
    receiptWidth: "58mm",
    gstin: "TEST-GST",
    receiptFooter: "Sample receipt footer"
  };
  assert.equal((await send("PUT", "/qcafe/settings", input, "read-only")).status, 403);
  assert.equal((await send("PUT", "/qcafe/settings", { ...input, currency: "USD" })).status, 400);
  const saved = await send("PUT", "/qcafe/settings", input);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  let prefs = saved.body.data;
  assert.equal((await send("PUT", "/qcafe/settings", input)).status, 409);
  assert.deepEqual(
    (await send("GET", "/qcafe/settings", undefined, "tenant-b")).body.data,
    initial
  );
  const item = await send("POST", "/qcafe/menu", {
    code: "RECEIPT-TEST",
    name: "Receipt test",
    category: "Tests",
    price: 10000,
    status: "active"
  });
  assert.equal(item.status, 200);
  const billInput = {
    requestId: randomUUID(),
    lines: [{ menuUuid: item.body.data.uuid, quantity: 1 }]
  };
  const bill = await send("POST", "/qcafe/pos", billInput);
  assert.equal(bill.status, 200, JSON.stringify(bill.body));
  assert.equal(bill.body.data.total, 10000);
  assert.equal(bill.body.data.receiptContext.taxAmount, 476);
  assert.equal(bill.body.data.receiptContext.netAmount, 9524);
  assert.equal(bill.body.data.receiptContext.restaurantName, input.restaurantName);
  prefs = (
    await send("PUT", "/qcafe/settings", { ...prefs, restaurantName: "Changed name", gstRate: 18 })
  ).body.data;
  assert.deepEqual((await send("POST", "/qcafe/pos", billInput)).body.data, bill.body.data);
  assert.equal(
    (await send("GET", `/qcafe/pos/${bill.body.data.uuid}`)).body.data.receiptContext.gstRate,
    5
  );
  const order = await send("PUT", `/qcafe/orders/${randomBytes(4).toString("hex")}`, {
    requestId: randomUUID(),
    revision: 0,
    action: "bill",
    name: "Receipt snapshot order",
    mode: "TAKE AWAY",
    tableUuid: null,
    seats: [],
    lines: billInput.lines
  });
  assert.equal(order.status, 200, JSON.stringify(order.body));
  const orderBill = await send("GET", `/qcafe/pos/${order.body.data.billUuid}`);
  assert.equal(orderBill.body.data.receiptContext.gstRate, 18);
  assert.equal(orderBill.body.data.total, 10000);
  const pack = await send("GET", "/qcafe/menu/demo");
  assert.equal(pack.status, 200);
  assert.equal(pack.body.data.items.length, 18);
  assert.equal(pack.body.data.categories.length, 5);
  assert.equal(
    (await send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" }, "read-only")).status,
    403
  );
  assert.equal((await send("POST", "/qcafe/menu/demo", { version: "unknown" })).status, 400);
  const imported = await send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" });
  assert.equal(imported.status, 200, JSON.stringify(imported.body));
  assert.equal(imported.body.data.added, 18);
  const records = (await send("GET", "/qcafe/menu")).body.data;
  const idli = records.find((item: { code: string }) => item.code === "DEMO-IDLI");
  assert.match(idli.imageUrl, /^\/api\/app\/qcafe\/menu\/images\/[a-f0-9]{32}\.webp$/u);
  const { uuid, ...edited } = idli;
  assert.equal(
    (await send("PUT", `/qcafe/menu/${uuid}`, { ...edited, price: 9900, name: "My edited idli" }))
      .status,
    200
  );
  const repeat = await send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" });
  assert.equal(repeat.body.data.added, 0);
  assert.equal(repeat.body.data.skipped, 18);
  assert.equal(
    (await send("GET", "/qcafe/menu")).body.data.find(
      (item: { uuid: string }) => item.uuid === uuid
    ).price,
    9900
  );
  assert.equal((await send("GET", "/qcafe/menu", undefined, "tenant-b")).body.data.length, 0);
  const race = await Promise.all([
    send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" }, "tenant-b"),
    send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" }, "tenant-b")
  ]);
  assert.deepEqual(
    race.map((item) => item.status),
    [200, 200]
  );
  assert.equal(
    race.reduce((n, item) => n + item.body.data.added, 0),
    18
  );
  const other = (await send("GET", "/qcafe/menu", undefined, "tenant-b")).body.data.find(
    (item: { code: string }) => item.code === "DEMO-IDLI"
  );
  assert.notEqual(other.imageUrl, idli.imageUrl);
  prefs = (await send("PUT", "/qcafe/settings", { ...prefs, imageWriteProtection: true })).body
    .data;
  assert.equal(
    (await send("POST", "/qcafe/menu/demo", { version: "south-indian-v1" })).status,
    403
  );
  assert.equal((await send("POST", "/qcafe/menu/images", { contentBase64: "AAAA" })).status, 403);
  assert.equal((await send("PUT", `/qcafe/menu/${uuid}`, { ...edited, imageUrl: "" })).status, 403);
  assert.equal((await send("GET", "/qcafe/settings")).body.data.revision, prefs.revision);
  return { idliImage: idli.imageUrl, otherImage: other.imageUrl };
}
