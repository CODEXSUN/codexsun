import type { DatabaseSync } from "node:sqlite";
export function migrateEnquiry(database: DatabaseSync) {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec(`CREATE TABLE IF NOT EXISTS migration_schema(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sites_enquiries(id INTEGER PRIMARY KEY AUTOINCREMENT,reference TEXT NOT NULL UNIQUE,request_key TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consented_at TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sites_enquiry_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sites_enquiry_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    INSERT OR IGNORE INTO migration_schema VALUES('sites.enquiry.v1',CURRENT_TIMESTAMP);`);
    const columns = new Set(
      database
        .prepare("PRAGMA table_info(sites_enquiries)")
        .all()
        .map((row) => row.name)
    );
    for (const [name, definition] of [
      ["status", "TEXT NOT NULL DEFAULT 'new'"],
      ["revision", "INTEGER NOT NULL DEFAULT 1"],
      ["updated_at", "TEXT NOT NULL DEFAULT ''"],
      ["deleted_at", "TEXT"]
    ]) {
      if (!columns.has(name))
        database.exec(`ALTER TABLE sites_enquiries ADD COLUMN ${name} ${definition}`);
    }
    database.exec(`CREATE TABLE IF NOT EXISTS sites_enquiry_activity(id INTEGER PRIMARY KEY AUTOINCREMENT,reference TEXT NOT NULL,action TEXT NOT NULL,actor TEXT NOT NULL,at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS sites_enquiry_activity_reference ON sites_enquiry_activity(reference,id);
 CREATE INDEX IF NOT EXISTS sites_enquiries_inbox ON sites_enquiries(deleted_at,status,created_at);
 INSERT OR IGNORE INTO migration_schema VALUES('sites.enquiry.v2',CURRENT_TIMESTAMP);`);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
