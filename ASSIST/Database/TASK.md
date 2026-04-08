# Database Table Structure

This document serves as the canonical reference for the Task Management app foundation tables. It is designed to support the next implementation of enterprise task workflows, covering daily duties, module attachments, and performance tracking across ERP, eCommerce, and Development boundaries.

---

## 1. Domain JSON Stores

### `task_boards`
> JSON store grouping tasks into high-level collections (e.g., Roadmaps, Queues, Random Ideas).

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `task_board_stages`
> JSON store defining the customizable columns/stages for Kanban boards. Allows mapping stages to global status keys.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `task_labels`
> JSON store for global and board-specific tags and visual labels.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `task_routines`
> JSON store for auto-assigning duties, recurring daily checklists, and daily checkpoint templates.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `task_templates`
> JSON store mapping "random templates" (e.g., Print Invoice checklist, MRP Price Check sequence, Verify SEO steps). These can be instantly instantiated and attached as jobs to any module entity.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `tasks`
> JSON store holding the primary rich payload of tasks, including extensive Markdown descriptions, complex checklist states, file attachments, and historical comments.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 2. Normalized Transaction & Index Tables

### `task_headers`
> Highly normalized index table for fast, relational filtering of tasks. Supports CRUD visibility, assignment queries, status tracking, and module connections.

- `task_id` VARCHAR(191) PRIMARY KEY
- `title` VARCHAR(255) NOT NULL
- `board_id` VARCHAR(191) NULL               -- Link to active roadmap/queue board
- `board_stage_id` VARCHAR(191) NULL         -- The active Kanban column/stage
- `board_position` REAL NULL                 -- Fractional index for custom drag-and-drop sorting
- `status_key` VARCHAR(64) NOT NULL           -- e.g., 'todo', 'in_progress', 'review', 'done'
- `priority` VARCHAR(40) NOT NULL             -- e.g., 'low', 'medium', 'high', 'urgent'
- `visibility` VARCHAR(40) NOT NULL           -- 'public', 'private', 'team'
- `creator_user_id` VARCHAR(191) NOT NULL     -- To filter "my creation"
- `assignee_user_id` VARCHAR(191) NULL        -- To filter "my task"
- `entity_type` VARCHAR(120) NULL             -- Polymorphic connection (e.g., 'invoice', 'product', 'customer')
- `entity_id` VARCHAR(191) NULL               -- Target model ID (to attach task directly to CRM/Billing models)
- `due_at` VARCHAR(40) NULL                   -- Reminders or deadlines
- `started_at` VARCHAR(40) NULL
- `completed_at` VARCHAR(40) NULL
- `deleted_at` VARCHAR(40) NULL               -- Soft delete for "restore" operations
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `task_entity_links`
> Relational pivot table allowing a single task to be attached to MULTIPLE modules or models simultaneously (e.g., linking a "Verify SEO" task to 5 different eCommerce products).

- `link_id` VARCHAR(191) PRIMARY KEY
- `task_id` VARCHAR(191) NOT NULL
- `entity_type` VARCHAR(120) NOT NULL         -- e.g., 'sales_invoice', 'support_ticket'
- `entity_id` VARCHAR(191) NOT NULL
- `created_at` VARCHAR(40) NOT NULL

<br>

### `task_performance_metrics`
> Dedicated analytical table measuring completion speeds, stage transition times, and checkpoint compliance per user for reporting.

- `metric_id` VARCHAR(191) PRIMARY KEY
- `user_id` VARCHAR(191) NOT NULL
- `task_id` VARCHAR(191) NOT NULL
- `routine_id` VARCHAR(191) NULL              -- Links back if it was an auto-assigned duty
- `assignment_date` VARCHAR(40) NOT NULL
- `time_to_completion_seconds` INTEGER NULL
- `overdue_by_seconds` INTEGER NULL
- `checkpoints_passed` INTEGER NOT NULL DEFAULT 0
- `checkpoints_failed` INTEGER NOT NULL DEFAULT 0
- `created_at` VARCHAR(40) NOT NULL
