import type { ColumnType, Generated, Kysely } from "kysely";

export const scheduleSourceTypes = ["enquiry", "task", "call-log", "duty", "sop"] as const;
export type ScheduleSourceType = (typeof scheduleSourceTypes)[number];
export type ScheduleStatus = "scheduled" | "completed" | "cancelled";

export type CrmScheduleRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  title: string;
  details: string;
  notes: string;
  source_type: ScheduleSourceType;
  source_id: number;
  source_label: string;
  scheduled_at: ColumnType<string, string, string>;
  reminder_at: ColumnType<string, string, string>;
  acknowledged_at: ColumnType<string | null, string | null | undefined, string | null>;
  status: ScheduleStatus;
  assigned_user_id: number;
  created_by: string;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};

export type SchedulerDatabase = {
  crm_schedules: CrmScheduleRow;
  app_users: {
    id: Generated<number>;
    name: string;
    email: string;
    status: string;
  };
};

export type ScheduleDatabase = Kysely<SchedulerDatabase>;

export type SchedulerContext = {
  database: ScheduleDatabase;
  actorEmail: string;
  actorUserId: number;
  authorize: (permission: string) => Promise<void>;
  hasPermission: (permission: string) => Promise<boolean>;
};

export type ScheduleInput = {
  notes: string;
  sourceType: ScheduleSourceType;
  sourceId: number;
  scheduledAt: string;
  reminderAt?: string;
};

export type ScheduleRecord = {
  id: number;
  uuid: string;
  notes: string;
  title: string;
  details: string;
  sourceType: ScheduleSourceType;
  sourceId: number;
  sourceLabel: string;
  scheduledAt: string;
  reminderAt: string;
  acknowledgedAt: string | null;
  status: ScheduleStatus;
  assignedUserId: number;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
};

export type ScheduleSourceOption = {
  id: number;
  label: string;
};
