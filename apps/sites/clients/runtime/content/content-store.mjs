import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// One file belongs to one site. Studio remains the authoring database.
export class ClientContentStore {
  constructor(path, siteUuid) {
    if (!/^[a-f0-9]{8}$/u.test(siteUuid)) {
      throw new Error("Site UUID must contain eight lowercase hexadecimal characters.");
    }
    this.database = new DatabaseSync(path);
    try {
      this.database.exec(
        "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;"
      );
      this.database.exec(`
        CREATE TABLE IF NOT EXISTS sites_delivery_identity (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          site_uuid TEXT NOT NULL CHECK (length(site_uuid) = 8),
          schema_version INTEGER NOT NULL CHECK (schema_version = 1)
        );
      `);
      this.database
        .prepare(
          "INSERT OR IGNORE INTO sites_delivery_identity (id, site_uuid, schema_version) VALUES (1, ?, 1)"
        )
        .run(siteUuid);
      const identity = this.database
        .prepare("SELECT site_uuid, schema_version FROM sites_delivery_identity WHERE id = 1")
        .get();
      if (identity.site_uuid !== siteUuid || identity.schema_version !== 1) {
        throw new Error(
          "Content database belongs to another site or an unsupported schema version."
        );
      }
    } catch (error) {
      this.database.close();
      throw error;
    }
  }

  identity() {
    const row = this.database
      .prepare("SELECT site_uuid, schema_version FROM sites_delivery_identity WHERE id = 1")
      .get();
    return { schemaVersion: row.schema_version, siteUuid: row.site_uuid };
  }

  apply(snapshot) {
    const { sequence, publishedAt, checksum, ...payload } = snapshot;
    if (payload.siteUuid !== this.identity().siteUuid)
      throw new Error("Publication belongs to another site.");
    if (
      !Number.isSafeInteger(sequence) ||
      sequence < 1 ||
      !Number.isFinite(Date.parse(publishedAt))
    )
      throw new Error("Invalid publication sequence or timestamp.");
    if (createHash("sha256").update(JSON.stringify(payload)).digest("hex") !== checksum)
      throw new Error("Publication checksum mismatch.");
    this.database
      .exec(`CREATE TABLE IF NOT EXISTS migration_schema (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sites_delivery_snapshot (id INTEGER PRIMARY KEY CHECK(id=1), sequence INTEGER NOT NULL, checksum TEXT NOT NULL, snapshot_json TEXT NOT NULL);
      INSERT OR IGNORE INTO migration_schema VALUES ('sites.delivery.snapshot.v1', CURRENT_TIMESTAMP);`);
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_delivery_binding(id INTEGER PRIMARY KEY CHECK(id=1),site_key TEXT NOT NULL)"
    );
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (!/^[a-f0-9]{64}$/.test(payload.siteKey)) throw new Error("Invalid deployment identity.");
      const binding = this.database
        .prepare("SELECT site_key FROM sites_delivery_binding WHERE id=1")
        .get();
      if (binding && binding.site_key !== payload.siteKey)
        throw new Error("Publication belongs to another tenant or deployment.");
      this.database
        .prepare("INSERT OR IGNORE INTO sites_delivery_binding VALUES(1,?)")
        .run(payload.siteKey);
      const current = this.snapshot();
      if (current && current.sequence > sequence) throw new Error("Refusing a stale publication.");
      if (current && current.sequence === sequence && current.checksum !== checksum)
        throw new Error("Conflicting publication sequence.");
      if (!current || current.sequence !== sequence)
        this.database
          .prepare(
            "INSERT INTO sites_delivery_snapshot VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET sequence=excluded.sequence,checksum=excluded.checksum,snapshot_json=excluded.snapshot_json"
          )
          .run(sequence, checksum, JSON.stringify(snapshot));
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  snapshot() {
    const table = this.database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sites_delivery_snapshot'"
      )
      .get();
    if (!table) return null;
    const row = this.database
      .prepare("SELECT snapshot_json FROM sites_delivery_snapshot WHERE id=1")
      .get();
    return row ? JSON.parse(row.snapshot_json) : null;
  }

  close() {
    this.database.close();
  }
}
