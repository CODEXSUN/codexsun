import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { StorageProvider } from "@codexsun/platform-core";
import { ChatAttachmentStore } from "../chat-attachment-store.js";

test("stores attachments in the private Zetro chat namespace and removes them", async () => {
  const root = await mkdtemp(join(tmpdir(), "zetro-storage-"));
  const store = new ChatAttachmentStore(new StorageProvider(root).forModule("zetro", "chat"));

  try {
    const attachment = await store.materialize([
      { name: "notes.txt", type: "text/plain", content: Buffer.from("Keep the scope focused.").toString("base64") },
    ]);

    assert.deepEqual(attachment.promptContext, ["Attachment 0-notes.txt:\nKeep the scope focused."]);
    await attachment.dispose();
    const attachmentsPath = join(root, "private", "zetro", "chat", "attachments");
    assert.equal(existsSync(attachmentsPath), true);
    assert.deepEqual(await readdir(attachmentsPath), []);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
