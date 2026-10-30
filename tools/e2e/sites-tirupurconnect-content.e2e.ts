import assert from "node:assert/strict";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "../../apps/platform/api/src/env.js";
import { TconnectTestSession } from "./tconnect-test-session.js";
import { initialSitePage } from "../../apps/sites/api/src/modules/site/page/page.defaults.js";
import type { PageState } from "../../apps/sites/api/src/modules/site/page/page.schema.js";
import type { DeliverySnapshot } from "../../apps/sites/api/src/modules/site/publication/publication.schema.js";
assert.equal(env.NODE_ENV, "development");
const session = new TconnectTestSession();
await session.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
try {
  const sites = await session.request<Array<{ uuid: string; slug: string }>>("GET", "/sites");
  const site = sites.data.find((site) => site.slug === "tirupurconnect");
  assert(site);
  const path = `/sites/${site.uuid}/page`;
  let state = (await session.request<PageState>("GET", path)).data;
  const defaults = initialSitePage({
    id: 0,
    uuid: site.uuid,
    slug: site.slug,
    name: "Tirupur Connect",
    status: "active"
  });
  let baseline = state.content.textile
    ? state.content
    : state.content.hero.title === "Welcome to"
      ? defaults
      : { ...state.content, textile: defaults.textile };
  if (baseline.hero.title === "Draft isolation verification")
    baseline = JSON.parse(
      await readFile(resolve("dist/apps/sites/publications/tirupurconnect.json"), "utf8")
    ).content;
  baseline = JSON.parse(JSON.stringify(baseline).replaceAll("\uFFFD", "\u2019"));
  async function save(content: PageState["content"]) {
    const response = await session.request<PageState>("PUT", path, {
      content,
      revision: state.revision
    });
    assert.equal(response.status, 200);
    state = response.data;
  }
  async function publish() {
    const response = await session.request<PageState>("POST", `${path}/publish`, {
      revision: state.revision
    });
    assert.equal(response.status, 200);
    state = response.data;
  }
  await save(baseline);
  await publish();
  const start = await session.request("POST", `/sites/${site.uuid}/start`, {});
  assert.equal(start.status, 200);
  const read = async () => {
    const response = await fetch(
      `http://127.0.0.1:${env.PLATFORM_API_PORT}/sites/public/tirupurconnect`
    );
    assert.equal(response.status, 200);
    return (await response.json()).data;
  };
  const before = await read();
  const probe = structuredClone(baseline);
  probe.hero.title = "Draft isolation verification";
  probe.textile!.banner.title = "Published banner verification";
  probe.profile.emails = ["cms-probe@example.invalid"];
  probe.textile!.heroImage = "/textiles/garments.jpg";
  await save(probe);
  assert.equal(
    (await read()).content.hero.title,
    before.content.hero.title,
    "Draft must remain private"
  );
  const stale = await session.request("PUT", path, {
    content: probe,
    revision: state.revision - 1
  });
  assert.equal(stale.status, 409);
  const invalid = structuredClone(probe);
  invalid.textile!.heroImage = "javascript:alert(1)";
  assert.equal(
    (await session.request("PUT", path, { content: invalid, revision: state.revision })).status,
    400
  );
  try {
    await publish();
    const publicVersion = await read();
    assert.equal(publicVersion.content.hero.title, probe.hero.title);
    assert.equal(publicVersion.content.textile.banner.title, probe.textile!.banner.title);
    assert.equal(publicVersion.siteUuid, site.uuid);
    assert.equal(publicVersion.content.textile.heroImage, probe.textile!.heroImage);
    assert.deepEqual(publicVersion.content.profile.emails, probe.profile.emails);
  } finally {
    await save(baseline);
    await publish();
  }
  const exported = await session.request<DeliverySnapshot>(
    "POST",
    `/sites/${site.uuid}/publication/export`,
    {}
  );
  assert.equal(exported.status, 200);
  assert.equal(exported.data.content.hero.title, baseline.hero.title);
  await mkdir(resolve("dist/apps/sites/publications"), { recursive: true });
  await writeFile(
    resolve("dist/apps/sites/publications/tirupurconnect.json"),
    JSON.stringify(exported.data, null, 2)
  );
  console.info(
    `PASS Sites CMS: draft isolation, stale revision, unsafe image rejection, published hero/banner/contact content, restoration and authenticated export. Client ${site.uuid}, sequence ${exported.data.sequence}.`
  );
} finally {
  await session.request("POST", "/auth/logout", { desk: "tenant" });
}
