import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { createConnection } from "mysql2/promise";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import { migrateSiteModule } from "./site.migration.js";
import { seedSiteModule } from "./site.seed.js";
import { PageRepository, PageService } from "./page/index.js";
import { BlogRepository, BlogService } from "./blog/index.js";
import { initialRamuTexPage } from "./page/page.content.js";
import type { SitesDatabase } from "./site.types.js";
import { SiteService } from "./site.service.js";
import { PublicationRepository, PublicationService } from "./publication/index.js";
import { verifyPublication } from "./publication/publication.integrity.js";
import { SiteRepository } from "./site.repository.js";

test(
  "MariaDB migrations, repeatable seeds, draft persistence, publication and site isolation",
  {
    skip: process.env.CODEXSUN_SITES_TEST_MARIADB !== "1",
    timeout: 30000
  },
  async () => {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    if (!host || !user || password === undefined)
      throw new Error("Explicit local MariaDB test credentials are required.");
    const options = {
      host,
      port: Number(process.env.DB_PORT || 3306),
      user,
      password
    };
    const name = `codexsun_sites_cms_test_${randomBytes(4).toString("hex")}`;
    const admin = await createConnection(options);
    let db: Kysely<SitesDatabase> | undefined;
    try {
      await admin.query(`CREATE DATABASE \`${name}\``);
      db = new Kysely<SitesDatabase>({
        dialect: new MysqlDialect({
          pool: createPool({ ...options, database: name, connectionLimit: 2 })
        })
      });
      await migrateSiteModule(db);
      await seedSiteModule(db);
      await migrateSiteModule(db);
      await seedSiteModule(db);
      const sites = await db
        .selectFrom("sites_portfolio_sites")
        .selectAll()
        .orderBy("slug")
        .execute();
      assert.deepEqual(
        sites.map((row) => row.slug),
        ["logicx", "ramutex"]
      );
      const ramu = sites.find((row) => row.slug === "ramutex")!;
      const other = sites.find((row) => row.slug === "logicx")!;
      const logicxPage = new PageService(new PageRepository(db), other);
      assert.equal((await logicxPage.show()).content.profile.domain, "logicx.in");
      assert.equal((await logicxPage.show()).revision, 1);
      const page = new PageService(new PageRepository(db), ramu);
      const initial = await page.show();
      assert.equal(initial.revision, 1);
      const content = structuredClone(initialRamuTexPage);
      content.profile.name = "Draft name";
      const saved = await page.save(content, initial.revision, "cms-test@example.test");
      assert.equal((await page.show()).content.profile.name, "Draft name");
      assert.equal(await page.published(), null);
      await assert.rejects(
        page.save(initialRamuTexPage, initial.revision, "stale@example.test"),
        /changed/
      );
      await page.publish(saved.revision, "cms-test@example.test");
      assert.equal((await page.published())?.profile.name, "Draft name");
      assert.equal(await logicxPage.published(), null);
      await db.transaction().execute(async (transaction) => {
        const database: Kysely<SitesDatabase> = transaction;
        const current = await logicxPage.show();
        await new PageService(new PageRepository(database), other).save(
          current.content,
          current.revision,
          "cms-test@example.test"
        );
      });
      assert.equal((await logicxPage.show()).revision, 2);
      const createClient = async () =>
        db!.transaction().execute(async (transaction) => {
          const database: Kysely<SitesDatabase> = transaction;
          const client = await new SiteService(new SiteRepository(database)).create({
            name: "New client",
            slug: "new-client",
            primaryDomain: "client.example",
            themeKey: "portfolio-standard",
            port: 17133
          });
          const workspace = new PageService(new PageRepository(database), client);
          await workspace.save((await workspace.show()).content, 0, "cms-test@example.test");
          return client;
        });
      const client = await createClient();
      const clientPage = await new PageService(new PageRepository(db), client).show();
      assert.equal(clientPage.content.profile.name, "New client");
      assert.equal(clientPage.revision, 1);
      assert.equal(clientPage.publishedRevision, 0);
      assert.equal(client.publishedPages, 0);
      await assert.rejects(
        new SiteService(new SiteRepository(db)).create({
          name: "Conflicting client",
          slug: "conflict",
          primaryDomain: "conflict.example",
          themeKey: "portfolio-standard",
          port: 17133
        }),
        /port is already assigned/
      );
      const publication = new PublicationService(new PublicationRepository(db), ramu, "tenant-test");
      const release = await publication.export(await page.published(), [], "cms-test@example.test");
      assert.equal(verifyPublication(release).content.profile.name, "Draft name");
      await assert.rejects(
        new PublicationService(new PublicationRepository(db), other, "tenant-test").export(
          null,
          [],
          "cms-test@example.test"
        ),
        /Publish/
      );
      const nextRelease = await publication.export(
        await page.published(),
        [],
        "cms-test@example.test"
      );
      assert.ok(nextRelease.sequence > release.sequence);
      const blogs = new BlogService(new BlogRepository(db), ramu);
      const draft = {
        title: "Textile note",
        slug: "textile-note",
        summary: "Processing notes.",
        body: "A test article with plain text."
      };
      const post = await blogs.save(null, draft, 0, "cms-test@example.test");
      assert.equal((await blogs.published()).length, 0);
      assert.equal((await new BlogService(new BlogRepository(db), other).list()).length, 0);
      let records = await blogs.publication(
        post.uuid,
        post.revision,
        "cms-test@example.test",
        true
      );
      assert.equal((await blogs.published()).length, 1);
      await assert.rejects(
        blogs.delete(post.uuid, records[0]!.revision, "cms-test@example.test"),
        /Unpublish/
      );
      records = await blogs.publication(
        post.uuid,
        records[0]!.revision,
        "cms-test@example.test",
        false
      );
      assert.equal((await blogs.published()).length, 0);
      await blogs.delete(post.uuid, records[0]!.revision, "cms-test@example.test");
      assert.equal((await blogs.list()).length, 0);
    } finally {
      if (db) await db.destroy();
      // Never remove a registered or caller-selected tenant database.
      if (/^codexsun_sites_cms_test_[a-f0-9]{8}$/.test(name))
        await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    }
  }
);
