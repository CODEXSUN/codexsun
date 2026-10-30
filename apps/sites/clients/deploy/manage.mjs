import { existsSync, mkdirSync, chmodSync } from "node:fs";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { backup } from "node:sqlite";
import { openSiteStore } from "./server.mjs";
const release = resolve(import.meta.dirname, "..");
if (!process.env.CODEXSUN_SITES_DB)
  throw new Error("Set CODEXSUN_SITES_DB to this client's absolute database path.");
const { store } = openSiteStore(release, process.env.CODEXSUN_SITES_DB);
try {
  const [action, value] = process.argv.slice(2);
  if (action === "enquiries") {
    const table = store.database
      .prepare("SELECT name FROM sqlite_master WHERE name='sites_enquiries'")
      .get();
    console.log(
      JSON.stringify(
        table
          ? store.database
              .prepare(
                "SELECT reference,name,email,company,phone,message,consented_at FROM sites_enquiries WHERE created_at>=? ORDER BY id DESC LIMIT 100"
              )
              .all(Date.now() - 90 * 86400000)
          : [],
        null,
        2
      )
    );
  } else if (action === "delete-enquiry" && /^[a-f0-9-]{36}$/.test(value || "")) {
    store.database.exec("BEGIN IMMEDIATE");
    try {
      const audit = store.database
        .prepare("SELECT name FROM sqlite_master WHERE name='sites_enquiry_activity'")
        .get();
      if (audit)
        store.database.prepare("DELETE FROM sites_enquiry_activity WHERE reference=?").run(value);
      const result = store.database
        .prepare("DELETE FROM sites_enquiries WHERE reference=?")
        .run(value);
      store.database.exec("COMMIT");
      console.log(JSON.stringify(result));
    } catch (error) {
      store.database.exec("ROLLBACK");
      throw error;
    }
  } else if (action === "backup" && value) {
    if (!isAbsolute(value)) throw new Error("Use a new absolute backup path.");
    const path = resolve(value);
    const within = relative(release, path);
    if ((!within.startsWith("..") && !isAbsolute(within)) || existsSync(path))
      throw new Error("Choose a new backup file outside the release.");
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    await backup(store.database, path);
    chmodSync(path, 0o600);
    console.log("SQLite backup completed.");
  } else if (action === "status") {
    const snapshot = store.snapshot();
    console.log(
      JSON.stringify({
        site: snapshot.siteSlug,
        sequence: snapshot.sequence,
        publishedAt: snapshot.publishedAt
      })
    );
  } else
    throw new Error(
      "Use status, enquiries, delete-enquiry <reference>, or backup <new-absolute-file>."
    );
} finally {
  store.close();
}
