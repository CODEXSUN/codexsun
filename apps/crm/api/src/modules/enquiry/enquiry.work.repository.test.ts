import assert from "node:assert/strict";
import { test } from "node:test";
import { activityCreatorDisplay } from "./enquiry.work.repository.js";

const importedActivity = {
  action: "created",
  created_by: "system:frappe-live-sync",
  enquiry_source: "frappe",
  source_creator_email: "vijay@example.com",
  source_creator_name: "Vijay Anand",
  activity_creator_name: null
};

test("import-generated creation activity displays the mapped source creator", () => {
  assert.equal(activityCreatorDisplay(importedActivity), "Vijay Anand");
  assert.equal(
    activityCreatorDisplay({ ...importedActivity, source_creator_name: null }),
    "vijay@example.com"
  );
});

test("later Frappe sync updates remain attributed to the sync actor", () => {
  assert.equal(
    activityCreatorDisplay({ ...importedActivity, action: "updated" }),
    "system:frappe-live-sync"
  );
});

test("local activity displays the mapped user's name", () => {
  assert.equal(
    activityCreatorDisplay({
      ...importedActivity,
      action: "comment-added",
      created_by: "vijay@example.com",
      enquiry_source: "manual",
      activity_creator_name: "Vijay Anand"
    }),
    "Vijay Anand"
  );
});
