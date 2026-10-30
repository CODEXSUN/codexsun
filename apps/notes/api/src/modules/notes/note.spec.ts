import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNoteSavePayload } from "./note.repository.js";

test("note payload normalization collapses whitespace", () => {
  assert.deepEqual(normalizeNoteSavePayload({ body: "  hello  ", title: "  Team   standup " }), {
    body: "hello",
    title: "Team standup"
  });
});

test("note payload normalization rejects blank fields", () => {
  assert.throws(() => normalizeNoteSavePayload({ body: "", title: "Valid" }), /body is required/);
  assert.throws(
    () => normalizeNoteSavePayload({ body: "Valid", title: "   " }),
    /title is required/
  );
});

test("note payload normalization rejects overlong titles", () => {
  assert.throws(
    () => normalizeNoteSavePayload({ body: "Valid", title: "x".repeat(241) }),
    /240 characters/
  );
});
