import { taskFoundationMigration } from './022-task-foundation'
import { taskPriorityTagsMigration } from './023-task-priority-tags'
import { taskTemplatesAndChecklistsMigration } from './024-task-templates-and-checklists'
import { taskReviewGovernanceMigration } from './027-task-review-governance'
import { taskReviewAssignmentMigration } from './028-task-review-assignment'
import { milestoneFoundationMigration } from './029-milestone-foundation'
import { taskIndependenceMigration } from './030-task-independence'
import { taskGroupFoundationMigration } from './031-task-group-foundation'
import { defineMigrationModule } from '../../migration'

export const taskMigrationModule = defineMigrationModule('task', 'Task', [
  taskFoundationMigration,
  taskPriorityTagsMigration,
  taskTemplatesAndChecklistsMigration,
  taskReviewGovernanceMigration,
  taskReviewAssignmentMigration,
  milestoneFoundationMigration,
  taskIndependenceMigration,
  taskGroupFoundationMigration,
])

