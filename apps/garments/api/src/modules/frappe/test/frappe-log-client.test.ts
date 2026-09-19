import assert from "node:assert/strict";
import test from "node:test";
import { FrappeLogClient, FrappeLogConfigurationError, FrappeLogRequestError } from "../frappe-log-client.js";

test("requests the apparel log feed with server-side Frappe credentials", async () => {
  let request: Request | undefined;
  const client = new FrappeLogClient(
    { GARMENTS_FRAPPE_TOKEN: "key:secret", GARMENTS_FRAPPE_URL: "https://logicx.tmnext.in" },
    async (input, init) => {
      request = new Request(input, init);
      return Response.json({ data: [{ creation: "2026-09-18 12:00:00", name: "LOG-0001", request_content: "ok" }] });
    },
  );

  const result = await client.listApparelLogs();

  assert.equal(request?.url, "https://logicx.tmnext.in/api/v2/method/frappe.client.get_list");
  assert.equal(request?.headers.get("authorization"), "token key:secret");
  assert.deepEqual(JSON.parse(await request!.text()), {
    doctype: "API One Log",
    fields: ["name", "creation", "request_content"],
    filters: [["api_path", "=", "apparel-log"]],
    limit: 1000,
    order_by: "creation desc",
  });
  assert.equal(result.logs[0]?.name, "LOG-0001");
});

test("reports failed Frappe responses without exposing the response body", async () => {
  const client = new FrappeLogClient(
    { GARMENTS_FRAPPE_TOKEN: "key:secret", GARMENTS_FRAPPE_URL: "https://logicx.tmnext.in" },
    async () => new Response("Unauthorized", { status: 401 }),
  );

  await assert.rejects(client.listApparelLogs(), (error: unknown) => error instanceof FrappeLogRequestError && error.statusCode === 401);
});

test("requires a configured Frappe token before making a request", async () => {
  const client = new FrappeLogClient({ GARMENTS_FRAPPE_URL: "https://logicx.tmnext.in" });

  await assert.rejects(client.listApparelLogs(), (error: unknown) => error instanceof FrappeLogConfigurationError);
});
