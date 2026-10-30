import { sql, type Kysely, type Selectable } from "kysely";
import { activityCreatorDisplay } from "../enquiry/index.js";
import type {
  WorkReportDatabase,
  WorkReportHistoryFilter,
  WorkReportRow,
  WorkReportTarget
} from "./work-report.types.js";
type HistoryRow = Selectable<WorkReportRow> & {
  created_by_name: string;
  comment_id: number | null;
  action: string;
  enquiry_source: string | null;
  source_creator_email: string | null;
  source_creator_name: string | null;
  activity_creator_name: string | null;
};

export function historyActorDisplay(record: {
  action: string;
  created_by: string;
  enquiry_source: string | null;
  source_creator_email: string | null;
  source_creator_name: string | null;
  activity_creator_name: string | null;
}) {
  return activityCreatorDisplay({
    ...record,
    enquiry_source: record.enquiry_source ?? ""
  });
}

export class WorkReportHistory {
  constructor(private readonly database: Kysely<WorkReportDatabase>) {}
  async page(
    target: WorkReportTarget,
    page: number,
    pageSize: number,
    filter: WorkReportHistoryFilter = "all"
  ) {
    const all = this.source(target);
    const source =
      filter === "checkpoints"
        ? sql`SELECT * FROM (${all}) checkpoints WHERE action IN ('check-in','check-out')`
        : filter === "charges"
          ? sql`SELECT * FROM (${all}) charges WHERE action IN ('charge','collection')`
          : sql`SELECT * FROM (${all}) actions WHERE action NOT IN ('charge','collection')`;
    const count = await sql<{
      total: number | string;
    }>`SELECT COUNT(*) AS total FROM (${source}) history`.execute(this.database);
    const result = await sql<HistoryRow>`SELECT history.*,
        enquiry.source AS enquiry_source,
        enquiry.created_by AS source_creator_email,
        source_creator.name AS source_creator_name,
        activity_creator.name AS activity_creator_name
      FROM (${source}) history
      LEFT JOIN app_users AS activity_creator ON activity_creator.email=history.created_by
      LEFT JOIN crm_enquiries AS enquiry ON enquiry.id=history.enquiry_id
      LEFT JOIN app_users AS source_creator ON source_creator.email=enquiry.created_by
      ORDER BY history.created_at DESC, history.source_order DESC, history.id DESC, history.uuid DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`.execute(this.database);
    const id = target.enquiryId ?? target.taskId!;
    const totals = await sql<{ charges: number | string; collections: number | string }>`
      SELECT COALESCE(SUM(CASE WHEN action='charge' THEN amount ELSE 0 END),0) AS charges,
        COALESCE(SUM(CASE WHEN action='collection' THEN amount ELSE 0 END),0) AS collections
      FROM crm_work_reports
      WHERE ${target.enquiryId !== null ? sql`enquiry_id=${id}` : sql`task_id=${id}`} AND status='active'
    `.execute(this.database);
    return {
      items: result.rows.map((row) => ({
        ...row,
        created_by_name: historyActorDisplay(row)
      })),
      total: Number(count.rows[0]?.total ?? 0),
      page,
      pageSize,
      amounts: {
        charges: Number(totals.rows[0]?.charges ?? 0),
        collections: Number(totals.rows[0]?.collections ?? 0)
      }
    };
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
      ${target.enquiryId},NULL,CONCAT('whatsapp-',id),NULL,NULL,NULL,NULL,NULL,NULL,4
      FROM crm_enquiry_whatsapp_messages WHERE enquiry_id=${id}`
      : sql``;
    return sql`
      SELECT id,CONCAT('work-',uuid) AS uuid,
        CASE WHEN action='report' THEN 'comment-added' ELSE action END AS action,
        CASE WHEN action='report' AND body LIKE 'comment:%' THEN TRIM(SUBSTRING(body,9)) ELSE body END AS body,
        created_by,created_at,updated_at,status,
        enquiry_id,task_id,request_id,latitude,longitude,accuracy_meters,captured_at,amount,NULL AS comment_id,3 AS source_order
      FROM crm_work_reports WHERE ${reportsWhere} AND status='active'
        AND action NOT IN ('comment','comment-added','reply-added')
      UNION ALL
      SELECT id,CONCAT('activity-',uuid),action,body,created_by,created_at,updated_at,status,
        ${target.enquiryId},${target.taskId},CONCAT('activity-',uuid),NULL,NULL,NULL,NULL,NULL,NULL,1
      FROM (${activities}) activity WHERE status='active' AND action IN ('created','updated')
      UNION ALL
      SELECT id,CONCAT('comment-',uuid),action,body,created_by,created_at,updated_at,status,
        ${target.enquiryId},${target.taskId},CONCAT('comment-',uuid),NULL,NULL,NULL,NULL,NULL,id,2
      FROM (${comments}) comments WHERE status='active'
      ${whatsapp}`;
  }
}
