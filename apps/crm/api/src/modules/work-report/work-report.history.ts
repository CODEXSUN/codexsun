import { sql, type Kysely, type Selectable } from "kysely";
import type { WorkReportDatabase, WorkReportRow, WorkReportTarget } from "./work-report.types.js";
type HistoryRow = Selectable<WorkReportRow> & {
  created_by_name: string;
  comment_id: number | null;
};
export class WorkReportHistory {
  constructor(private readonly database: Kysely<WorkReportDatabase>) {}
  async page(target: WorkReportTarget, page: number, pageSize: number, checkpoints = false) {
    const all = this.source(target);
    const source = checkpoints
      ? sql`SELECT * FROM (${all}) checkpoints WHERE action IN ('check-in','check-out')`
      : all;
    const count = await sql<{
      total: number | string;
    }>`SELECT COUNT(*) AS total FROM (${source}) history`.execute(this.database);
    const result =
      await sql<HistoryRow>`SELECT history.*, COALESCE(u.name,history.created_by) AS created_by_name
      FROM (${source}) history LEFT JOIN app_users u ON u.email=history.created_by
      ORDER BY history.created_at DESC, history.source_order DESC, history.id DESC, history.uuid DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`.execute(this.database);
    return { items: result.rows, total: Number(count.rows[0]?.total ?? 0), page, pageSize };
  }
  private source(target: WorkReportTarget) {
    const enquiry = target.enquiryId !== null;
    const id = target.enquiryId ?? target.taskId!;
    const activities = enquiry
      ? sql`SELECT id,uuid,action,details AS body,created_by,created_at,updated_at,status
      FROM crm_enquiry_activity WHERE enquiry_id=${id}`
      : sql`SELECT id,uuid,event_type AS action,description AS body,actor AS created_by,created_at,updated_at,status
      FROM crm_task_activity WHERE task_id=${id}`;
    const comments = enquiry
      ? sql`SELECT id,uuid,CASE WHEN parent_id IS NULL THEN 'comment-added' ELSE 'reply-added' END AS action,
      body,created_by,created_at,updated_at,status FROM crm_enquiry_comments WHERE enquiry_id=${id}`
      : sql`SELECT id,uuid,'comment-added' AS action,body,created_by,created_at,updated_at,status FROM crm_task_comments WHERE task_id=${id}`;
    const reportsWhere = enquiry ? sql`enquiry_id=${id}` : sql`task_id=${id}`;
    const whatsapp = enquiry
      ? sql`UNION ALL SELECT id,CONCAT('whatsapp-',id),'whatsapp-handoff',message,created_by,created_at,created_at,'active',
      ${target.enquiryId},NULL,CONCAT('whatsapp-',id),NULL,NULL,NULL,NULL,NULL,4
      FROM crm_enquiry_whatsapp_messages WHERE enquiry_id=${id}`
      : sql``;
    return sql`
      SELECT id,CONCAT('work-',uuid) AS uuid,
        CASE WHEN action='report' THEN 'comment-added' ELSE action END AS action,
        CASE WHEN action='report' AND body LIKE 'comment:%' THEN TRIM(SUBSTRING(body,9)) ELSE body END AS body,
        created_by,created_at,updated_at,status,
        enquiry_id,task_id,request_id,latitude,longitude,accuracy_meters,captured_at,NULL AS comment_id,3 AS source_order
      FROM crm_work_reports WHERE ${reportsWhere} AND status='active'
        AND action NOT IN ('comment','comment-added','reply-added')
      UNION ALL
      SELECT id,CONCAT('activity-',uuid),action,body,created_by,created_at,updated_at,status,
        ${target.enquiryId},${target.taskId},CONCAT('activity-',uuid),NULL,NULL,NULL,NULL,NULL,1
      FROM (${activities}) activity WHERE status='active' AND action IN ('created','updated')
      UNION ALL
      SELECT id,CONCAT('comment-',uuid),action,body,created_by,created_at,updated_at,status,
        ${target.enquiryId},${target.taskId},CONCAT('comment-',uuid),NULL,NULL,NULL,NULL,id,2
      FROM (${comments}) comments WHERE status='active'
      ${whatsapp}`;
  }
}
