export type TaskLookup = {
  id: number;
  name: string;
  code?: string;
  email?: string;
  status?: string;
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
export type TaskPayload = {
  title: string;
  description: string;
  listInId: number | null;
  priorityId: number;
  statusId: number;
  assignedUserId: number | null;
  dueDate: string | null;
};
export type TaskOptions = {
  lists: TaskLookup[];
  statuses: TaskLookup[];
  priorities: TaskLookup[];
  users: TaskLookup[];
  capabilities: {
    create: boolean;
    update: boolean;
    respond: boolean;
    work: boolean;
    reviewClosure: boolean;
  };
};
export type TaskComment = {
  id: number;
  uuid: string;
  taskId: number;
  body: string;
  createdBy: string;
  createdAt: string | Date;
};
export type TaskJob = {
  id: number;
  uuid: string;
  taskId: number;
  startedBy: string;
  startedAt: string | Date;
  stoppedAt: string | Date | null;
  canStop: boolean;
};
export type TaskClosure = {
  id: number;
  uuid: string;
  taskId: number;
  requestedBy: string;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string | Date;
};
export type TaskActivity = {
  id: number;
  uuid: string;
  taskId: number;
  eventType: string;
  description: string;
  actor: string;
  createdAt: string | Date;
};

export type TaskColumnFilters = {
  title?: string;
  listIn?: string;
  dueDate?: string;
  priority?: string;
  creator?: string;
  assignedTo?: string;
  status?: string;
};
