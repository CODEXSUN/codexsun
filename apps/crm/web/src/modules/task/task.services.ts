import { crmRequest } from "../../crm-request";
import type {
  TaskActivity,
  TaskClosure,
  TaskColumnFilters,
  TaskComment,
  TaskJob,
  TaskOptions,
  TaskPayload,
  TaskRecord
} from "./task.types";
export const getTaskActivity = (id: number) =>
  crmRequest<TaskActivity[]>(`/crm/tasks/${id}/activity`);
export const updateTaskProperties = (
  id: number,
  patch: {
    listInId?: number | null;
    priorityId?: number;
    statusId?: number;
    dueDate?: string | null;
  }
) =>
  crmRequest<TaskRecord>(`/crm/tasks/${id}/properties`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
export const listTasks = (
  search: string,
  page: number,
  pageSize: number,
  filter: string,
  columnFilters: TaskColumnFilters
) =>
  crmRequest<{ items: TaskRecord[]; total: number }>(
    `/crm/tasks?${new URLSearchParams({
      search,
      page: String(page),
      pageSize: String(pageSize),
      filter,
      title: columnFilters.title ?? "",
      listIn: columnFilters.listIn ?? "",
      dueDate: columnFilters.dueDate ?? "",
      priority: columnFilters.priority ?? "",
      creator: columnFilters.creator ?? "",
      assignedTo: columnFilters.assignedTo ?? "",
      status: columnFilters.status ?? ""
    }).toString()}`
  );
export const getTask = (id: number) => crmRequest<TaskRecord>(`/crm/tasks/${id}`);
export const getTaskOptions = () => crmRequest<TaskOptions>("/crm/tasks/options");
export const createTask = (payload: TaskPayload) =>
  crmRequest<TaskRecord>("/crm/tasks", { method: "POST", body: JSON.stringify(payload) });
export const updateTask = (id: number, payload: TaskPayload) =>
  crmRequest<TaskRecord>(`/crm/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const getTaskComments = (id: number) =>
  crmRequest<TaskComment[]>(`/crm/tasks/${id}/comments`);
export const addTaskComment = (id: number, body: string) =>
  crmRequest<TaskComment>(`/crm/tasks/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
export const getTaskJobs = (id: number) => crmRequest<TaskJob[]>(`/crm/tasks/${id}/jobs`);
export const startTaskJob = (id: number) =>
  crmRequest<TaskJob>(`/crm/tasks/${id}/jobs/start`, { method: "POST" });
export const stopTaskJob = (id: number) =>
  crmRequest<{ stopped: boolean }>(`/crm/tasks/${id}/jobs/stop`, { method: "POST" });
export const getTaskClosures = (id: number) =>
  crmRequest<TaskClosure[]>(`/crm/tasks/${id}/closure-requests`);
export const requestTaskClosure = (id: number, reason: string) =>
  crmRequest<TaskClosure>(`/crm/tasks/${id}/closure-requests`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
export const reviewTaskClosure = (id: number, decision: "approved" | "rejected", note = "") =>
  crmRequest<{ reviewed: boolean }>(`/crm/tasks/closure-requests/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note })
  });
