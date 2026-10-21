import assert from "node:assert/strict";
import { test } from "node:test";
import { TaskService } from "./task.service.js";
import type { TaskRepository } from "./task.repository.js";
import type { TaskContext, TaskRecord } from "./task.types.js";

const task: TaskRecord = {
  contactId: null,
  contactName: null,
  contactPhone: null,
  id: 7,
  uuid: "12345678",
  title: "Prepare customer visit",
  description: "",
  listInId: 1,
  listIn: "Sales",
  priorityId: 1,
  priority: "normal",
  priorityName: "Normal",
  statusId: 1,
  status: "new",
  statusName: "New",
  assignedUserId: 2,
  assignedTo: "Assignee",
  dueDate: null,
  createdBy: "manager@example.com",
  creatorName: "Manager",
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
  closurePending: false
};

function context(actorEmail = "manager@example.com"): TaskContext {
  return {
    database: {} as TaskContext["database"],
    actorEmail,
    actorUserId: actorEmail === "assignee@example.com" ? 2 : 1,
    canViewAll: false,
    authorize: async () => undefined
  };
}

test("only a task creator, assignee, or manager can edit a task", async () => {
  let saved = false;
  const repository = {
    get: async () => task,
    save: async () => {
      saved = true;
      return task.id;
    }
  } as unknown as TaskRepository;
  const service = new TaskService(repository, context("outside@example.com"));

  await assert.rejects(
    service.save(
      {
        title: "Changed title",
        description: "",
        listInId: 1,
        priorityId: 1,
        statusId: 1,
        assignedUserId: 2,
        dueDate: null
      },
      task.id
    ),
    /Only the task creator, assignee, or a CRM task manager/i
  );
  assert.equal(saved, false);
});

test("direct task status changes cannot bypass closure approval", async () => {
  let saved = false;
  const repository = {
    save: async () => {
      saved = true;
      return task.id;
    },
    patchProperties: async () => {
      saved = true;
    },
    get: async () => task
  } as unknown as TaskRepository;
  const service = new TaskService(repository, context(), {
    list: async () => ({ id: 1 }),
    priority: async () => ({ id: 1 }),
    status: async () => ({ code: "closed" })
  });
  const input = {
    title: task.title,
    description: "",
    listInId: 1,
    priorityId: 1,
    statusId: 1,
    assignedUserId: 2,
    dueDate: null
  };

  await assert.rejects(service.save({ ...input, assignedUserId: 1 }), /approved closure request/i);
  await assert.rejects(
    service.updateProperties(task.id, { statusId: 1 }),
    /approved closure request/i
  );
  assert.equal(saved, false);
});

test("property edits reject inactive task assignees", async () => {
  let saved = false;
  const repository = {
    get: async () => task,
    patchProperties: async () => {
      saved = true;
    }
  } as unknown as TaskRepository;
  const database = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          where: () => ({ executeTakeFirst: async () => undefined })
        })
      })
    })
  } as unknown as TaskContext["database"];
  const service = new TaskService(repository, { ...context(), database, canViewAll: true });

  await assert.rejects(
    service.updateProperties(task.id, { assignedUserId: 8 }),
    /Select an active assignee/i
  );
  assert.equal(saved, false);
});

test("non-admin task assignees cannot be replaced through properties or save", async () => {
  let saved = false;
  const repository = {
    get: async () => task,
    save: async () => {
      saved = true;
      return task.id;
    },
    patchProperties: async () => {
      saved = true;
    }
  } as unknown as TaskRepository;
  const service = new TaskService(repository, context());
  await assert.rejects(
    service.updateProperties(task.id, { assignedUserId: 8 }),
    /Only a task administrator/
  );
  await assert.rejects(
    service.updateProperties(task.id, { assignedUserId: null }),
    /Only a task administrator/
  );
  await assert.rejects(
    service.save(
      {
        title: task.title,
        description: "",
        listInId: 1,
        priorityId: 1,
        statusId: 1,
        assignedUserId: 8,
        dueDate: null
      },
      task.id
    ),
    /Only a task administrator/
  );
  assert.equal(saved, false);
});
