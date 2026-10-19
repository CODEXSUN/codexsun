import assert from "node:assert/strict";
import { test } from "node:test";
import { applyUserActivityWindow } from "./activities.service.js";
import type { ActivityFilters } from "./activities.types.js";

const now = new Date("2026-10-19T12:00:00.000Z");
const baseFilters: ActivityFilters = {
  page: 1,
  pageSize: 50,
  search: "",
  contact: "",
  enquiry: "",
  allocatedTo: "",
  listIn: "",
  status: "",
  action: "",
  actor: "",
  actorEmail: "agent@example.com",
  actorUserId: 17,
  canViewAll: false
};

test("user activity defaults to the latest seven days", () => {
  const filters = applyUserActivityWindow({ ...baseFilters, scope: "mine" }, now);
  assert.equal(filters.createdAfter, "2026-10-12T12:00:00.000Z");
});

test("user activity requests cannot reach farther back than thirty days", () => {
  const filters = applyUserActivityWindow(
    {
      ...baseFilters,
      scope: "mine",
      createdAfter: "2026-08-01T00:00:00.000Z"
    },
    now
  );
  assert.equal(filters.createdAfter, "2026-09-19T12:00:00.000Z");
});

test("admin visible activity queries keep their requested window", () => {
  const requested: ActivityFilters = {
    ...baseFilters,
    scope: "visible",
    canViewAll: true
  };
  assert.equal(applyUserActivityWindow(requested, now), requested);
});
