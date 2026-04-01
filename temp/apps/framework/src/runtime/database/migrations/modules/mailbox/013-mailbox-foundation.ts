import { mailboxTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

const customerRegistrationOtpTemplateId = 'mailbox-template-customer-registration-otp'

export const mailboxFoundationMigration: Migration = {
  id: '013-mailbox-foundation',
  name: 'Mailbox messages and templates',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mailboxTableNames.templates} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(120) NOT NULL,
        name VARCHAR(160) NOT NULL,
        category VARCHAR(64) NOT NULL,
        description TEXT NULL,
        subject_template VARCHAR(255) NOT NULL,
        html_template LONGTEXT NULL,
        text_template LONGTEXT NULL,
        sample_data JSON NULL,
        is_system TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_mailbox_templates_code (code),
        KEY idx_mailbox_templates_category (category),
        KEY idx_mailbox_templates_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mailboxTableNames.messages} (
        id VARCHAR(64) PRIMARY KEY,
        template_id VARCHAR(64) NULL,
        template_code VARCHAR(120) NULL,
        reference_type VARCHAR(120) NULL,
        reference_id VARCHAR(120) NULL,
        subject VARCHAR(255) NOT NULL,
        html_body LONGTEXT NULL,
        text_body LONGTEXT NULL,
        from_email VARCHAR(320) NOT NULL,
        from_name VARCHAR(160) NULL,
        reply_to VARCHAR(320) NULL,
        status VARCHAR(24) NOT NULL,
        provider VARCHAR(64) NULL,
        provider_message_id VARCHAR(255) NULL,
        error_message TEXT NULL,
        metadata_json JSON NULL,
        sent_at DATETIME NULL,
        failed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_mailbox_messages_status (status),
        KEY idx_mailbox_messages_created_at (created_at),
        KEY idx_mailbox_messages_reference (reference_type, reference_id),
        KEY idx_mailbox_messages_template_code (template_code),
        CONSTRAINT fk_mailbox_messages_template
          FOREIGN KEY (template_id) REFERENCES ${mailboxTableNames.templates}(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mailboxTableNames.recipients} (
        id VARCHAR(64) PRIMARY KEY,
        message_id VARCHAR(64) NOT NULL,
        recipient_type VARCHAR(8) NOT NULL,
        email VARCHAR(320) NOT NULL,
        name VARCHAR(160) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_mailbox_message_recipients_message (message_id),
        KEY idx_mailbox_message_recipients_email (email),
        CONSTRAINT fk_mailbox_message_recipients_message
          FOREIGN KEY (message_id) REFERENCES ${mailboxTableNames.messages}(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(
      `
        INSERT INTO ${mailboxTableNames.templates} (
          id,
          code,
          name,
          category,
          description,
          subject_template,
          html_template,
          text_template,
          sample_data,
          is_system,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          description = VALUES(description),
          subject_template = VALUES(subject_template),
          html_template = VALUES(html_template),
          text_template = VALUES(text_template),
          sample_data = VALUES(sample_data),
          is_system = VALUES(is_system),
          is_active = VALUES(is_active)
      `,
      [
        customerRegistrationOtpTemplateId,
        'customer_registration_otp',
        'Customer Registration OTP',
        'Authentication',
        'OTP mail used during storefront customer registration.',
        'Your verification code for {{brandName}}',
        `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827"><p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">{{otp}}</p><p>This code expires in {{expiryMinutes}} minutes.</p></div>`,
        'Your verification code is {{otp}}. It expires in {{expiryMinutes}} minutes.',
        JSON.stringify({ brandName: 'codexsun', otp: '123456', expiryMinutes: 10 }),
        1,
        1,
      ],
    )
  },
}


