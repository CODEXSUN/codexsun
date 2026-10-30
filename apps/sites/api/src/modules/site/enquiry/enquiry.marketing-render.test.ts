import assert from "node:assert/strict";
import { test } from "node:test";
import { marketingCaptureResponse } from "./enquiry.marketing-render.js";

const origin = "https://site.example";
const destination =
  "https://app.codexsun.com/api/platform/public/marketing/captures?token=" + "a".repeat(48);
test("Sites renders a Marketing definition safely without exposing its server binding", async () => {
  const send: typeof fetch = async () =>
    Response.json({
      success: true,
      data: {
        title: "A <script>alert(1)</script>",
        consentNotice: 'Respond to my "enquiry".',
        noticeVersion: "v1",
        expiresAt: new Date(Date.now() + 60000).toISOString()
      }
    });
  const result = await marketingCaptureResponse(
    new Request(origin + "/marketing/capture"),
    destination,
    origin,
    send
  );
  const html = await result.text();
  assert.equal(result.status, 200);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes(destination));
  assert.ok(html.includes('src="/content/v1/marketing-capture.js"'));
  assert.equal(result.headers.get("Cache-Control"), "no-store");
});
test("Sites rejects origin and forged scope before forwarding, and returns only a validated receipt", async () => {
  let calls = 0;
  const send: typeof fetch = async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("origin"), origin);
    return Response.json({
      success: true,
      data: { reference: "aabbccdd", received: true, privateField: "must not return" }
    });
  };
  const body = {
    sourceKey: "stable-key-00001",
    name: "Prospect",
    email: "prospect@example.test",
    phone: "",
    message: "Please respond.",
    privacyConsent: true,
    website: ""
  };
  const request = (payload: unknown, from = origin) =>
    new Request(origin + "/content/v1/marketing-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: from },
      body: JSON.stringify(payload)
    });
  assert.equal(
    (await marketingCaptureResponse(request(body, "https://other.test"), destination, origin, send))
      .status,
    403
  );
  assert.equal(
    (
      await marketingCaptureResponse(
        request({ ...body, tenantId: "aabbccdd" }),
        destination,
        origin,
        send
      )
    ).status,
    400
  );
  assert.equal(calls, 0);
  const result = await marketingCaptureResponse(request(body), destination, origin, send);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    success: true,
    data: { reference: "aabbccdd", received: true }
  });
  assert.equal(calls, 1);
  await assert.rejects(
    marketingCaptureResponse(request(body), "https://attacker.example/capture", origin, send)
  );
});
