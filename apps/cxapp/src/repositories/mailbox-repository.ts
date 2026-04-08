import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type {
  MailboxMessage,
  MailboxMessageStatus,
  MailboxRecipient,
  MailboxRecipientInput,
  MailboxRecipientType,
  MailboxTemplate,
  MailboxTemplateSummary,
} from "../../shared/index.js"

import { asQueryDatabase } from "../data/query-database.js"

import { cxappTableNames } from "../../database/table-names.js"

function asString(value: unknown) {
  return String(value ?? "")
}

function asNullableString(value: unknown) {
  return value === null || value === undefined ? null : String(value)
}

function asBoolean(value: unknown) {
  return Number(value ?? 0) === 1
}

function parseJsonRecord(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function toDatabaseSafeString(value: string) {
  return value
    .replace(/\u20B9/g, "Rs.")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[\u0080-\uFFFF]/g, (character) => `&#${character.charCodeAt(0)};`)
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") {
    return toDatabaseSafeString(value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMetadataValue(entry))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeMetadataValue(entry)])
    )
  }

  return value
}

function stringifyMetadata(value: Record<string, unknown> | null) {
  if (!value) {
    return null
  }

  return JSON.stringify(sanitizeMetadataValue(value))
}

export class MailboxRepository {
  constructor(private readonly database: Kysely<unknown>) {}

  async listTemplates(includeInactive = true) {
    let query = asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxTemplates)
      .selectAll()
      .orderBy("created_at")

    if (!includeInactive) {
      query = query.where("is_active", "=", 1)
    }

    const rows = await query.execute()

    return rows.map((row) => this.mapTemplateSummary(row))
  }

  async findTemplateById(id: string) {
    const row = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxTemplates)
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    return row ? this.mapTemplate(row) : null
  }

  async findTemplateByCode(code: string) {
    const row = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxTemplates)
      .selectAll()
      .where("code", "=", code)
      .executeTakeFirst()

    return row ? this.mapTemplate(row) : null
  }

  async createTemplate(input: {
    code: string
    name: string
    category: string
    description: string | null
    subjectTemplate: string
    htmlTemplate: string | null
    textTemplate: string | null
    sampleData: Record<string, unknown> | null
    isSystem: boolean
    isActive: boolean
  }) {
    const id = randomUUID()
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .insertInto(cxappTableNames.mailboxTemplates)
      .values({
        id,
        code: input.code,
        name: input.name,
        category: input.category,
        description: input.description,
        subject_template: input.subjectTemplate,
        html_template: input.htmlTemplate,
        text_template: input.textTemplate,
        sample_data: input.sampleData ? JSON.stringify(input.sampleData) : null,
        is_system: input.isSystem ? 1 : 0,
        is_active: input.isActive ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    const item = await this.findTemplateById(id)

    if (!item) {
      throw new Error("Expected created mailbox template to be retrievable.")
    }

    return item
  }

  async updateTemplate(
    id: string,
    input: {
      code: string
      name: string
      category: string
      description: string | null
      subjectTemplate: string
      htmlTemplate: string | null
      textTemplate: string | null
      sampleData: Record<string, unknown> | null
      isSystem: boolean
      isActive: boolean
    }
  ) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.mailboxTemplates)
      .set({
        code: input.code,
        name: input.name,
        category: input.category,
        description: input.description,
        subject_template: input.subjectTemplate,
        html_template: input.htmlTemplate,
        text_template: input.textTemplate,
        sample_data: input.sampleData ? JSON.stringify(input.sampleData) : null,
        is_system: input.isSystem ? 1 : 0,
        is_active: input.isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute()

    const item = await this.findTemplateById(id)

    if (!item) {
      throw new Error("Expected updated mailbox template to be retrievable.")
    }

    return item
  }

  async setTemplateActiveState(id: string, isActive: boolean) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.mailboxTemplates)
      .set({
        is_active: isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute()

    const item = await this.findTemplateById(id)

    if (!item) {
      throw new Error("Expected mailbox template to be retrievable.")
    }

    return item
  }

  async listMessages(options?: { archived?: boolean }) {
    let query = asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxMessages)
      .selectAll()
      .orderBy("created_at", "desc")

    query =
      options?.archived === true
        ? query.where("archived_at", "is not", null)
        : query.where("archived_at", "is", null)

    const rows = await query.execute()

    return Promise.all(rows.map((row) => this.mapMessageSummary(row)))
  }

  async findMessageById(id: string) {
    const row = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxMessages)
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!row) {
      return null
    }

    return this.mapMessage(row)
  }

  async createMessage(input: {
    templateId: string | null
    templateCode: string | null
    referenceType: string | null
    referenceId: string | null
    subject: string
    htmlBody: string | null
    textBody: string | null
    fromEmail: string
    fromName: string | null
    replyTo: string | null
    status: MailboxMessageStatus
    provider: string | null
    metadata: Record<string, unknown> | null
    recipients: Array<MailboxRecipientInput & { recipientType: MailboxRecipientType }>
  }) {
    const id = randomUUID()
    const timestamp = new Date().toISOString()
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .insertInto(cxappTableNames.mailboxMessages)
      .values({
        id,
        template_id: input.templateId,
        template_code: input.templateCode,
        reference_type: input.referenceType,
        reference_id: input.referenceId,
        subject: input.subject,
        html_body: input.htmlBody,
        text_body: input.textBody,
        from_email: input.fromEmail,
        from_name: input.fromName,
        reply_to: input.replyTo,
        status: input.status,
        provider: input.provider,
        provider_message_id: null,
        metadata: stringifyMetadata(input.metadata),
        error_message: null,
        sent_at: null,
        failed_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    if (input.recipients.length > 0) {
      await queryDatabase
        .insertInto(cxappTableNames.mailboxMessageRecipients)
        .values(
          input.recipients.map((recipient) => ({
            id: randomUUID(),
            message_id: id,
            recipient_type: recipient.recipientType,
            email: recipient.email,
            name: recipient.name ?? null,
            created_at: timestamp,
          }))
        )
        .execute()
    }

    const item = await this.findMessageById(id)

    if (!item) {
      throw new Error("Expected mailbox message to be retrievable.")
    }

    return item
  }

  async markMessageSent(
    id: string,
    input: {
      provider: string | null
      providerMessageId: string | null
      metadata: Record<string, unknown> | null
    }
  ) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.mailboxMessages)
      .set({
        status: "sent",
        provider: input.provider,
        provider_message_id: input.providerMessageId,
        metadata: stringifyMetadata(input.metadata),
        sent_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async markMessageFailed(
    id: string,
    input: {
      provider: string | null
      errorMessage: string
      metadata: Record<string, unknown> | null
    }
  ) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.mailboxMessages)
      .set({
        status: "failed",
        provider: input.provider,
        metadata: stringifyMetadata(input.metadata),
        error_message: input.errorMessage,
        failed_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async deleteMessage(id: string) {
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .deleteFrom(cxappTableNames.mailboxMessageRecipients)
      .where("message_id", "=", id)
      .execute()

    const result = await queryDatabase
      .deleteFrom(cxappTableNames.mailboxMessages)
      .where("id", "=", id)
      .executeTakeFirst()

    return Number(result.numDeletedRows ?? 0)
  }

  async deleteMessages(ids: string[]) {
    if (ids.length === 0) {
      return 0
    }

    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .deleteFrom(cxappTableNames.mailboxMessageRecipients)
      .where("message_id", "in", ids)
      .execute()

    const result = await queryDatabase
      .deleteFrom(cxappTableNames.mailboxMessages)
      .where("id", "in", ids)
      .executeTakeFirst()

    return Number(result.numDeletedRows ?? 0)
  }

  async deleteMessagesByReferenceId(referenceId: string) {
    const queryDatabase = asQueryDatabase(this.database)
    const messageRows = await queryDatabase
      .selectFrom(cxappTableNames.mailboxMessages)
      .select("id")
      .where("reference_id", "=", referenceId)
      .execute()

    return this.deleteMessages(messageRows.map((row) => asNullableString(row.id)).filter((id): id is string => Boolean(id)))
  }

  async archiveMessage(id: string) {
    return this.setMessageArchiveState([id], true)
  }

  async restoreMessage(id: string) {
    return this.setMessageArchiveState([id], false)
  }

  async archiveMessages(ids: string[]) {
    return this.setMessageArchiveState(ids, true)
  }

  async restoreMessages(ids: string[]) {
    return this.setMessageArchiveState(ids, false)
  }

  private async setMessageArchiveState(ids: string[], archived: boolean) {
    if (ids.length === 0) {
      return 0
    }

    const result = await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.mailboxMessages)
      .set({
        archived_at: archived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .where("id", "in", ids)
      .executeTakeFirst()

    return Number(result.numUpdatedRows ?? 0)
  }

  private mapTemplateSummary(row: Record<string, unknown>) {
    return {
      id: asString(row.id),
      code: asString(row.code),
      name: asString(row.name),
      category: asString(row.category),
      description: asNullableString(row.description),
      subjectTemplate: asString(row.subject_template),
      isSystem: asBoolean(row.is_system),
      isActive: asBoolean(row.is_active),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    } satisfies MailboxTemplateSummary
  }

  private mapTemplate(row: Record<string, unknown>) {
    return {
      ...this.mapTemplateSummary(row),
      htmlTemplate: asNullableString(row.html_template),
      textTemplate: asNullableString(row.text_template),
      sampleData: parseJsonRecord(row.sample_data),
    } satisfies MailboxTemplate
  }

  private async mapMessageSummary(row: Record<string, unknown>) {
    const recipients = await this.listRecipients(asString(row.id))
    const recipientSummary = recipients
      .filter((recipient) => recipient.recipientType === "to")
      .map((recipient) => recipient.email)
      .join(", ")

    return {
      id: asString(row.id),
      subject: asString(row.subject),
      templateCode: asNullableString(row.template_code),
      fromEmail: asString(row.from_email),
      fromName: asNullableString(row.from_name),
      recipientSummary: recipientSummary || "No recipients",
      recipientCount: recipients.length,
      status: asString(row.status) as MailboxMessageStatus,
      provider: asNullableString(row.provider),
      providerMessageId: asNullableString(row.provider_message_id),
      referenceType: asNullableString(row.reference_type),
      referenceId: asNullableString(row.reference_id),
      errorMessage: asNullableString(row.error_message),
      isArchived: asNullableString(row.archived_at) !== null,
      archivedAt: asNullableString(row.archived_at),
      sentAt: asNullableString(row.sent_at),
      failedAt: asNullableString(row.failed_at),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    } satisfies Omit<
      MailboxMessage,
      "replyTo" | "htmlBody" | "textBody" | "metadata" | "recipients"
    >
  }

  private async mapMessage(row: Record<string, unknown>) {
    const summary = await this.mapMessageSummary(row)

    return {
      ...summary,
      replyTo: asNullableString(row.reply_to),
      htmlBody: asNullableString(row.html_body),
      textBody: asNullableString(row.text_body),
      metadata: parseJsonRecord(row.metadata),
      recipients: await this.listRecipients(asString(row.id)),
    } satisfies MailboxMessage
  }

  private async listRecipients(messageId: string) {
    const rows = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.mailboxMessageRecipients)
      .selectAll()
      .where("message_id", "=", messageId)
      .orderBy("created_at")
      .execute()

    return rows.map(
      (row) =>
        ({
          id: asString(row.id),
          messageId: asString(row.message_id),
          recipientType: asString(row.recipient_type) as MailboxRecipientType,
          email: asString(row.email),
          name: asNullableString(row.name),
          createdAt: asString(row.created_at),
        }) satisfies MailboxRecipient
    )
  }
}
