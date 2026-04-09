# Task Manager Planning (Phase 4)

This document outlines the architectural plan and execution strategy for expanding the Task Management application. It encapsulates workflows for cross-app connections, routine automation, and Kanban board management.

---

## 1. Kanban Board & Drag-and-Drop Implementation
To support robust, visual workflow management, the task architecture requires dynamic stages and positional sorting:

- [x] 1.0 **Frontend Dependencies**: Run `npm install @dnd-kit/core @dnd-kit/react @dnd-kit/sortable @dnd-kit/utilities` to install the dnd-kit packages required for building the drag-and-drop mechanics natively.
- [x] 1.1 **`task_board_stages` Store**: Build a JSON store designed to manage custom columns (e.g., *To Do*, *Design*, *In Progress*, *Testing*, *Done*) to avoid hard-coding rigid statuses across different teams.
- [x] 1.2 **Fractional Indexing (`board_position`)**: Setup tasks to require a `REAL` (decimal) value to natively manage drag-and-drop mechanics smoothly, ensuring collision-free sorting within Kanban columns.
- [x] 1.3 **Stage Linking (`board_stage_id`)**: Route tasks actively into specific visual columns natively.

## 2. "Random Templates" & Dynamic Job Orchestration
Instead of hardcoding workflows or using static checklists, the system introduces a reusable template engine:

- [x] 2.1 **`task_templates` Store**: Create logic holding predefined checklist and workflow steps (e.g., "Verify SEO Steps", "Print Invoice Processing", "MRP Check Sequence").
- [x] 2.2 **Dynamic Instantiation**: Allow users to instantly instantiate these configurations to stamp out a living Task object, saving significant manual labor while standardizing processes across the enterprise tools.

## 3. Cross-Module Attachments (Universal Jobs)
Tasks represent universal, agnostic "jobs" that can anchor to any other module without creating rigid physical database dependencies.

- [x] 3.1 **Polymorphic Routing**: Using `entity_type` (e.g., `billing_sales_invoice`, `ecommerce_product`) and `entity_id`, structurally anchor a task to external records. 
- [x] 3.2 **Many-to-Many Linking (`task_entity_links`)**: Provide the flexibility to link a massive macro-job (e.g., "Review Q3 Catalog Updates") to dozens of independent entity models precisely via a pivot table.
- [x] 3.3 **Contextual UI Binding**: When looking at an invoice in Billing, dynamically query task headers using the invoice's `entity_id` to render pending "Jobs" strictly inside the invoice view.

## 4. Work Routines & Performance Tracking
- [x] 4.1 **Automated Checkpoints (`task_routines`)**: Capture standard operating procedures and auto-assign duties per scheduled intervals.
- [x] 4.2 **Analytical Metrics (`task_performance_metrics`)**: Setup an immutable ledger tracking stage transition speeds, overdue counts, and checkpoint failure rates, effectively grading user execution passively as the tasks transit across the Kanban boards.
