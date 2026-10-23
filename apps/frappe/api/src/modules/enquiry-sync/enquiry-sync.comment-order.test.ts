import assert from "node:assert/strict";
import { test } from "node:test";
import { orderEnquiryJobComments } from "./enquiry-sync.comment-order.js";

test("reply parents import first even when remote creation order is inconsistent", () => {
  const ordered = orderEnquiryJobComments([
    { name: "reply", parent_comment: "parent" },
    { name: "parent" }
  ]);
  assert.deepEqual(
    ordered.map((comment) => comment.name),
    ["parent", "reply"]
  );
});

test("cyclic remote reply links block the import instead of dropping the relationship", () => {
  assert.throws(
    () =>
      orderEnquiryJobComments([
        { name: "a", parent_comment: "b" },
        { name: "b", parent_comment: "a" }
      ]),
    /cycle/
  );
});
