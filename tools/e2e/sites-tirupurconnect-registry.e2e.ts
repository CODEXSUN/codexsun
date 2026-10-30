import assert from "node:assert/strict";
import { env } from "../../apps/platform/api/src/env.js";
import { TconnectTestSession } from "./tconnect-test-session.js";
assert.equal(env.NODE_ENV, "development");
const session = new TconnectTestSession();
await session.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
try {
  const list = await session.request<
    Array<{ uuid: string; slug: string; themeKey: string; port: number }>
  >("GET", "/sites");
  assert.equal(list.status, 200);
  let client = list.data.find((row) => row.slug === "tirupurconnect");
  if (!client) {
    const created = await session.request<typeof client>("POST", "/sites", {
      name: "Tirupur Connect",
      slug: "tirupurconnect",
      primaryDomain: "tirupurconnect.com",
      port: 7040,
      themeKey: "portfolio-tirupurconnect",
      description:
        "Textile business network. Published records come from the dedicated TIRUPURCONNECT tenant on codexsun.com."
    });
    assert.equal(created.status, 200);
    client = created.data;
  }
  assert(client);
  assert.equal(client.themeKey, "portfolio-tirupurconnect");
  assert.equal(client.port, 7040);
  console.info(
    `PASS local Sites registry: Tirupur Connect ${client.uuid}, port ${client.port}, named client template.`
  );
  if (process.env.CODEXSUN_START_TIRUPURCONNECT === "1") {
    const started = await session.request<{ url: string }>(
      "POST",
      `/sites/${client.uuid}/start`,
      {}
    );
    assert.equal(started.status, 200);
    console.info("PASS Studio Start:", started.data.url);
  }
} finally {
  await session.request("POST", "/auth/logout", { desk: "tenant" });
}
