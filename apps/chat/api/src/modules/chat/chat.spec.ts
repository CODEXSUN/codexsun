import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeChannelName,
  normalizeMemberEmails,
  normalizeMessageBody,
  validateAttachmentInput
} from "./chat.repository.js";

test("channel name normalization collapses whitespace", () => {
  assert.equal(normalizeChannelName("  Field   team "), "Field team");
});

test("channel name normalization rejects blank and overlong names", () => {
  assert.throws(() => normalizeChannelName("   "), /name is required/);
  assert.throws(() => normalizeChannelName("x".repeat(121)), /120 characters/);
});

test("message body normalization rejects blank bodies", () => {
  assert.equal(normalizeMessageBody("  hello  "), "hello");
  assert.throws(() => normalizeMessageBody("   "), /body is required/);
});

test("member emails normalize to a unique lowercase list", () => {
  assert.deepEqual(normalizeMemberEmails(["  Ana@x.test ", "ana@X.test", " ", "bob@x.test"]), [
    "ana@x.test",
    "bob@x.test"
  ]);
});

test("attachment validation rejects empty and oversized content", () => {
  const small = validateAttachmentInput({
    base64: Buffer.from("hello").toString("base64"),
    fileName: "note.txt",
    mimeType: "text/plain"
  });
  assert.equal(small.sizeBytes, 5);
  assert.throws(
    () =>
      validateAttachmentInput({
        base64: Buffer.alloc(16 * 1024 * 1024).toString("base64"),
        fileName: "big.bin",
        mimeType: "application/octet-stream"
      }),
    /15 MB/
  );
  assert.throws(
    () => validateAttachmentInput({ base64: "", fileName: "empty.txt", mimeType: "text/plain" }),
    /content is required/
  );
});
