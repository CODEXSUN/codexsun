import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { CallLogComment, CallLogFilters, CallLogInput } from "./call-log.types.js";

type Row = {
  id: number;
  direction: string;
  from_number: string;
  to_number: string;
  call_status: string;
  duration_seconds: number;
  user_email: string | null;
  created_at: Date | string;
  started_at: Date | string;
};

export class CallLogRepository {
  constructor(private readonly database: Kysely<unknown>) {}

  async list(filters: CallLogFilters) {
    const conditions = [sql`1=1`];
    if (filters.type) conditions.push(sql`log.direction = ${filters.type}`);
    if (filters.status) conditions.push(sql`log.call_status = ${filters.status}`);
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        sql`(CAST(log.id AS CHAR) LIKE ${term} OR log.from_number LIKE ${term} OR log.to_number LIKE ${term})`
      );
    }
    const where = sql.join(conditions, sql` AND `);
    const [result, summary] = await Promise.all([
      sql<Row>`SELECT log.id, log.direction, log.from_number, log.to_number, log.call_status,
      log.duration_seconds, log.user_email, log.created_at, log.started_at
      FROM crm_call_logs log WHERE ${where}
      ORDER BY log.id DESC LIMIT ${filters.pageSize + 1} OFFSET ${(filters.page - 1) * filters.pageSize}`.execute(
        this.database
      ),
      sql<{ status: string; status_count: number }>`SELECT log.call_status AS status, COUNT(*) AS status_count
        FROM crm_call_logs log WHERE ${where} GROUP BY log.call_status`.execute(this.database)
    ]);
    return {
      items: result.rows.slice(0, filters.pageSize).map((row) => ({
        name: `CL-${row.id}`,
        from: row.from_number,
        to: row.to_number,
        type: row.direction,
        status: row.call_status,
        duration: row.duration_seconds,
        receiver: row.direction === "Incoming" ? (row.user_email ?? "") : "",
        caller: row.direction === "Outgoing" ? (row.user_email ?? "") : "",
        createdAt: new Date(row.created_at).toISOString(),
        startedAt: new Date(row.started_at).toISOString()
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: result.rows.length > filters.pageSize,
      total: summary.rows.reduce((total, row) => total + Number(row.status_count), 0),
      statusCounts: summary.rows.map((row) => ({ code: row.status, count: Number(row.status_count) }))
    };
  }

  async users(search: string) {
    const term = `%${search}%`;
    const rows = await sql<{ email: string; name: string | null }>`SELECT email, name FROM app_users
      WHERE status='active' AND (email LIKE ${term} OR name LIKE ${term}) ORDER BY name LIMIT 100`.execute(
      this.database
    );
    return rows.rows.map((user) => ({ value: user.email, label: user.name || user.email }));
  }

  async create(input: CallLogInput, actorEmail: string) {
    if (input.sourceReference) {
      const existing = await sql<{ id: number }>`SELECT id FROM crm_call_logs
        WHERE source_reference=${input.sourceReference} LIMIT 1`.execute(this.database);
      if (existing.rows[0]) return { name: `CL-${existing.rows[0].id}` };
    }
    const startedAt = input.occurredAt
      ? input.occurredAt.slice(0, 19).replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");
    const receiver = input.user
      ? await sql<{
          email: string;
        }>`SELECT email FROM app_users WHERE email=${input.user} AND status='active' LIMIT 1`.execute(
          this.database
        )
      : null;
    if (input.user && !receiver?.rows.length)
      throw AppError.validation("The selected user is unavailable.");
    return this.database.transaction().execute(async (transaction) => {
      const insert = await sql`INSERT INTO crm_call_logs
        (direction, from_number, to_number, call_status, duration_seconds, user_email, source_reference, started_at, created_by)
        VALUES (${input.type}, ${input.from.trim()}, ${input.to.trim()}, ${input.status}, ${input.duration}, ${input.user}, ${input.sourceReference ?? null}, ${startedAt}, ${actorEmail})
        ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`.execute(
        transaction
      );
      const id = Number(insert.insertId);
      return { name: `CL-${id}` };
    });
  }

  async listComments(callLogId: number): Promise<CallLogComment[]> {
    const rows = await sql<{
      id: number;
      call_log_id: number;
      body: string;
      created_by: string;
      created_at: Date | string;
    }>`
      SELECT id, call_log_id, body, created_by, created_at FROM crm_call_log_comments
      WHERE call_log_id=${callLogId} ORDER BY created_at, id`.execute(this.database);
    return rows.rows.map((row) => ({
      id: row.id,
      callLogId: row.call_log_id,
      body: row.body,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).toISOString()
    }));
  }

  async addComment(callLogId: number, body: string, actorEmail: string): Promise<CallLogComment> {
    const log = await sql<{
      id: number;
    }>`SELECT id FROM crm_call_logs WHERE id=${callLogId} LIMIT 1`.execute(this.database);
    if (!log.rows[0]) throw AppError.notFound("Call log was not found.");
    const inserted = await sql`INSERT INTO crm_call_log_comments (call_log_id, body, created_by)
      VALUES (${callLogId}, ${body}, ${actorEmail})`.execute(this.database);
    const comments = await this.listComments(callLogId);
    return comments.find((comment) => comment.id === Number(inserted.insertId))!;
  }
}
