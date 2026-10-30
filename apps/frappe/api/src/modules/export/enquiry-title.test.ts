import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFrappeEnquiryTitle } from "./enquiry-title.js";

test("normalizes Quill title markup to readable text", () => {
  assert.equal(
    normalizeFrappeEnquiryTitle(
      '<div class="ql-editor read-mode"><p>Want to change laptop full panel<br>DELL DC 15250</p></div>'
    ),
    "Want to change laptop full panel DELL DC 15250"
  );
});

test("decodes text entities and removes active or formatting markup", () => {
  assert.equal(
    normalizeFrappeEnquiryTitle(
      "<p>Monitor &amp; keyboard</p><script>bad()</script><strong>needed</strong>"
    ),
    "Monitor & keyboard needed"
  );
});

test("collapses whitespace and respects the Frappe title limit", () => {
  assert.equal(normalizeFrappeEnquiryTitle("  <p>One</p>\n<p>Two</p> "), "One Two");
  assert.equal(normalizeFrappeEnquiryTitle(`<p>${"a".repeat(254)}😀z</p>`), "a".repeat(254) + "😀");
});
