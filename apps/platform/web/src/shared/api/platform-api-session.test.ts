import assert from "node:assert/strict";
import test from "node:test";

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

test("SA and tenant tabs keep independent session selectors through login and logout", async () => {
  const saStorage = storage();
  const tenantStorage = storage();
  const requests: Array<{ path: string; slot: string | null }> = [];
  Object.assign(globalThis, {
    localStorage: storage(),
    sessionStorage: saStorage,
    window: {
      __CODEXSUN_RUNTIME_CONFIG__: { VITE_PLATFORM_API_URL: "/api/app" },
      location: { href: "http://app.codexsun.test/sa/login" }
    }
  });
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    const slot = new Headers(init?.headers).get("x-codexsun-session-slot");
    requests.push({ path, slot });
    const response = path.endsWith("/auth/login")
      ? {
          authenticated: true,
          email: slot ? "tenant@example.test" : "sa@example.test",
          sessionSlot:
            requests.filter((request) => request.path.endsWith("/auth/login")).length === 1
              ? "a".repeat(32)
              : "b".repeat(32),
          tenantDbName: "tenant_db",
          tenantId: "tenant-id",
          userType: "tenant"
        }
      : { loggedOut: true };
    return Response.json({ data: response, success: true });
  };

  const { login, logout } = await import("./platform-api");
  const { getSessionSlot } = await import("../auth/tab-session");
  assert.equal(
    (await login({ desk: "sa", email: "sa@example.test", password: "secret" })).success,
    true
  );
  assert.equal(getSessionSlot(), "a".repeat(32));

  Object.assign(globalThis, { sessionStorage: tenantStorage });
  assert.equal(
    (await login({ desk: "tenant", email: "tenant@example.test", password: "secret" })).success,
    true
  );
  assert.equal(getSessionSlot(), "b".repeat(32));
  assert.equal(saStorage.getItem("codexsun.auth.slot"), "a".repeat(32));

  await logout("tenant");
  assert.equal(requests.at(-1)?.slot, "b".repeat(32));
  assert.equal(getSessionSlot(), null);
  Object.assign(globalThis, { sessionStorage: saStorage });
  assert.equal(getSessionSlot(), "a".repeat(32));
});

test("reads have a deadline without automatically cancelling writes", async () => {
  Object.assign(globalThis, {
    sessionStorage: storage(),
    window: { __CODEXSUN_RUNTIME_CONFIG__: { VITE_PLATFORM_API_URL: "/api/app" } }
  });
  const signals: Array<AbortSignal | null | undefined> = [];
  globalThis.fetch = async (_input, init) => {
    signals.push(init?.signal);
    return Response.json({ success: true, data: { authenticated: false } });
  };
  const { apiGet, apiPost } = await import("./platform-api");
  await apiGet("/deadline-test");
  assert.ok(signals[0] instanceof AbortSignal);
  await apiPost("/write-test", {});
  assert.equal(
    signals[1],
    undefined,
    "writes must not acquire an ambiguous automatic deadline or retry"
  );
});
