import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { SchedulerService } from "./scheduler.service.js";
import type { SchedulerRepository } from "./scheduler.repository.js";
import type { SchedulerContext } from "./scheduler.types.js";

function setup(
  options: { permissions?: string[]; source?: { id: number; label: string } | null } = {}
) {
  const authorized: string[] = [];
  const lookedUp: string[] = [];
  const listed: Array<{ view: string; sourceType?: string; sourceId?: number }> = [];
  const repository = {
    list: async (
      _scope: unknown,
      filters: { view: string; sourceType?: string; sourceId?: number }
    ) => {
      listed.push(filters);
      return [];
    },
    reminders: async () => [],
    listSources: async (sourceType: string) => {
      lookedUp.push(sourceType);
      return [];
    },
    findSource: async (sourceType: string) => {
      lookedUp.push(sourceType);
      return Object.hasOwn(options, "source") ? options.source! : { id: 9, label: "Record #9" };
    },
    create: async () => ({ id: 1, notes: "Reminder" }),
    updateStatus: async () => null,
    acknowledge: async () => null
  } as unknown as SchedulerRepository;
  const permissions = new Set(options.permissions ?? []);
  const context = {
    database: {} as SchedulerContext["database"],
    actorEmail: "user@example.test",
    actorUserId: 4,
    authorize: async (permission: string) => {
      authorized.push(permission);
      if (!permissions.has(permission)) throw AppError.forbidden("Denied");
    },
    hasPermission: async (permission: string) => permissions.has(permission)
  } satisfies SchedulerContext;
  return { service: new SchedulerService(repository, context), authorized, lookedUp, listed };
}

test("schedule list forwards source filters for a record tab", async () => {
  const { service, listed } = setup({ permissions: ["crm.schedule.view"] });
  await service.list("schedules", "enquiry", 27);
  assert.deepEqual(listed, [{ view: "schedules", sourceType: "enquiry", sourceId: 27 }]);
});

test("schedule creation checks permission to view the linked source", async () => {
  const { service, lookedUp } = setup({ permissions: ["crm.schedule.create"] });
  await assert.rejects(
    service.create({
      notes: "Follow up",
      sourceType: "enquiry",
      sourceId: 9,
      scheduledAt: "2026-10-21T10:00:00.000Z"
    }),
    (error: unknown) => error instanceof AppError && error.code === "FORBIDDEN"
  );
  assert.deepEqual(lookedUp, []);
});

test("schedule creation rejects invalid notes and dates", async () => {
  const { service, lookedUp } = setup({ permissions: ["crm.schedule.create"] });
  await assert.rejects(
    service.create({
      notes: "Follow up",
      sourceType: "task",
      sourceId: 9,
      scheduledAt: "not-a-date"
    })
  );
  await assert.rejects(
    service.create({
      notes: " ",
      sourceType: "task",
      sourceId: 9,
      scheduledAt: "2026-10-21T09:00:00.000Z"
    })
  );
  await assert.rejects(
    service.create({
      notes: "Follow up",
      sourceType: "task",
      sourceId: 9,
      scheduledAt: "2026-10-21T09:00:00.000Z",
      reminderAt: "2026-10-21T10:00:00.000Z"
    })
  );
  assert.deepEqual(lookedUp, []);
});

test("schedule creation requires the linked CRM source to exist in the permitted scope", async () => {
  const { service } = setup({
    permissions: ["crm.schedule.create", "crm.enquiry.view"],
    source: null
  });
  await assert.rejects(
    service.create({
      notes: "Follow up",
      sourceType: "enquiry",
      sourceId: 999,
      scheduledAt: "2026-10-21T10:00:00.000Z"
    }),
    (error: unknown) => error instanceof AppError && error.code === "NOT_FOUND"
  );
});
