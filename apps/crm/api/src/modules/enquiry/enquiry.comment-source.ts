import { createHash } from "node:crypto";

export function scopedFrappeCommentKey(enquiryId: number, sourceKey: string) {
  return `frappe:${createHash("sha256")
    .update(JSON.stringify([enquiryId, sourceKey]))
    .digest("hex")}`;
}
