import { createHash } from "node:crypto";
import { deliveryPayloadSchema, deliverySnapshotSchema } from "./publication.schema.js";

export function publicationChecksum(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(deliveryPayloadSchema.parse(value)))
    .digest("hex");
}
export function verifyPublication(value: unknown) {
  const snapshot = deliverySnapshotSchema.parse(value);
  const { sequence: _sequence, publishedAt: _publishedAt, checksum, ...payload } = snapshot;
  if (publicationChecksum(payload) !== checksum)
    throw new Error("Publication checksum does not match its content.");
  return snapshot;
}
