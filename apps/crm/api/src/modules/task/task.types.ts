import type { ColumnType, Generated, Kysely } from "kysely";

export type TaskColumnFilters = {
  title: string;
  listIn: string;
  dueDate: string;
  priority: string;
  creator: string;
  assignedTo: string;
  status: string;
};

export type CrmTaskRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  title: string;
  description: string;
  list_in_id: number | null;
  priority_id: number;
  status_id: number;
  assigned_user_id: number | null;
  due_date: string | null;
  created_by: string;
  status: Generated<string>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type CrmTaskCommentRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  task_id: number;
  body: string;
  created_by: string;
  status: Generated<string>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type CrmTaskJobRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  task_id: number;
  started_by: string;
  created_by: string;
  started_at: ColumnType<string, string | undefined, string>;
  created_at: ColumnType<string, string | undefined, never>;
  stopped_at: string | null;
  status: Generated<string>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type CrmTaskClosureRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  task_id: number;
  requested_by: string;
  created_by: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type CrmTaskActivityRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  task_id: number;
  event_type: string;
  description: string;
  actor: string;
  created_by: string;
  status: Generated<string>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type TaskDatabase = {
  crm_tasks: CrmTaskRow;
  crm_task_comments: CrmTaskCommentRow;
  crm_task_jobs: CrmTaskJobRow;
  crm_task_closure_requests: CrmTaskClosureRow;
  crm_task_activity: CrmTaskActivityRow;
  crm_enquiry_lists: { id: Generated<number>; name: string; status: string };
  crm_enquiry_statuses: {
    id: Generated<number>;
    name: string;
    code: string;
    status: string;
    sort_order: number;
  };
  crm_enquiry_priorities: {
    id: Generated<number>;
    name: string;
    code: string;
    status: string;
    sort_order: number;
  };
  app_users: { id: Generated<number>; name: string; email: string; status: string };
};
export type TaskContext = {
  database: Kysely<TaskDatabase>;
  actorEmail: string;
  actorUserId: number | null;
  canViewAll: boolean;
  authorize: (permission: string) => Promise<void>;
};
export type TaskRecord = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  listInId: number | null;
  listIn: string | null;
  priorityId: number;
  priority: string;
  priorityName: string;
  statusId: number;
  status: string;
  statusName: string;
  assignedUserId: number | null;
  assignedTo: string | null;
  dueDate: string | null;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  closurePending: boolean;
};
export type TaskInput = {
  title: string;
  description: string;
  listInId: number | null;
  priorityId: number;
  statusId: number;
  assignedUserId: number | null;
  dueDate: string | null;
};
