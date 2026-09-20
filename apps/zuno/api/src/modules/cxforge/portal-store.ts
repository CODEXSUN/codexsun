import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PortalError } from "./portal-contracts.js";

export interface ServerRecord { id: string; name: string; apiUrl: string; credential: string; }

export class PortalStore {
  private readonly db: DatabaseSync;
  private readonly key: Buffer;

  constructor(path: string, encryptionKey: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.key = createHash("sha256").update(encryptionKey).digest();
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS portal_servers(id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL, secret TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS portal_values(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS portal_commands(key TEXT PRIMARY KEY, hash TEXT NOT NULL, result TEXT);
      CREATE TABLE IF NOT EXISTS portal_events(server TEXT, task TEXT, id TEXT, value TEXT, PRIMARY KEY(server,task,id));`);
  }

  servers(): Omit<ServerRecord, "credential">[] {
    return this.db.prepare("SELECT id,name,url AS apiUrl FROM portal_servers ORDER BY name").all() as unknown as Omit<ServerRecord, "credential">[];
  }

  server(id: string): ServerRecord {
    const row = this.db.prepare("SELECT id,name,url AS apiUrl,secret FROM portal_servers WHERE id=?").get(id) as (Omit<ServerRecord, "credential"> & { secret: string }) | undefined;
    if (!row) throw new PortalError(404, "CXForge server not found.");
    const [iv, tag, encrypted] = row.secret.split(".").map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    const credential = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
    return { id: row.id, name: row.name, apiUrl: row.apiUrl, credential };
  }

  saveServer(input: Omit<ServerRecord, "id">, id = randomUUID() as string): Omit<ServerRecord, "credential"> {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(input.credential), cipher.final()]);
    const secret = [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
    const apiUrl = new URL(input.apiUrl).origin;
    this.db.prepare("INSERT OR REPLACE INTO portal_servers VALUES(?,?,?,?)").run(id, input.name, apiUrl, secret);
    return { id, name: input.name, apiUrl };
  }

  get<T>(key: string): T | undefined {
    const row = this.db.prepare("SELECT value FROM portal_values WHERE key=?").get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) as T : undefined;
  }

  set(key: string, value: unknown): void { this.db.prepare("INSERT OR REPLACE INTO portal_values VALUES(?,?)").run(key, JSON.stringify(value)); }

  async command<T>(key: string, input: unknown, work: () => Promise<T>): Promise<T> {
    const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const old = this.db.prepare("SELECT hash,result FROM portal_commands WHERE key=?").get(key) as { hash: string; result: string | null } | undefined;
    if (old) {
      if (old.hash !== hash) throw new PortalError(409, "Idempotency key already belongs to different instructions.");
      if (old.result) return JSON.parse(old.result) as T;
      throw new PortalError(409, "Command pending or outcome uncertain. Refresh CXForge state before retrying; do not create a duplicate.");
    }
    this.db.prepare("INSERT INTO portal_commands(key,hash) VALUES(?,?)").run(key, hash);
    // A failed transport may already have changed the worker. Keep its reservation.
    const result = await work();
    this.db.prepare("UPDATE portal_commands SET result=? WHERE key=?").run(JSON.stringify(result), key);
    return result;
  }

  addEvent(server: string, task: string, value: { id: string }): void {
    this.db.prepare("INSERT OR IGNORE INTO portal_events VALUES(?,?,?,?)").run(server, task, value.id, JSON.stringify(value));
    this.set(`cursor:${server}:${task}`, value.id);
  }

  events(server: string, task: string): unknown[] {
    return (this.db.prepare("SELECT value FROM portal_events WHERE server=? AND task=? ORDER BY rowid").all(server, task) as { value: string }[]).map((row) => JSON.parse(row.value));
  }

  close(): void { this.db.close(); }
}
