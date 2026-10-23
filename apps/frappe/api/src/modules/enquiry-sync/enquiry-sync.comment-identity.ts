import { createHash } from "node:crypto";

export function enquiryCommentRemoteName(baseUrl: string, idempotencyKey: string) {
  return (
    "JOBCOM-CODEXSUN-" +
    createHash("sha256")
      .update(JSON.stringify([new URL(baseUrl).origin, idempotencyKey]))
      .digest("hex")
  );
}
