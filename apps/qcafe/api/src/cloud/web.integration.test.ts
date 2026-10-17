import { verifyKitchenDelivery } from "./kitchen.integration.js";
import { verifySettingsAndDemo } from "./settings-demo.integration.js";
import { verifySpecialPricing } from "./special.integration.js";
import { verifyBookings } from "./booking.integration.js";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import Fastify from "fastify";
import { createConnection } from "mysql2/promise";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect, sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { mkdir, mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { migrateQCafeWeb, registerQCafeWeb } from "./index.js";
import type { QCafeDatabase } from "./runtime.js";

test("MariaDB POS isolates tenants, persists bills, and deduplicates settlement retries", async () => {
  const env = parseEnv(readFileSync(new URL("../../../../../.env", import.meta.url), "utf8"));
  for (const key of ["DB_HOST", "DB_USER", "DB_PASSWORD"])
    assert.ok(env[key], `${key} is required for the integration test.`);
  assert.equal(env.CODEXSUN_DB_FRESH_ON_START, "0");
  const config = {
    host: env.DB_HOST!,
    port: Number(env.DB_PORT),
    user: env.DB_USER!,
    password: env.DB_PASSWORD!,
    timezone: "Z"
  };
  const admin = await createConnection(config);
  const names = [0, 1].map((i) => `codexsun_dev_qcafe_test_${randomBytes(5).toString("hex")}_${i}`);
  const databases: Kysely<QCafeDatabase>[] = [];
  const temporaryRoot = fileURLToPath(new URL("../../../../../dist/.tmp/", import.meta.url));
  await mkdir(temporaryRoot, { recursive: true });
  const imagesRoot = await mkdtemp(join(temporaryRoot, "codexsun-qcafe-images-"));
  const app = Fastify();
  app.setErrorHandler((error, _request, reply) => {
    const status = error instanceof AppError ? error.statusCode : 500;
    reply
      .code(status)
      .send({ message: error instanceof Error ? error.message : "Unexpected failure" });
  });
  try {
    for (const name of names) {
      assert.match(name, /^codexsun_dev_qcafe_test_[a-f0-9]{10}_[01]$/u);
      await admin.query(`CREATE DATABASE \`${name}\``);
      const database = new Kysely<QCafeDatabase>({
        dialect: new MysqlDialect({ pool: createPool({ ...config, database: name }) })
      });
      databases.push(database);
      await migrateQCafeWeb(database);
      await migrateQCafeWeb(database);
    }
    registerQCafeWeb(app, {
      printKitchenToken: async () => "test-spooler",
      masterImageDirectory: (tenantId) => join(imagesRoot, tenantId, "apps", "qcafe", "master"),
      async resolveContext(request) {
        const token = request.headers.authorization;
        if (
          !token ||
          !["Bearer tenant-a", "Bearer tenant-b", "Bearer denied", "Bearer read-only"].includes(
            token
          )
        )
          throw AppError.unauthorized();
        const index = token === "Bearer tenant-b" ? 1 : 0;
        return {
          database: databases[index]!,
          tenantId: names[index]!,
          actorEmail: "test@codexsun.local",
          async authorize(permission) {
            if (
              token === "Bearer denied" ||
              (token === "Bearer read-only" && !permission.endsWith(".view"))
            )
              throw AppError.forbidden();
          }
        };
      }
    });
    const send = async (
      method: "GET" | "POST" | "PUT",
      url: string,
      payload?: unknown,
      token = "tenant-a"
    ) => {
      const result = await app.inject({
        method,
        url,
        headers: { authorization: `Bearer ${token}`, "x-tenant-id": "forged-other-tenant" },
        ...(payload ? { payload } : {})
      });
      return { status: result.statusCode, body: result.json() };
    };
    assert.equal((await app.inject({ method: "GET", url: "/qcafe/menu" })).statusCode, 401);
    assert.equal((await send("GET", "/qcafe/menu", undefined, "denied")).status, 403);
    const photoBytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#b65021" }
    })
      .png()
      .toBuffer();
    const upload = await send("POST", "/qcafe/menu/images", {
      contentBase64: photoBytes.toString("base64")
    });
    assert.equal(upload.status, 200, JSON.stringify(upload.body));
    const imageUrl = upload.body.data.imageUrl as string;
    const photoRoute = imageUrl.replace("/api/app", "");
    const stored = await readFile(
      join(imagesRoot, names[0]!, "apps/qcafe/master", imageUrl.split("/").pop()!)
    );
    assert.equal((await sharp(stored).metadata()).format, "webp");
    const photo = await app.inject({
      method: "GET",
      url: photoRoute,
      headers: { authorization: "Bearer tenant-a" }
    });
    assert.equal(photo.statusCode, 200);
    assert.deepEqual(photo.rawPayload, stored);
    assert.equal((await app.inject({ method: "GET", url: photoRoute })).statusCode, 401);
    assert.equal(
      (
        await app.inject({
          method: "GET",
          url: photoRoute,
          headers: { authorization: "Bearer tenant-b" }
        })
      ).statusCode,
      404
    );
    assert.equal(
      (
        await send(
          "POST",
          "/qcafe/menu/images",
          { contentBase64: photoBytes.toString("base64") },
          "read-only"
        )
      ).status,
      403
    );
    assert.equal(
      (
        await send("POST", "/qcafe/menu/images", {
          contentBase64: Buffer.from("<svg></svg>").toString("base64")
        })
      ).status,
      400
    );
    assert.equal(
      (
        await send("POST", "/qcafe/menu/images", {
          contentBase64: Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64")
        })
      ).status,
      400
    );
    assert.equal(
      (
        await send(
          "POST",
          "/qcafe/menu",
          {
            code: "FOREIGN",
            name: "Foreign photo",
            category: "Test",
            price: 100,
            status: "active",
            imageUrl
          },
          "tenant-b"
        )
      ).status,
      400
    );
    const item = await send("POST", "/qcafe/menu", {
      code: "TEA",
      name: "Tea",
      imageUrl,
      category: "Drinks",
      price: 2500,
      status: "active"
    });
    assert.equal(item.status, 200, JSON.stringify(item.body));
    assert.equal(item.body.data.imageUrl, imageUrl);
    assert.equal((await send("GET", "/qcafe/menu")).body.data[0].imageUrl, imageUrl);
    assert.deepEqual((await send("GET", "/qcafe/menu", undefined, "tenant-b")).body.data, []);
    const input = {
      requestId: randomUUID(),
      lines: [{ menuUuid: item.body.data.uuid, quantity: 2 }]
    };
    assert.equal((await send("POST", "/qcafe/pos", input, "read-only")).status, 403);
    assert.equal(
      (await send("POST", "/qcafe/pos", { ...input, lines: [{ ...input.lines[0], rate: 1 }] }))
        .status,
      400
    );
    const bill = await send("POST", "/qcafe/pos", input);
    assert.equal(bill.status, 200, JSON.stringify(bill.body));
    assert.equal(bill.body.data.total, 5000);
    const storedClock = await sql<{
      epoch: number;
    }>`SELECT UNIX_TIMESTAMP(created_at) AS epoch FROM qcafe_pos WHERE uuid=${bill.body.data.uuid}`.execute(
      databases[0]!
    );
    assert.equal(Date.parse(bill.body.data.createdAt), Number(storedClock.rows[0]?.epoch) * 1000);
    assert.equal((await send("POST", "/qcafe/pos", input)).body.data.uuid, bill.body.data.uuid);
    assert.equal(
      (await send("POST", "/qcafe/pos", { ...input, lines: [{ ...input.lines[0], quantity: 3 }] }))
        .status,
      409
    );
    const payment = { requestId: randomUUID(), amount: 2000, mode: "cash", reference: "" };
    const url = `/qcafe/pos/${bill.body.data.uuid}/payments`;
    assert.equal((await send("POST", url, payment, "tenant-b")).status, 404);
    assert.equal((await send("POST", url, payment)).body.data.status, "part-paid");
    assert.equal((await send("POST", url, payment)).body.data.paid, 2000);
    const concurrent = await Promise.all(
      [0, 1].map(() => send("POST", url, { ...payment, requestId: randomUUID(), amount: 3000 }))
    );
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 409]);
    const saved = (await send("GET", "/qcafe/pos")).body.data[0];
    assert.equal(saved.status, "paid");
    assert.equal(saved.payments.length, 2);
    const paymentClock = await sql<{
      epoch: number;
    }>`SELECT UNIX_TIMESTAMP(created_at) AS epoch FROM qcafe_pos_payments WHERE uuid=${saved.payments[0].uuid}`.execute(
      databases[0]!
    );
    assert.equal(
      Date.parse(saved.payments[0].createdAt),
      Number(paymentClock.rows[0]?.epoch) * 1000
    );
    assert.deepEqual((await send("GET", "/qcafe/pos", undefined, "tenant-b")).body.data, []);
    // Dine-in drafts, seat races, incremental KOTs, and atomic billing.
    const table = await send("POST", "/qcafe/tables", { name: "T07", seats: 4, status: "active" });
    assert.equal(table.status, 200, JSON.stringify(table.body));
    assert.equal(
      (
        await send(
          "POST",
          "/qcafe/tables",
          { name: "denied", seats: 4, status: "active" },
          "read-only"
        )
      ).status,
      403
    );
    const draft = {
      requestId: randomUUID(),
      revision: 0,
      action: "save",
      name: "Order 1",
      mode: "POS",
      tableUuid: table.body.data.uuid,
      seats: [1],
      lines: [{ menuUuid: item.body.data.uuid, quantity: 1 }]
    };
    const orderKey = "1111aaaa";
    const orderUrl = `/qcafe/orders/${orderKey}`;
    assert.equal((await send("PUT", orderUrl, draft, "read-only")).status, 403);
    let result = await send("PUT", orderUrl, draft);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    let order = result.body.data;
    assert.equal(order.revision, 1);
    assert.equal((await send("PUT", orderUrl, draft)).body.data.revision, 1);
    assert.equal((await send("GET", orderUrl, undefined, "tenant-b")).status, 404);
    assert.equal((await send("GET", "/qcafe/orders")).body.data.length, 1);
    assert.equal(
      (await send("PUT", "/qcafe/orders/2222bbbb", { ...draft, requestId: randomUUID() })).status,
      409
    );
    assert.equal(
      (
        await send("PUT", "/qcafe/orders/2222bbbb", {
          ...draft,
          requestId: randomUUID(),
          seats: [5]
        })
      ).status,
      400
    );
    assert.equal(
      (await send("PUT", orderUrl, { ...draft, requestId: randomUUID(), revision: 0 })).status,
      409
    );
    const race = await Promise.all(
      ["3333cccc", "4444dddd"].map((uuid) =>
        send("PUT", `/qcafe/orders/${uuid}`, { ...draft, requestId: randomUUID(), seats: [2] })
      )
    );
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409], JSON.stringify(race));
    const other = race.find((r) => r.status === 200)!.body.data;
    const kitchen = {
      ...draft,
      requestId: randomUUID(),
      revision: order.revision,
      action: "kitchen"
    };
    result = await send("PUT", orderUrl, kitchen);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    order = result.body.data;
    assert.equal(order.tickets.length, 1);
    assert.equal(order.tickets[0].lines[0].quantity, 1);
    assert.equal((await send("PUT", orderUrl, kitchen)).body.data.tickets.length, 1);
    assert.equal(
      (
        await send("PUT", orderUrl, {
          ...draft,
          requestId: randomUUID(),
          revision: order.revision,
          lines: []
        })
      ).status,
      409
    );
    assert.equal(
      (
        await send("PUT", orderUrl, {
          ...draft,
          requestId: randomUUID(),
          revision: order.revision,
          seats: [3]
        })
      ).status,
      409
    );
    result = await send("PUT", orderUrl, {
      ...draft,
      requestId: randomUUID(),
      revision: order.revision,
      lines: [{ menuUuid: item.body.data.uuid, quantity: 3 }]
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    order = result.body.data;
    result = await send("PUT", orderUrl, {
      ...draft,
      requestId: randomUUID(),
      revision: order.revision,
      action: "kitchen",
      lines: [{ menuUuid: item.body.data.uuid, quantity: 3 }]
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    order = result.body.data;
    assert.equal(order.tickets.length, 2);
    assert.equal(order.tickets[1].lines[0].quantity, 2);
    const finalize = {
      ...draft,
      requestId: randomUUID(),
      revision: order.revision,
      action: "bill",
      lines: [{ menuUuid: item.body.data.uuid, quantity: 3 }]
    };
    result = await send("PUT", orderUrl, finalize);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    order = result.body.data;
    assert.equal(order.status, "billed");
    assert.ok(order.billUuid);
    assert.equal((await send("PUT", orderUrl, finalize)).body.data.billUuid, order.billUuid);
    const orderBill = (await send("GET", `/qcafe/pos/${order.billUuid}`)).body.data;
    assert.equal(orderBill.total, 7500);
    assert.equal(orderBill.serviceContext.tableName, "T07");
    assert.deepEqual(orderBill.serviceContext.seats, [1]);
    assert.equal((await send("GET", "/qcafe/orders/occupied-seats")).body.data.length, 2);
    result = await send("POST", `/qcafe/pos/${order.billUuid}/payments`, {
      requestId: randomUUID(),
      amount: 7500,
      mode: "cash",
      reference: "integration only"
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal((await send("GET", "/qcafe/orders/occupied-seats")).body.data.length, 1);
    const otherKitchen = await send("PUT", `/qcafe/orders/${other.uuid}`, {
      ...draft,
      requestId: randomUUID(),
      revision: other.revision,
      action: "kitchen",
      seats: [2]
    });
    assert.equal(otherKitchen.status, 200, JSON.stringify(otherKitchen.body));
    const cancelled = await send("PUT", `/qcafe/orders/${other.uuid}`, {
      ...draft,
      requestId: randomUUID(),
      revision: otherKitchen.body.data.revision,
      action: "cancel",
      seats: [2]
    });
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
    assert.equal(cancelled.body.data.tickets.at(-1).kind, "cancel");
    assert.equal((await send("GET", "/qcafe/orders/occupied-seats")).body.data.length, 0);
    await send("PUT", `/qcafe/menu/${item.body.data.uuid}`, {
      code: "TEA",
      name: "Tea",
      category: "Drinks",
      price: 9900,
      status: "inactive"
    });
    assert.equal((await send("POST", "/qcafe/pos", input)).body.data.total, 5000);
    assert.equal(
      (await send("POST", "/qcafe/pos", { ...input, requestId: randomUUID() })).status,
      400
    );
    const audit = await sql<{
      count: number;
    }>`SELECT COUNT(*) AS count FROM qcafe_pos_activity`.execute(databases[0]!);
    assert.equal(Number(audit.rows[0]?.count), 5);
    const parcelMenu = await send("POST", "/qcafe/menu", {
      code: "PARCEL-IDLI",
      name: "Parcel Idli",
      category: "Breakfast",
      price: 4000,
      status: "active"
    });
    assert.equal(parcelMenu.status, 200, JSON.stringify(parcelMenu.body));
    const parcelInput = {
      ...draft,
      requestId: randomUUID(),
      revision: 0,
      mode: "TAKE AWAY",
      tableUuid: null,
      seats: [],
      lines: [{ menuUuid: parcelMenu.body.data.uuid, quantity: 1 }]
    };
    const parcelUrl = "/qcafe/orders/aaaabbbb";
    const parcel = await send("PUT", parcelUrl, { ...parcelInput, lines: [] });
    assert.equal(parcel.status, 200, JSON.stringify(parcel.body));
    const token = parcel.body.data.parcelToken;
    assert.match(token, /^PCL-\d{6,}$/u);
    assert.equal((await send("GET", parcelUrl)).body.data.parcelToken, token);
    assert.equal((await send("GET", parcelUrl, undefined, "tenant-b")).status, 404);
    const parcelSend = { ...parcelInput, requestId: randomUUID(), revision: 1, action: "kitchen" };
    const packed = await send("PUT", parcelUrl, parcelSend);
    assert.equal(packed.status, 200, JSON.stringify(packed.body));
    assert.equal(packed.body.data.parcelToken, token);
    assert.equal((await send("PUT", parcelUrl, parcelSend)).body.data.tickets.length, 1);
    assert.deepEqual(packed.body.data.seats, []);
    assert.equal(packed.body.data.tableUuid, null);
    assert.equal((await send("GET", "/qcafe/orders/occupied-seats")).body.data.length, 0);
    const parcelBilled = await send("PUT", parcelUrl, {
      ...parcelSend,
      requestId: randomUUID(),
      revision: packed.body.data.revision,
      action: "bill"
    });
    assert.equal(parcelBilled.status, 200, JSON.stringify(parcelBilled.body));
    assert.equal(
      (await send("GET", `/qcafe/pos/${parcelBilled.body.data.billUuid}`)).body.data.serviceContext
        .parcelToken,
      token
    );
    const booking = await verifyBookings(send, parcelMenu.body.data.uuid);
    const specials = await verifySpecialPricing(send);
    const demo = await verifySettingsAndDemo(send);
    const demoPhoto = await app.inject({
      method: "GET",
      url: demo.idliImage.replace("/api/app", ""),
      headers: { authorization: "Bearer tenant-a" }
    });
    assert.equal(demoPhoto.statusCode, 200);
    assert.equal((await sharp(demoPhoto.rawPayload).metadata()).format, "webp");
    assert.equal(
      (
        await app.inject({
          method: "GET",
          url: demo.idliImage.replace("/api/app", ""),
          headers: { authorization: "Bearer tenant-b" }
        })
      ).statusCode,
      404
    );
    const reopened = new Kysely<QCafeDatabase>({
      dialect: new MysqlDialect({ pool: createPool({ ...config, database: names[0]! }) })
    });
    try {
      const persistedBooking = await sql<{
        details: string;
      }>`SELECT booking_json AS details FROM qcafe_order WHERE uuid=${booking.uuid}`.execute(
        reopened
      );
      const storedDetails = persistedBooking.rows[0]?.details;
      assert.deepEqual(
        typeof storedDetails === "string" ? JSON.parse(storedDetails) : storedDetails,
        booking.details
      );
      const persistedSpecial = await sql<{
        revision: number;
      }>`SELECT revision FROM qcafe_special_settings WHERE id=1`.execute(reopened);
      assert.equal(persistedSpecial.rows[0]?.revision, specials.revision);
      const persistedPrices = await sql<{
        prices: unknown;
      }>`SELECT special_prices AS prices FROM qcafe_menu WHERE uuid=${specials.menuUuid}`.execute(
        reopened
      );
      assert.ok(JSON.stringify(persistedPrices.rows[0]?.prices).includes("SS"));
      assert.equal(
        (await sql<{ total: number }>`SELECT total FROM qcafe_pos`.execute(reopened)).rows[0]
          ?.total,
        5000
      );
    } finally {
      await reopened.destroy();
    }
    await verifyKitchenDelivery(send, parcelMenu.body.data.uuid);
  } finally {
    await app.close();
    await Promise.all(databases.map((database) => database.destroy()));
    for (const name of names) {
      assert.match(name, /^codexsun_dev_qcafe_test_[a-f0-9]{10}_[01]$/u);
      await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    }
    await admin.end();
    assert.ok(imagesRoot.startsWith(join(temporaryRoot, "codexsun-qcafe-images-")));
    await rm(imagesRoot, { recursive: true, force: true });
  }
});
