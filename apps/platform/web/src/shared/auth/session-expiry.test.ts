import assert from "node:assert/strict";
import test from "node:test";
import {
  hasSessionExpiredReason,
  hasSessionRefreshedReason,
  installSessionExpiryInterceptor,
  isExpiredSessionResponse,
  protectedDeskFromPathname,
  sessionExpiredLoginPath
} from "./session-expiry";

test("maps protected routes to their owning login desk", () => {
  assert.equal(protectedDeskFromPathname("/app/billing"), "tenant");
  assert.equal(protectedDeskFromPathname("/sa/tenants"), "sa");
  assert.equal(protectedDeskFromPathname("/admin"), "admin");
});

test("does not treat login and public pages as protected routes", () => {
  assert.equal(protectedDeskFromPathname("/login"), null);
  assert.equal(protectedDeskFromPathname("/sa/login"), null);
  assert.equal(protectedDeskFromPathname("/admin/login"), null);
  assert.equal(protectedDeskFromPathname("/features"), null);
});

test("builds desk-aware login routes with a durable expiry reason", () => {
  assert.equal(sessionExpiredLoginPath("tenant"), "/login?reason=session-expired");
  assert.equal(sessionExpiredLoginPath("sa"), "/sa/login?reason=session-expired");
  assert.equal(sessionExpiredLoginPath("admin"), "/admin/login?reason=session-expired");
  assert.equal(hasSessionExpiredReason("?reason=session-expired"), true);
  assert.equal(hasSessionExpiredReason("?reason=invalid-credentials"), false);
  assert.equal(hasSessionRefreshedReason("?reason=session-refreshed"), true);
  assert.equal(hasSessionRefreshedReason("?reason=session-expired"), false);
});

test("only an explicit expired-session 401 clears session state and opens login", async () => {
  let cleared = 0;
  let replacedWith = "";
  let slot = "a".repeat(32);
  let responseStatus = 401;
  let changeSession = false;
  const requestHeaders: Headers[] = [];
  const fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestHeaders.push(new Headers(init?.headers));
    if (changeSession) slot = "b".repeat(32);
    return Response.json(
      { error: { code: "AUTH_SESSION_EXPIRED", message: "Session expired." }, success: false },
      { status: responseStatus }
    );
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fetch,
      location: {
        href: "http://app.codexsun.test/app/billing/sales",
        pathname: "/app/billing/sales",
        replace: (path: string) => {
          replacedWith = path;
        }
      },
      __CODEXSUN_RUNTIME_CONFIG__: { VITE_PLATFORM_API_URL: "/api/app" }
    }
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => slot }
  });

  installSessionExpiryInterceptor(() => {
    cleared += 1;
  });
  await window.fetch("/api/billing/sales");
  await window.fetch("https://external.example.test/data");
  assert.equal(cleared, 0);
  assert.equal(replacedWith, "");
  responseStatus = 503;
  await window.fetch("/api/app/auth/session");
  assert.equal(cleared, 0, "an API outage must preserve the browser session");
  responseStatus = 401;
  changeSession = true;
  await window.fetch("/api/app/auth/session");
  assert.equal(cleared, 0, "an old response must not clear a newer session");
  changeSession = false;
  await window.fetch("/api/app/billing/sales");

  assert.equal(cleared, 1);
  assert.equal(replacedWith, "/login?reason=session-expired");
  assert.equal(requestHeaders[0]?.get("x-codexsun-session-slot"), null);
  assert.equal(requestHeaders[1]?.get("x-codexsun-session-slot"), null);
  assert.equal(requestHeaders[2]?.get("x-codexsun-session-slot"), "a".repeat(32));
  assert.equal(requestHeaders[4]?.get("x-codexsun-session-slot"), "b".repeat(32));
});

test("a domain lookup 401 is not misclassified as an expired browser session", async () => {
  const response = Response.json(
    { error: { code: "UNAUTHORIZED", message: "Platform authentication is required." } },
    { status: 401 }
  );

  assert.equal(await isExpiredSessionResponse(response), false);
  assert.equal(await response.json().then((body) => body.error.code), "UNAUTHORIZED");
});
