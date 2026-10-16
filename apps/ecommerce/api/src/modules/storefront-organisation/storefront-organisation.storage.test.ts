import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import type { Kysely } from "kysely";
import sharp from "sharp";
import {
  runWithEcommerceRequestScope,
  type EcommerceDatabase
} from "../../database/ecommerce-database.js";
import { StorefrontOrganisationLogoStorage } from "./storefront-organisation.storage.js";

test("logos stay within tenant public Ecommerce storage and reject invalid image data", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "codexsun-ecommerce-logo-"));
  const database = {} as Kysely<EcommerceDatabase>;
  const scope = <T>(tenant: string, task: () => T) =>
    runWithEcommerceRequestScope(
      database,
      tenant,
      task,
      "codexsun_test",
      false,
      resolve(directory, tenant, "public")
    );
  const storage = new StorefrontOrganisationLogoStorage();
  try {
    const image = await sharp({
      create: { width: 10, height: 5, channels: 4, background: "transparent" }
    })
      .png()
      .toBuffer();
    const result = await scope("tenant_a", () => storage.upload(image.toString("base64")));
    assert.ok(
      (
        await stat(resolve(directory, "tenant_a/public/ecommerce/logo", result.logoFileName))
      ).isFile()
    );
    const content = await scope("tenant_a", () => storage.content(result.logoFileName));
    assert.equal((await sharp(content).metadata()).width, 10);
    await assert.rejects(
      () => scope("tenant_b", () => storage.content(result.logoFileName)),
      /not found/
    );
    await assert.rejects(
      () => scope("tenant_a", () => storage.upload(Buffer.from("not an image").toString("base64"))),
      /valid PNG/
    );
    await assert.rejects(
      () =>
        scope("tenant_a", () =>
          storage.upload(Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64"))
        ),
      /2 MB/
    );
    await assert.rejects(
      () => scope("tenant_a", () => storage.content("../outside.png")),
      /Invalid storefront logo/
    );
  } finally {
    assert.ok(directory.startsWith(resolve(tmpdir(), "codexsun-ecommerce-logo-")));
    await rm(directory, { recursive: true, force: true });
  }
});
