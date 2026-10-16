import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { initialRamuTexPage } from "./page/page.content.js";
import { pageContentSchema } from "./page/page.schema.js";
import { PageRepository, PageService } from "./page/index.js";
import { BlogRepository, BlogService } from "./blog/index.js";
import { registerPageRoutes } from "./page/page.routes.js";
import type { SitesDatabase } from "./site.types.js";
import type { CmsSite } from "./site.types.js";
import { SitePublicReader } from "./site.public.js";
import { initialSitePage } from "./page/page.defaults.js";

const owner = { id: 1, uuid: "c0de0004", slug: "ramutex", status: "active" };
const post = {
  title: "Fabric care",
  slug: "fabric-care",
  summary: "A note on fabric care.",
  body: "Paragraph one.\n\nParagraph two."
};

test("client workspaces use their own defaults, saved pages and publication", async () => {
  const db = createDatabase();
  try {
    const logicx = { id: 2, uuid: "c0de0002", slug: "logicx", status: "active" };
    const ramuPage = new PageService(new PageRepository(db), owner);
    const logicxPage = new PageService(new PageRepository(db), logicx);
    const draft = (await logicxPage.show()).content;
    assert.equal(draft.profile.domain, "logicx.in");
    assert.deepEqual(draft.profile.phones, []);
    assert.equal(draft.finishes.items[0]?.name, "Custom software");
    draft.hero.title = "LogicX only";
    await logicxPage.save(draft, 0, "editor@example.test");
    assert.notEqual((await ramuPage.show()).content.hero.title, draft.hero.title);
    assert.equal(await logicxPage.published(), null);
    await logicxPage.publish(1, "publisher@example.test");
    assert.equal((await logicxPage.published())?.hero.title, draft.hero.title);
    assert.equal(await ramuPage.published(), null);
    const neutral = initialSitePage({
      id: 3,
      uuid: "00000003",
      slug: "new-client",
      name: "New client",
      primaryDomain: "client.example",
      status: "active"
    });
    assert.equal(pageContentSchema.safeParse(neutral).success, true);
    assert.equal(JSON.stringify(neutral).includes("Ramu"), false);
    assert.equal(JSON.stringify(neutral).includes("LogicX"), false);
    assert.deepEqual(neutral.finishes.items, []);
  } finally {
    await db.destroy();
  }
});

test("page drafts persist, publishing does not expose later edits, and stale saves roll back", async () => {
  const db = createDatabase();
  try {
    const service = new PageService(new PageRepository(db), owner);
    const first = await service.save(initialRamuTexPage, 0, "editor@example.test");
    assert.equal(first.revision, 1);
    assert.equal(await service.published(), null);
    await service.publish(1, "publisher@example.test");
    const next = structuredClone(initialRamuTexPage);
    next.hero.title = "A private new headline";
    await service.save(next, 1, "editor@example.test");
    assert.equal((await service.show()).content.hero.title, "A private new headline");
    assert.equal((await service.published())?.hero.title, initialRamuTexPage.hero.title);
    await assert.rejects(service.save(initialRamuTexPage, 1, "stale@example.test"), /changed/);
    assert.equal((await service.activity()).length, 3);
    await assert.rejects(service.publish(1, "publisher@example.test"), /current page/);
    await service.publish(2, "publisher@example.test");
    assert.equal((await service.published())?.hero.title, "A private new headline");
    const disabled = new PageService(new PageRepository(db), { ...owner, status: "suspended" });
    await assert.rejects(disabled.publish(2, "publisher@example.test"), /Activate/);
    await assert.rejects(disabled.published(), /unavailable/);
  } finally {
    await db.destroy();
  }
});

test("blog isolation, duplicate rules, draft publication, withdrawal, and audited deletion", async () => {
  const db = createDatabase();
  try {
    const repository = new BlogRepository(db);
    const service = new BlogService(repository, owner);
    const first = await service.save(null, post, 0, "editor@example.test");
    assert.deepEqual(await new BlogService(repository, { id: 2, status: "active" }).list(), []);
    await assert.rejects(
      new BlogService(repository, { id: 2, status: "active" }).save(
        first.uuid,
        post,
        1,
        "other@example.test"
      ),
      /not found/
    );
    assert.deepEqual(await service.published(), []);
    await assert.rejects(service.save(null, post, 0, "editor@example.test"), /already uses/);
    let rows = await service.publication(first.uuid, 1, "publisher@example.test", true);
    assert.equal((await service.published())[0]?.title, post.title);
    await assert.rejects(
      service.delete(first.uuid, rows[0]!.revision, "editor@example.test"),
      /Unpublish/
    );
    await assert.rejects(
      service.save(
        first.uuid,
        { ...post, slug: "changed-url" },
        rows[0]!.revision,
        "editor@example.test"
      ),
      /Unpublish/
    );
    const next = await service.save(
      first.uuid,
      { ...post, title: "Private draft title" },
      rows[0]!.revision,
      "editor@example.test"
    );
    assert.equal((await service.published())[0]?.title, post.title);
    rows = await service.publication(first.uuid, next.revision, "publisher@example.test", false);
    assert.deepEqual(await service.published(), []);
    await service.delete(first.uuid, rows[0]!.revision, "editor@example.test");
    assert.deepEqual(await service.list(), []);
    assert.equal((await db.selectFrom("sites_blog_activity").selectAll().execute()).length, 5);
  } finally {
    await db.destroy();
  }
});

test("HTTP writes reject denied actions and invalid page content without touching persistence", async () => {
  const db = createDatabase();
  const app = Fastify();
  registerPageRoutes(app, async (_request, _uuid, action) => {
    if (action !== "view") throw AppError.forbidden("Editing is denied.");
    return {
      service: new PageService(new PageRepository(db), owner),
      actor: "viewer@example.test"
    };
  });
  try {
    const denied = await app.inject({
      method: "PUT",
      url: "/sites/c0de0004/page",
      payload: { content: initialRamuTexPage, revision: 0 }
    });
    assert.equal(denied.statusCode, 403);
    const invalid = await app.inject({
      method: "PUT",
      url: "/sites/c0de0004/page",
      payload: {
        content: {
          ...initialRamuTexPage,
          profile: { ...initialRamuTexPage.profile, domain: "javascript:alert(1)" }
        },
        revision: 0
      }
    });
    assert.equal(invalid.statusCode, 400);
    assert.equal(await new PageRepository(db).find(1), undefined);
    assert.equal(
      pageContentSchema.safeParse({ ...initialRamuTexPage, privateTenantPassword: "secret" })
        .success,
      false
    );
  } finally {
    await app.close();
    await db.destroy();
  }
});

test("tenant databases stay isolated and public delivery cannot be rebound across tenants", async () => {
  const first = createDatabase();
  const second = createDatabase();
  try {
    const draft = structuredClone(initialRamuTexPage);
    draft.hero.title = "Tenant one draft";
    await new PageService(new PageRepository(first), owner).save(draft, 0, "editor@example.test");
    assert.notEqual(
      (await new PageService(new PageRepository(second), owner).show()).content.hero.title,
      draft.hero.title
    );
    const site: CmsSite = {
      ...owner,
      status: "active",
      name: "Ramu Tex",
      port: 7132,
      primaryDomain: "ramumag.com",
      publishedPages: 1,
      themeKey: "portfolio-ramutex",
      description: "",
      createdAt: "",
      updatedAt: ""
    };
    const reader = new SitePublicReader();
    reader.bind(first, "tenant-one", site);
    assert.throws(() => reader.bind(second, "tenant-two", site), /already bound/);
    assert.throws(
      () => reader.bind(first, "tenant-one", { ...site, uuid: "c0de0005" }),
      /already bound/
    );
  } finally {
    await first.destroy();
    await second.destroy();
  }
});

function createDatabase() {
  const raw = new DatabaseSync(":memory:");
  raw.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE sites_portfolio_sites(id INTEGER PRIMARY KEY);
    INSERT INTO sites_portfolio_sites VALUES(1),(2);
    CREATE TABLE sites_pages(id INTEGER PRIMARY KEY,uuid TEXT UNIQUE,site_id INTEGER UNIQUE REFERENCES sites_portfolio_sites(id),content_json TEXT,published_json TEXT,revision INTEGER,published_revision INTEGER,updated_at TEXT);
    CREATE TABLE sites_page_activity(id INTEGER PRIMARY KEY,page_uuid TEXT,actor TEXT,action TEXT,revision INTEGER,created_at TEXT);
    CREATE TABLE sites_blog_posts(id INTEGER PRIMARY KEY,uuid TEXT UNIQUE,site_id INTEGER REFERENCES sites_portfolio_sites(id),slug TEXT,content_json TEXT,published_json TEXT,revision INTEGER,published_revision INTEGER,updated_at TEXT,UNIQUE(site_id,slug));
    CREATE TABLE sites_blog_activity(id INTEGER PRIMARY KEY,post_uuid TEXT,site_id INTEGER,actor TEXT,action TEXT,revision INTEGER,created_at TEXT);`);
  return new Kysely<SitesDatabase>({
    dialect: new SqliteDialect({
      database: {
        close: () => raw.close(),
        prepare: (sql: string) => {
          const statement = raw.prepare(sql);
          return {
            reader: statement.columns().length > 0,
            all: (parameters: readonly unknown[]) =>
              statement.all(...(parameters as SQLInputValue[])),
            run: (parameters: readonly unknown[]) =>
              statement.run(...(parameters as SQLInputValue[])),
            iterate: (parameters: readonly unknown[]) =>
              statement.iterate(...(parameters as SQLInputValue[]))
          };
        }
      }
    })
  });
}
