import { DatabaseSync } from "node:sqlite";

// One file belongs to one site. Studio remains the authoring database.
export class ClientContentStore {
  constructor(path, siteUuid) {
    if (!/^[a-f0-9]{8}$/u.test(siteUuid)) {
      throw new Error("Site UUID must contain eight lowercase hexadecimal characters.");
    }
    this.database = new DatabaseSync(path);
    try {
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

  close() {
    this.database.close();
  }
}
