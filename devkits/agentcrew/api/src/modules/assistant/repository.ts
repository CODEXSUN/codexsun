import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { Run, Task, TaskInput } from "./contracts.js";

const migration = "CREATE TABLE records (kind TEXT NOT NULL, id TEXT PRIMARY KEY, body TEXT NOT NULL);";

export class AssistantRepository {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL);",
    );
    const checksum = createHash("sha256").update(migration).digest("hex");
    const prior = this.db.prepare("SELECT checksum FROM migrations WHERE id = ?").get("assistant.001");
    if (prior && prior.checksum !== checksum) throw new Error("Assistant migration checksum mismatch.");
    if (!prior) {
      this.db.exec("BEGIN");
      try {
        this.db.exec(migration);
        this.db.prepare("INSERT INTO migrations VALUES (?, ?)").run("assistant.001", checksum);
        this.db.exec("COMMIT");
      } catch (error) {
        this.db.exec("ROLLBACK");
        throw error;
      }
    }
    for (const run of this.list<Run>("run")) {
      if (run.status === "running")
        this.save("run", {
          ...run,
          status: "interrupted",
          error: "Server restarted. Retry explicitly.",
          finishedAt: Date.now(),
        });
    }
  }

  list<T>(kind: string): T[] {
    return this.db
      .prepare("SELECT body FROM records WHERE kind = ? ORDER BY rowid DESC LIMIT 500")
      .all(kind)
      .map((row) => JSON.parse(String(row.body)) as T);
  }

  find<T>(id: string, kind: string): T | undefined {
    const row = this.db.prepare("SELECT body FROM records WHERE id = ? AND kind = ?").get(id, kind);
    return row ? (JSON.parse(String(row.body)) as T) : undefined;
  }

  save<T extends { id: string }>(kind: string, value: T): void {
    this.db
      .prepare("INSERT INTO records VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body")
      .run(kind, value.id, JSON.stringify(value));
  }

  create(input: TaskInput): Task {
    if (this.list("task").length >= 100)
      throw new Error("Task limit reached (100). Use a fresh store or archive tasks before adding more.");
    const task = { ...input, id: randomUUID(), enabled: false, nextAt: Date.now(), count: 0, failures: 0 };
    this.save("task", task);
    return task;
  }

  log(event: string, taskId?: string): void {
    this.save("log", { id: randomUUID(), ...{ event, taskId, at: Date.now() } });
    this.db
      .prepare(
        "DELETE FROM records WHERE kind='log' AND id NOT IN (SELECT id FROM records WHERE kind='log' ORDER BY rowid DESC LIMIT 200)",
      )
      .run();
    this.db
      .prepare(
        "DELETE FROM records WHERE kind='run' AND id NOT IN (SELECT id FROM records WHERE kind='run' ORDER BY rowid DESC LIMIT 200)",
      )
      .run();
  }

  close(): void {
    this.db.close();
  }
}
