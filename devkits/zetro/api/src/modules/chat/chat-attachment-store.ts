import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { basename } from "node:path";
import type { ModuleStorage } from "@codexsun/platform-core";
import type { ZetroChatAttachment } from "@codexsun/zetro-contracts";

export type MaterializedAttachments = {
  readonly images: string[];
  readonly promptContext: string[];
  dispose(): Promise<void>;
};

export class ChatAttachmentStore {
  constructor(private readonly storage: ModuleStorage) {}

  async materialize(attachments: ZetroChatAttachment[]): Promise<MaterializedAttachments> {
    const directory = `attachments/${randomUUID()}`;
    const images: string[] = [];
    const promptContext: string[] = [];

    try {
      for (const [index, attachment] of attachments.entries()) {
        const filename = `${index}-${safeFilename(attachment.name)}`;
        const relativePath = `${directory}/${filename}`;
        const data = Buffer.from(attachment.content, "base64");
        await this.storage.write("private", relativePath, data);
        const absolutePath = this.storage.pathFor("private", relativePath);

        if (attachment.type.startsWith("image/")) images.push(absolutePath);
        else if (attachment.type.startsWith("text/") || attachment.type === "application/json") {
          promptContext.push(`Attachment ${filename}:\n${data.toString("utf8")}`);
        } else {
          promptContext.push(`Attachment ${filename} was supplied as ${attachment.type}.`);
        }
      }
    } catch (error) {
      await this.remove(directory);
      throw error;
    }

    return {
      images,
      promptContext,
      dispose: async () => this.remove(directory),
    };
  }

  private async remove(directory: string): Promise<void> {
    await rm(this.storage.pathFor("private", directory), { force: true, recursive: true });
  }
}

function safeFilename(name: string): string {
  return basename(name).replace(/[^a-zA-Z0-9._-]/gu, "_") || "attachment";
}
