import type {
  MailboxMessage,
  MailboxMessageStatus,
  MailboxMessageSummary,
  MailboxRecipient,
  MailboxRecipientInput,
  MailboxRecipientType,
  MailboxTemplate,
  MailboxTemplateSummary,
  MailboxTemplateUpsertPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { mailboxTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface MailboxTemplateRow extends RowDataPacket {
  id: string
  code: string
  name: string
  category: string
  description: string | null
  subject_template: string
  html_template: string | null
  text_template: string | null
  sample_data: string | null
  is_system: number
  is_active: number
  created_at: Date
  updated_at: Date
}

interface MailboxMessageRow extends RowDataPacket {
  id: string
  template_id: string | null
  template_code: string | null
  reference_type: string | null
  reference_id: string | null
  subject: string
  html_body: string | null
  text_body: string | null
  from_email: string
  from_name: string | null
  reply_to: string | null
  status: MailboxMessageStatus
  provider: string | null
  provider_message_id: string | null
  error_message: string | null
  metadata_json: string | null
  sent_at: Date | null
  failed_at: Date | null
  created_at: Date
  updated_at: Date
  recipient_summary?: string | null
  recipient_count?: number
}

interface MailboxRecipientRow extends RowDataPacket {
  id: string
  message_id: string
  recipient_type: MailboxRecipientType
  email: string
  name: string | null
  created_at: Date
}

function toTimestamp(value: Date | null) {
  return value ? value.toISOString() : null
}

function parseJsonRecord(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

function toTemplateSummary(row: MailboxTemplateRow): MailboxTemplateSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    subjectTemplate: row.subject_template,
    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function toTemplate(row: MailboxTemplateRow): MailboxTemplate {
  return {
    ...toTemplateSummary(row),
    htmlTemplate: row.html_template,
    textTemplate: row.text_template,
    sampleData: parseJsonRecord(row.sample_data),
  }
}

function toRecipient(row: MailboxRecipientRow): MailboxRecipient {
  return {
    id: row.id,
    messageId: row.message_id,
    recipientType: row.recipient_type,
    email: row.email,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  }
}

function toMessageSummary(row: MailboxMessageRow): MailboxMessageSummary {
  return {
    id: row.id,
    subject: row.subject,
    templateCode: row.template_code,
    fromEmail: row.from_email,
    fromName: row.from_name,
    recipientSummary: row.recipient_summary?.trim() || '-',
    recipientCount: Number(row.recipient_count ?? 0),
    status: row.status,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    errorMessage: row.error_message,
    sentAt: toTimestamp(row.sent_at),
    failedAt: toTimestamp(row.failed_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function toMessage(row: MailboxMessageRow, recipients: MailboxRecipient[]): MailboxMessage {
  return {
    ...toMessageSummary({
      ...row,
      recipient_summary: recipients.filter((entry) => entry.recipientType === 'to').map((entry) => entry.email).join(', '),
      recipient_count: recipients.length,
    }),
    replyTo: row.reply_to,
    htmlBody: row.html_body,
    textBody: row.text_body,
    metadata: parseJsonRecord(row.metadata_json),
    recipients,
  }
}

export class MailboxRepository {
  async listMessages() {
    await ensureDatabaseSchema()

    const rows = await db.query<MailboxMessageRow>(`
      SELECT
        m.id,
        m.template_id,
        m.template_code,
        m.reference_type,
        m.reference_id,
        m.subject,
        m.html_body,
        m.text_body,
        m.from_email,
        m.from_name,
        m.reply_to,
        m.status,
        m.provider,
        m.provider_message_id,
        m.error_message,
        m.metadata_json,
        m.sent_at,
        m.failed_at,
        m.created_at,
        m.updated_at,
        COALESCE(GROUP_CONCAT(CASE WHEN r.recipient_type = 'to' THEN r.email END ORDER BY r.created_at SEPARATOR ', '), '') AS recipient_summary,
        COUNT(r.id) AS recipient_count
      FROM ${mailboxTableNames.messages} m
      LEFT JOIN ${mailboxTableNames.recipients} r ON r.message_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `)

    return rows.map(toMessageSummary)
  }

  async findMessageById(id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<MailboxMessageRow>(`
      SELECT
        id,
        template_id,
        template_code,
        reference_type,
        reference_id,
        subject,
        html_body,
        text_body,
        from_email,
        from_name,
        reply_to,
        status,
        provider,
        provider_message_id,
        error_message,
        metadata_json,
        sent_at,
        failed_at,
        created_at,
        updated_at
      FROM ${mailboxTableNames.messages}
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (!row) {
      return null
    }

    const recipientRows = await db.query<MailboxRecipientRow>(`
      SELECT id, message_id, recipient_type, email, name, created_at
      FROM ${mailboxTableNames.recipients}
      WHERE message_id = ?
      ORDER BY FIELD(recipient_type, 'to', 'cc', 'bcc'), created_at
    `, [id])

    return toMessage(row, recipientRows.map(toRecipient))
  }

  async listTemplates(includeInactive = true) {
    await ensureDatabaseSchema()

    const rows = await db.query<MailboxTemplateRow>(`
      SELECT
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
        is_active,
        created_at,
        updated_at
      FROM ${mailboxTableNames.templates}
      ${includeInactive ? '' : 'WHERE is_active = 1'}
      ORDER BY updated_at DESC, name ASC
    `)

    return rows.map(toTemplateSummary)
  }

  async findTemplateById(id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<MailboxTemplateRow>(`
      SELECT
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
        is_active,
        created_at,
        updated_at
      FROM ${mailboxTableNames.templates}
      WHERE id = ?
      LIMIT 1
    `, [id])

    return row ? toTemplate(row) : null
  }

  async findTemplateByCode(code: string) {
    await ensureDatabaseSchema()

    const row = await db.first<MailboxTemplateRow>(`
      SELECT
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
        is_active,
        created_at,
        updated_at
      FROM ${mailboxTableNames.templates}
      WHERE code = ?
      LIMIT 1
    `, [code])

    return row ? toTemplate(row) : null
  }

  async createTemplate(payload: MailboxTemplateUpsertPayload) {
    await ensureDatabaseSchema()

    const id = randomUUID()
    await db.execute(
      `
        INSERT INTO ${mailboxTableNames.templates} (
          id, code, name, category, description, subject_template, html_template, text_template, sample_data, is_system, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        payload.code,
        payload.name,
        payload.category,
        payload.description,
        payload.subjectTemplate,
        payload.htmlTemplate,
        payload.textTemplate,
        payload.sampleData ? JSON.stringify(payload.sampleData) : null,
        payload.isSystem,
        payload.isActive,
      ],
    )

    const template = await this.findTemplateById(id)
    if (!template) {
      throw new Error('Expected created mailbox template to be retrievable.')
    }

    return template
  }

  async updateTemplate(id: string, payload: MailboxTemplateUpsertPayload) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `
        UPDATE ${mailboxTableNames.templates}
        SET code = ?, name = ?, category = ?, description = ?, subject_template = ?, html_template = ?, text_template = ?, sample_data = ?, is_system = ?, is_active = ?
        WHERE id = ?
      `,
      [
        payload.code,
        payload.name,
        payload.category,
        payload.description,
        payload.subjectTemplate,
        payload.htmlTemplate,
        payload.textTemplate,
        payload.sampleData ? JSON.stringify(payload.sampleData) : null,
        payload.isSystem,
        payload.isActive,
        id,
      ],
    )

    if ((result).affectedRows === 0) {
      throw new ApplicationError('Mailbox template not found.', { id }, 404)
    }

    const template = await this.findTemplateById(id)
    if (!template) {
      throw new Error('Expected updated mailbox template to be retrievable.')
    }

    return template
  }

  async setTemplateActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `UPDATE ${mailboxTableNames.templates} SET is_active = ? WHERE id = ?`,
      [isActive, id],
    )

    if ((result).affectedRows === 0) {
      throw new ApplicationError('Mailbox template not found.', { id }, 404)
    }

    const template = await this.findTemplateById(id)
    if (!template) {
      throw new Error('Expected mailbox template to be retrievable.')
    }

    return template
  }

  async createMessage(input: {
    templateId?: string | null
    templateCode?: string | null
    referenceType?: string | null
    referenceId?: string | null
    subject: string
    htmlBody?: string | null
    textBody?: string | null
    fromEmail: string
    fromName?: string | null
    replyTo?: string | null
    status: MailboxMessageStatus
    provider?: string | null
    metadata?: Record<string, unknown> | null
    recipients: Array<MailboxRecipientInput & { recipientType: MailboxRecipientType }>
  }) {
    await ensureDatabaseSchema()

    const id = randomUUID()
    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${mailboxTableNames.messages} (
            id, template_id, template_code, reference_type, reference_id, subject, html_body, text_body, from_email, from_name, reply_to, status, provider, metadata_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          input.templateId ?? null,
          input.templateCode ?? null,
          input.referenceType ?? null,
          input.referenceId ?? null,
          input.subject,
          input.htmlBody ?? null,
          input.textBody ?? null,
          input.fromEmail,
          input.fromName ?? null,
          input.replyTo ?? null,
          input.status,
          input.provider ?? null,
          input.metadata ? JSON.stringify(input.metadata) : null,
        ],
      )

      for (const recipient of input.recipients) {
        await transaction.execute(
          `
            INSERT INTO ${mailboxTableNames.recipients} (id, message_id, recipient_type, email, name)
            VALUES (?, ?, ?, ?, ?)
          `,
          [randomUUID(), id, recipient.recipientType, recipient.email, recipient.name ?? null],
        )
      }
    })

    const message = await this.findMessageById(id)
    if (!message) {
      throw new Error('Expected mailbox message to be retrievable.')
    }

    return message
  }

  async markMessageSent(id: string, input: { provider: string | null; providerMessageId?: string | null; metadata?: Record<string, unknown> | null }) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${mailboxTableNames.messages}
        SET status = 'sent', provider = ?, provider_message_id = ?, error_message = NULL, metadata_json = ?, sent_at = CURRENT_TIMESTAMP, failed_at = NULL
        WHERE id = ?
      `,
      [
        input.provider,
        input.providerMessageId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        id,
      ],
    )
  }

  async markMessageFailed(id: string, input: { provider: string | null; errorMessage: string; metadata?: Record<string, unknown> | null }) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${mailboxTableNames.messages}
        SET status = 'failed', provider = ?, error_message = ?, metadata_json = ?, failed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        input.provider,
        input.errorMessage,
        input.metadata ? JSON.stringify(input.metadata) : null,
        id,
      ],
    )
  }
}
