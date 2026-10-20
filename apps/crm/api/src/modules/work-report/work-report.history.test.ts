import assert from "node:assert/strict";
import { test } from "node:test";
import { historyActorDisplay } from "./work-report.history.js";

const importedHistory = {
  action: "created",
  created_by: "system:frappe-live-sync",
  enquiry_source: "frappe",
  source_creator_email: "vijay@example.com",
  source_creator_name: "Vijay Anand",
  activity_creator_name: null
};

test("work history displays the source creator for imported creation and comment events", () => {
  assert.equal(historyActorDisplay(importedHistory), "Vijay Anand");
  assert.equal(historyActorDisplay({ ...importedHistory, action: "comment-added" }), "Vijay Anand");
});

test("work history keeps sync updates and local comments attributed to their actual actors", () => {
  assert.equal(
    historyActorDisplay({ ...importedHistory, action: "updated" }),
    "system:frappe-live-sync"
  );
  assert.equal(
    historyActorDisplay({
      ...importedHistory,
      action: "comment-added",
      created_by: "vijay@example.com",
      activity_creator_name: "Vijay Anand"
    }),
    "Vijay Anand"
  );
});
