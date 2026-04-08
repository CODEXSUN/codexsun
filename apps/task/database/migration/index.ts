import { taskFoundationMigration } from "./01-task-foundation.js"
import { taskHeadersMigration } from "./02-task-headers.js"
import { taskEntityLinksMigration } from "./03-task-entity-links.js"
import { taskPerformanceMetricsMigration } from "./04-task-performance-metrics.js"

export const taskDatabaseMigrations = [
  taskFoundationMigration,
  taskHeadersMigration,
  taskEntityLinksMigration,
  taskPerformanceMetricsMigration,
]
