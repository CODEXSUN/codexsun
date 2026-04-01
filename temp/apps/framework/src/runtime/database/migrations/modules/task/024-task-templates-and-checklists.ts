import { taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskTemplatesAndChecklistsMigration: Migration = {
  id: '024-task-templates-and-checklists',
  name: 'Task templates and checklists',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN scope_type VARCHAR(32) NOT NULL DEFAULT 'general' AFTER tags_json
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN entity_type VARCHAR(32) NULL AFTER scope_type
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN entity_id VARCHAR(64) NULL AFTER entity_type
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN entity_label VARCHAR(255) NULL AFTER entity_id
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN template_id VARCHAR(64) NULL AFTER entity_label
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.templates} (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        scope_type VARCHAR(32) NOT NULL,
        title_template VARCHAR(255) NOT NULL,
        description_template TEXT NULL,
        default_priority VARCHAR(16) NOT NULL DEFAULT 'medium',
        default_tags_json JSON NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_task_templates_scope (scope_type),
        INDEX idx_task_templates_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.templateItems} (
        id VARCHAR(64) PRIMARY KEY,
        template_id VARCHAR(64) NOT NULL,
        label VARCHAR(255) NOT NULL,
        is_required TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_template_items_template FOREIGN KEY (template_id) REFERENCES ${taskTableNames.templates}(id) ON DELETE CASCADE,
        INDEX idx_task_template_items_template (template_id),
        INDEX idx_task_template_items_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.checklistItems} (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        template_item_id VARCHAR(64) NULL,
        label VARCHAR(255) NOT NULL,
        is_required TINYINT(1) NOT NULL DEFAULT 1,
        is_checked TINYINT(1) NOT NULL DEFAULT 0,
        checked_by VARCHAR(64) NULL,
        checked_at DATETIME NULL,
        note TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_checklist_items_task FOREIGN KEY (task_id) REFERENCES ${taskTableNames.tasks}(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_checklist_items_template_item FOREIGN KEY (template_item_id) REFERENCES ${taskTableNames.templateItems}(id) ON DELETE SET NULL,
        INDEX idx_task_checklist_items_task (task_id),
        INDEX idx_task_checklist_items_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      INSERT INTO ${taskTableNames.templates} (
        id,
        name,
        scope_type,
        title_template,
        description_template,
        default_priority,
        default_tags_json,
        is_active
      )
      SELECT
        'task-template:verify-product-price',
        'Verify Product Price',
        'product',
        'Verify product price update',
        'Open the product, validate the current price values, and confirm the price update is correct before finalizing.',
        'high',
        JSON_ARRAY('product', 'price', 'verification'),
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM ${taskTableNames.templates} WHERE id = 'task-template:verify-product-price'
      )
    `)

    const defaultChecklist = [
      ['task-template-item:verify-product-price-open-record', 'Opened the product record', 1, 0],
      ['task-template-item:verify-product-price-selling', 'Checked selling price', 1, 1],
      ['task-template-item:verify-product-price-mrp', 'Checked MRP', 1, 2],
      ['task-template-item:verify-product-price-discount', 'Checked discount or promotional price if applicable', 0, 3],
      ['task-template-item:verify-product-price-save', 'Saved and re-verified the product price', 1, 4],
    ] as const

    for (const [id, label, isRequired, sortOrder] of defaultChecklist) {
      await db.execute(
        `
          INSERT INTO ${taskTableNames.templateItems} (
            id,
            template_id,
            label,
            is_required,
            sort_order
          )
          SELECT ?, 'task-template:verify-product-price', ?, ?, ?
          WHERE NOT EXISTS (
            SELECT 1 FROM ${taskTableNames.templateItems} WHERE id = ?
          )
        `,
        [id, label, isRequired, sortOrder, id],
      )
    }
  },
}


