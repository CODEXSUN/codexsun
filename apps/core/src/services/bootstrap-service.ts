import { bootstrapSnapshotSchema, type BootstrapSnapshot } from "../../shared/index.js"

import { bootstrapSnapshot } from "../data/core-seed.js"

export function getBootstrapSnapshot(): BootstrapSnapshot {
  return bootstrapSnapshotSchema.parse(bootstrapSnapshot)
}
