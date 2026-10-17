import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { registerCrmContactRoutes } from "./contact.routes.js";

test("CRM contacts forwards reads through Core with the caller identity", async () => {
  const app = Fastify();
  let coreSearch = "";
  let coreAuthorization = "";
  let coreSessionSlot = "";
  let coreCookie = "";
  let coreHost = "";
  let coreOrigin = "";
  let authorized = false;
  app.get("/core/master/contacts", async (request) => {
    coreSearch = String((request.query as { search?: string }).search ?? "");
    coreAuthorization = request.headers.authorization ?? "";
    coreSessionSlot = String(request.headers["x-codexsun-session-slot"] ?? "");
    coreCookie = String(request.headers.cookie ?? "");
    coreHost = String(request.headers.host ?? "");
    coreOrigin = String(request.headers.origin ?? "");
    return { success: true, data: [{ id: 17, name: "Acme" }] };
  });
  registerCrmContactRoutes(app, async () => {
    authorized = true;
  });

  const response = await app.inject({
    method: "GET",
    url: "/crm/contacts?search=Acme",
    headers: {
      authorization: "Bearer test-session",
      cookie: "codexsun_session_slot=encrypted-session",
      host: "127.0.0.1:7010",
      origin: "http://127.0.0.1:7020",
      "x-codexsun-session-slot": "0123456789abcdef0123456789abcdef",
      "x-tenant-db": "tenant_test"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().data, [{ id: 17, name: "Acme" }]);
  assert.equal(coreSearch, "Acme");
  assert.equal(coreAuthorization, "Bearer test-session");
  assert.equal(coreSessionSlot, "0123456789abcdef0123456789abcdef");
  assert.equal(coreCookie, "codexsun_session_slot=encrypted-session");
  assert.equal(coreHost, "127.0.0.1:7010");
  assert.equal(coreOrigin, "http://127.0.0.1:7020");
  assert.equal(authorized, true);
  await app.close();
});

test("CRM contacts forwards create payloads to Core", async () => {
  const app = Fastify();
  let corePayload: unknown;
  app.post("/core/master/contacts", async (request) => {
    corePayload = request.body;
    return { success: true, data: { id: 18, name: "New customer" } };
  });
  registerCrmContactRoutes(app, async () => undefined);
  const payload = {
    name: "New customer",
    typeId: 1,
    phones: [{ phone: "9876543210", phoneType: "Mobile", isPrimary: true }]
  };

  const response = await app.inject({ method: "POST", url: "/crm/contacts", payload });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(corePayload, payload);
  assert.deepEqual(response.json().data, { id: 18, name: "New customer" });
  await app.close();
});

test("CRM contact lookups use the frontend lookup contract keys", async () => {
  const app = Fastify();
  const paths = [
    "/core/common/contacts/contact-types",
    "/core/common/contacts/contact-groups",
    "/core/common/contacts/address-types",
    "/core/common/contacts/bank-names",
    "/core/common/location/countries",
    "/core/common/location/states",
    "/core/common/location/districts",
    "/core/common/location/cities",
    "/core/common/location/pincodes"
  ];
  for (const path of paths) {
    app.get(path, async () => ({ success: true, data: [{ id: 1, name: path }] }));
  }
  registerCrmContactRoutes(app, async () => undefined);

  const response = await app.inject({ method: "GET", url: "/crm/contacts/lookups" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.json().data), [
    "contactTypes",
    "contactGroups",
    "addressTypes",
    "bankNames",
    "countries",
    "states",
    "districts",
    "cities",
    "pincodes"
  ]);
  assert.deepEqual(response.json().data.contactTypes, [{ id: 1, name: paths[0] }]);
  await app.close();
});

test("CRM contact lookup creation keeps its kebab-case endpoint", async () => {
  const app = Fastify();
  let created: unknown;
  app.post("/core/common/contacts/contact-types", async (request) => {
    created = request.body;
    return { success: true, data: { id: 2, name: "Supplier" } };
  });
  registerCrmContactRoutes(app, async () => undefined);

  const response = await app.inject({
    method: "POST",
    url: "/crm/contacts/lookups/contact-types",
    payload: { name: "Supplier" }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(created, { name: "Supplier" });
  assert.deepEqual(response.json().data, { id: 2, name: "Supplier" });
  await app.close();
});

test("CRM contacts preserves expired-session errors from Core", async () => {
  const app = Fastify();
  app.setErrorHandler((error, _request, reply) => {
    const apiError = error as Error & { code: string; statusCode: number };
    return reply.code(apiError.statusCode).send({
      success: false,
      error: { code: apiError.code, message: apiError.message }
    });
  });
  app.get("/core/master/contacts", async (_request, reply) =>
    reply.code(401).send({
      success: false,
      error: { code: "AUTH_SESSION_EXPIRED", message: "Session expired. Please sign in again." }
    })
  );
  registerCrmContactRoutes(app, async () => undefined);

  const response = await app.inject({ method: "GET", url: "/crm/contacts" });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json().error.code, "AUTH_SESSION_EXPIRED");
  assert.equal(response.json().error.message, "Session expired. Please sign in again.");
  await app.close();
});
