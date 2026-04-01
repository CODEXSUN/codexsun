# Task System

## Purpose

The task app is an operational execution system inside codexsun.

It is no longer a simple todo list.

The current system supports:

- task creation and assignment
- task templates
- task-owned checklists
- milestone grouping
- task audit and insights
- notification-driven attention
- governed workflow transitions
- read-first task records with controlled edit mode

The task app is available under:

- `/admin/dashboard/task`

Primary workspace modules:

- `Task Overview`
- `Tasks`
- `Milestones`
- `Templates`
- `Bulk Generator`
- `Insights`
- `Audit`

Source: [manifest.ts](/E:/Workspace/websites/codexsun/apps/task/domain/src/manifest.ts)

---

## Current Model

The system currently has 4 core layers:

1. `Milestone`
2. `Task`
3. `Task Checklist`
4. `Task Template`

### Milestone

Milestone is the execution context.

A milestone groups related tasks under one broader objective.

Current fields:

- `id`
- `title`
- `description`
- `entityType`
- `entityId`
- `status`
- `dueDate`
- `createdBy`
- `createdAt`
- `updatedAt`
- `taskStats`

Current milestone statuses:

- `active`
- `completed`
- `archived`

Current milestone task rollups:

- `totalTasks`
- `pending`
- `inProgress`
- `review`
- `finalized`
- `overdue`

Source: [milestone.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/milestone.ts)

### Task

Task is the execution unit.

Current task fields:

- `id`
- `title`
- `description`
- `milestoneId`
- `milestoneTitle`
- `status`
- `priority`
- `tags`
- `scopeType`
- `entityType`
- `entityId`
- `entityLabel`
- `templateId`
- `templateName`
- `assigneeId`
- `assigneeName`
- `reviewAssignedTo`
- `reviewAssignedToName`
- `creatorId`
- `creatorName`
- `reviewedBy`
- `reviewedByName`
- `reviewedAt`
- `reviewComment`
- `dueDate`
- `checklistCompletionCount`
- `checklistTotalCount`
- `createdAt`
- `updatedAt`

Task statuses:

- `pending`
- `in_progress`
- `review`
- `finalized`

Task priorities:

- `low`
- `medium`
- `high`
- `urgent`

Task scopes:

- `general`
- `product`
- `invoice`
- `order`
- `customer`
- `user`

Source: [task.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/task.ts)

### Task Checklist

Checklist is task-owned.

This is important:

- checklist is no longer template-authoritative after task creation
- template may seed a checklist
- task owns it after creation

Current checklist item fields:

- `id`
- `label`
- `isRequired`
- `isChecked`
- `checkedBy`
- `checkedByName`
- `checkedAt`
- `note`
- `sortOrder`

Source: [task.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/task.ts)

### Task Template

Template is now a starter/helper layer.

Template does not remain the source of truth after task creation.

It is used for:

- quick-start task creation
- default title
- default description
- default priority
- default tags
- starter checklist
- bulk generation

Current template fields:

- `id`
- `name`
- `scopeType`
- `titleTemplate`
- `descriptionTemplate`
- `defaultPriority`
- `defaultTags`
- `isActive`
- `checklistItemCount`
- `checklistItems`

Source: [task.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/task.ts)

---

## Architectural Rules

### 1. Read-first task records

Task opens first in read mode:

- `/admin/dashboard/task/tasks/:taskId`

Edit is separate:

- `/admin/dashboard/task/tasks/:taskId/edit`

This is intentional.

It supports:

- governance
- audit clarity
- safer review
- fewer accidental edits

### 2. Task checklist is owned by the task

Checklist logic now belongs to the task record, not the template after creation.

That means:

- task checklist can evolve independently
- template edits do not rewrite old tasks
- progress is recorded against the task

### 3. Milestone is the context layer

Task can exist without milestone today, but milestone is the grouping axis for execution.

Milestone now acts as:

- execution context
- grouping container
- progress rollup record

### 4. Wizard is an accelerator, not authority

IFZ Beta task wizard exists only to prefill.

Flow:

- Wizard
- draft handoff
- full form
- create

The form remains the authority.

---

## App Surfaces

## 1. Task Overview

Route:

- `/admin/dashboard/task`

Purpose:

- workspace landing for the task app

## 2. Tasks Workspace

Route:

- `/admin/dashboard/task/tasks`

Purpose:

- execution queue
- personal work view
- open queue
- created by me

Current features:

- `My Tasks`
- `Open Tasks`
- `Created By Me`
- clickable metric cards
- filter by template
- filter by tag
- filter by verification state
- filter by due date range
- milestone filter via query string
- risk badges on task cards

Task card features:

- full-card click-through
- task id
- title
- short description
- assignee name
- creator name
- due date
- priority
- tags
- overdue / stuck / incomplete badges

## 3. Task Detail

Route:

- `/admin/dashboard/task/tasks/:taskId`

Purpose:

- record view
- workflow view
- proof view
- activity/history view

Current sub-tabs:

- `Details`
- `Plan`
- `Activity`
- `Comments`
- `Attachments`
- `Progress`

### Details

Shows:

- task brief
- milestone
- entity
- source template
- status
- priority
- assignee
- reviewer
- creator
- due date
- tags
- verification status
- review metadata

### Plan

Shows:

- task name as objective replacement
- plan steps
- plan notes
- plan attachments
- optional raw plan

Plan is read-only here.

### Activity

Shows:

- status changes
- assignment changes
- review actions
- system activity

### Comments

Shows:

- comment list
- add comment

### Attachments

Current state:

- placeholder surface
- no real task file storage model yet

### Progress

Shows:

- checklist completion state
- checklist items
- completion toggle

Important current rule:

- checklist completion is now controlled here, not in the edit form

## 4. Task Edit Form

Route:

- `/admin/dashboard/task/tasks/:taskId/edit`
- `/admin/dashboard/task/tasks/new`

Purpose:

- controlled mutation surface

Current sections:

- title
- milestone
- short description
- plan editor
- tags
- starter template
- scope
- entity id / label
- task checklist structure
- assignment
- at a glance

### Plan Editor

Current behavior:

- no objective concept in editor UI
- task title acts as objective
- supports steps, notes, attachments
- compact editor in form
- full editor modal
- dynamic `+ Steps`
- adaptive parsing

Current supported structure:

- `## Steps`
- numbered steps like `1.`
- `## Notes`
- `## Attachments`
- `/attach` and `[attach]`

Current editor rules:

- `+ Steps` inserts into the real `## Steps` block
- step numbering continues from existing steps
- empty numbered steps count as real steps
- objective is removed from editor UI

### Checklist in Edit Form

Checklist in the edit form is now structure-only.

It supports:

- add item
- edit label
- edit note
- remove item

It does not support completion toggle anymore.

Completion belongs to `Progress` tab in task detail.

## 5. Templates

Routes:

- `/admin/dashboard/task/templates`
- `/admin/dashboard/task/templates/new`
- `/admin/dashboard/task/templates/:templateId/edit`

Purpose:

- manage reusable starters

Current features:

- template list
- create/edit
- checklist builder
- required toggle
- reorder
- activate/deactivate

Important rule:

- existing tasks keep snapshot checklist
- editing template affects only new tasks

## 6. Bulk Generator

Route:

- `/admin/dashboard/task/bulk`

Purpose:

- create many product-scoped tasks from a starter template under one milestone

Current features:

- active milestone required
- starter template required
- product filters
- category filter
- tag filter
- multi-select products
- assignment mode
- due date
- priority override
- extra tags

Current bulk logic:

- template seeds created tasks
- milestone is required context

## 7. Milestones

Routes:

- `/admin/dashboard/task/milestones`
- `/admin/dashboard/task/milestones/:milestoneId`

Purpose:

- execution grouping
- milestone rollup view

### Milestone List

Current features:

- search
- status filter
- create milestone
- milestone cards
- rollup counts on each milestone

### Milestone Detail

Current features:

- milestone header
- status
- due date
- entity link context
- linked task list
- progress rollups
- create task from milestone context

## 8. Insights

Route:

- `/admin/dashboard/task/insights`

Purpose:

- command view

Current metrics:

- total tasks
- pending
- in progress
- in review
- finalized
- assigned to me
- created by me
- unassigned
- overdue
- due today
- due this week
- stuck
- incomplete verification
- completion rate

Current behavior:

- drill-through into audit

## 9. Audit

Route:

- `/admin/dashboard/task/audit`

Purpose:

- proof-focused operational table

Current audit fields:

- task id
- template
- entity
- assignee
- status
- checklist completion
- due date
- updated at
- overdue
- stuck
- incomplete verification

Current filters:

- template
- assignee
- status
- verification state
- date range
- problem-first sorting

---

## Workflow

## Task creation

Current task creation paths:

1. direct form
2. IFZ Beta wizard -> form
3. product-linked task creation
4. create from template
5. bulk generation

## Task progression

Allowed transitions:

- `pending -> in_progress`
- `in_progress -> review`
- `review -> finalized`
- `review -> in_progress`

Blocked examples:

- `pending -> finalized`
- `in_progress -> finalized`
- `review -> pending`

## Review and finalization

Current review model:

- review owner exists as `reviewAssignedTo`
- only assigned reviewer can finalize
- reject returns task to `in_progress`

## Finalization rules

Current finalization behavior:

- finalized is idempotent
- finalized is permanent
- finalized task becomes immutable

---

## Governance

Governance is enforced in backend, not just UI.

Current rules include:

- valid status transitions only
- no finalization with incomplete checklist
- no template task rule dependency anymore
- milestone id must exist if provided
- reviewer lock on review/finalize
- immutable finalized tasks

Current permission model is minimal:

- admin-like users have wider control
- assignee / creator / reviewer can operate within governed paths

Important current boundary:

- UI still does not hide every invalid action perfectly in all places
- backend is the real enforcer

---

## Automation

The task system includes in-app automation through notifications.

Current notification features:

- assignment notification
- review-requested notification
- due-soon notification
- overdue notification
- bell UI
- mark read
- mark all read
- task-based read clearing
- priority-based ordering
- dedupe keys

Current automation behavior:

- scheduler generates due reminders
- overdue reminders escalate by age
- unread is action-oriented, not just seen-state

Current note:

- grouping/aggregation structure is prepared but not fully enabled as a behavior layer

---

## Intelligence

The task system includes operational visibility.

Current derived signals:

- overdue
- stuck
- incomplete verification
- verification state
- completion rate

Current places where intelligence is visible:

- Insights page
- Audit page
- task workspace cards
- task detail header/status area

---

## Milestone Logic

Current milestone logic is intentionally light.

What is implemented:

- milestone CRUD foundation
- milestone list
- milestone detail
- task rollups
- milestone-aware task filtering
- milestone-aware task creation handoff
- milestone-first bulk generation
- milestone step in wizard

What is not yet implemented:

- dedicated milestone edit page
- milestone lifecycle actions from milestone detail
- milestone progress dashboard on overview
- milestone-based governance enforcement
- milestone notifications

---

## Data Ownership Rules

### Task title

Task title is the primary objective.

### Description

Description is short context.

### Plan

Plan is execution detail.

### Checklist

Checklist is validation/proof.

### Template

Template is a starter, not authority.

### Milestone

Milestone is execution context.

---

## Current UX Decisions

These are intentional:

- read-first task record
- edit as separate mode
- checklist completion in progress tab, not in edit form
- plan editor without objective
- task title as objective
- wizard as helper only
- milestone-first direction for system growth

---

## Current Technical Boundaries

The following are still incomplete or intentionally deferred:

- no real task attachment storage backend
- attachments are still plan references, not full task files
- invoice lookup is weaker than product/user lookup
- milestone edit page not implemented
- milestone status actions not implemented
- milestone overview rollup dashboard not implemented
- some old plan content with objective headings can still be parsed for backward compatibility
- task UI gating can still improve even though backend governance is already strong

---

## Recommended Next Steps

Recommended next sequence:

1. milestone edit page
2. milestone status actions
3. milestone progress widgets on overview
4. milestone-level reporting
5. real task attachment storage
6. stronger role model
7. milestone-driven enforcement

---

## Source References

Primary current references:

- [manifest.ts](/E:/Workspace/websites/codexsun/apps/task/domain/src/manifest.ts)
- [task.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/task.ts)
- [milestone.ts](/E:/Workspace/websites/codexsun/apps/core/shared/src/schemas/milestone.ts)
- [task-form-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-form-page.tsx)
- [task-detail-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-detail-page.tsx)
- [task-workspace-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-workspace-page.tsx)
- [task-template-form-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-template-form-page.tsx)
- [task-bulk-create-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-bulk-create-page.tsx)
- [task-milestone-list-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-milestone-list-page.tsx)
- [task-milestone-detail-page.tsx](/E:/Workspace/websites/codexsun/apps/ecommerce/web/src/features/task/pages/task-milestone-detail-page.tsx)
