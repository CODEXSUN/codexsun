import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyPublication } from "@codexsun/sites-api/delivery-integrity";

const root = resolve(import.meta.dirname, "../../../..");
const slug = process.argv[2] || "logicx";
const identities = { logicx: "c0de0002", ramutex: "c0de0004" };
if (!Object.hasOwn(identities, slug)) throw new Error("Select logicx or ramutex.");
const origin = `https://${slug}.codexsun.com`;
const release = resolve(root, "dist/apps/sites/releases", slug);
const output = resolve(root, "dist/apps/sites/cloudflare", slug);
const snapshot = verifyPublication(
  JSON.parse(await readFile(resolve(release, "publication.json"), "utf8"))
);
const meta = JSON.parse(await readFile(resolve(release, "release.json"), "utf8"));
if (snapshot.siteSlug !== slug || snapshot.siteUuid !== identities[slug] || meta.origin !== origin)
  throw new Error(`Prepare the verified ${slug} release for ${origin} first.`);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(release, "public"), resolve(output, "public"), { recursive: true });
await rm(resolve(output, "public/index.template.html"));
const runtime = await import(pathToFileURL(resolve(release, "runtime/server.mjs")).href);
const template = await readFile(resolve(release, "public/index.template.html"), "utf8");
await writeFile(
  resolve(output, "public/404.html"),
  runtime.renderPublicDocument(snapshot, "/not-found", template, meta.origin)
);
await writeFile(
  resolve(output, "publication.json"),
  JSON.stringify({
    sequence: snapshot.sequence,
    siteKey: snapshot.siteKey,
    routes: runtime.publicRoutes(snapshot),
    content: {
      siteUuid: snapshot.siteUuid,
      siteSlug: snapshot.siteSlug,
      content: snapshot.content,
      blogs: snapshot.blogs
    }
  })
);
const schema = await readFile(
  resolve(root, "apps/sites/api/src/modules/site/enquiry/enquiry.d1.sql"),
  "utf8"
);
await writeFile(
  resolve(output, "migration.sql"),
  schema +
    `\nINSERT OR IGNORE INTO sites_delivery_identity VALUES(1,'${snapshot.siteUuid}','${snapshot.siteKey}');\n`
);
console.log(
  `Prepared Cloudflare ${slug} publication ${snapshot.sequence}, ${runtime.publicRoutes(snapshot).length} routes.`
);
