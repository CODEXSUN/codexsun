import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { sendSmtpMail } from "../../../framework/src/runtime/notifications/smtp-mailer.js"
import type {
  MailboxMessageArchiveResponse,
  MailboxMessageDeleteResponse,
  MailboxMessageListResponse,
  MailboxMessageResponse,
  MailboxMessageRestoreResponse,
  MailboxSendPayload,
  MailboxTemplateListResponse,
  MailboxTemplateResponse,
} from "../../shared/index.js"
import {
  mailboxMessageArchivePayloadSchema,
  mailboxMessageArchiveResponseSchema,
  mailboxMessageDeletePayloadSchema,
  mailboxMessageDeleteResponseSchema,
  mailboxMessageListResponseSchema,
  mailboxMessageResponseSchema,
  mailboxMessageRestoreResponseSchema,
  mailboxSendPayloadSchema,
  mailboxTemplateListResponseSchema,
  mailboxTemplateResponseSchema,
  mailboxTemplateUpsertPayloadSchema,
} from "../../shared/index.js"

import { renderTemplateString } from "../domain/template-renderer.js"
import { MailboxRepository } from "../repositories/mailbox-repository.js"

interface EmailDispatchInput {
  to: MailboxSendPayload["to"]
  cc?: MailboxSendPayload["cc"]
  bcc?: MailboxSendPayload["bcc"]
  subject?: string
  htmlBody?: string | null
  textBody?: string | null
  templateId?: string | null
  templateCode?: string | null
  templateData?: Record<string, unknown>
  referenceType?: string | null
  referenceId?: string | null
  replyTo?: string | null
  fromName?: string | null
  fromEmail?: string
}

export class MailboxService {
  constructor(
    private readonly repository: MailboxRepository,
    private readonly config: ServerConfig
  ) {}

  async listMessages(options?: { archived?: boolean }) {
    const items = await this.repository.listMessages(options)
    return mailboxMessageListResponseSchema.parse({
      items,
    } satisfies MailboxMessageListResponse)
  }

  async getMessageById(id: string) {
    const item = await this.repository.findMessageById(id)

    if (!item) {
      throw new ApplicationError("Mailbox message not found.", { id }, 404)
    }

    return mailboxMessageResponseSchema.parse({
      item,
    } satisfies MailboxMessageResponse)
  }

  async listTemplates(includeInactive = true) {
    const items = await this.repository.listTemplates(includeInactive)
    return mailboxTemplateListResponseSchema.parse({
      items,
    } satisfies MailboxTemplateListResponse)
  }

  async getTemplateById(id: string) {
    const item = await this.repository.findTemplateById(id)

    if (!item) {
      throw new ApplicationError("Mailbox template not found.", { id }, 404)
    }

    return mailboxTemplateResponseSchema.parse({
      item,
    } satisfies MailboxTemplateResponse)
  }

  async createTemplate(payload: unknown) {
    const parsedPayload = mailboxTemplateUpsertPayloadSchema.parse(payload)
    const item = await this.repository.createTemplate(parsedPayload)
    return mailboxTemplateResponseSchema.parse({
      item,
    } satisfies MailboxTemplateResponse)
  }

  async updateTemplate(id: string, payload: unknown) {
    const parsedPayload = mailboxTemplateUpsertPayloadSchema.parse(payload)
    const item = await this.repository.updateTemplate(id, parsedPayload)
    return mailboxTemplateResponseSchema.parse({
      item,
    } satisfies MailboxTemplateResponse)
  }

  async deactivateTemplate(id: string) {
    const item = await this.repository.setTemplateActiveState(id, false)
    return mailboxTemplateResponseSchema.parse({
      item,
    } satisfies MailboxTemplateResponse)
  }

  async restoreTemplate(id: string) {
    const item = await this.repository.setTemplateActiveState(id, true)
    return mailboxTemplateResponseSchema.parse({
      item,
    } satisfies MailboxTemplateResponse)
  }

  async send(payload: unknown) {
    const parsedPayload = mailboxSendPayloadSchema.parse(payload)
    const item = await this.sendEmail(parsedPayload, {
      allowDebugFallback: false,
    })

    return mailboxMessageResponseSchema.parse({
      item,
    } satisfies MailboxMessageResponse)
  }

  async deleteMessage(id: string) {
    const count = await this.repository.deleteMessage(id)

    if (count === 0) {
      throw new ApplicationError("Mailbox message not found.", { id }, 404)
    }

    return mailboxMessageDeleteResponseSchema.parse({
      deleted: true,
      count,
    } satisfies MailboxMessageDeleteResponse)
  }

  async deleteMessages(payload: unknown) {
    const parsedPayload = mailboxMessageDeletePayloadSchema.parse(payload)
    const count = await this.repository.deleteMessages(parsedPayload.ids)

    return mailboxMessageDeleteResponseSchema.parse({
      deleted: true,
      count,
    } satisfies MailboxMessageDeleteResponse)
  }

  async archiveMessage(id: string) {
    const count = await this.repository.archiveMessage(id)

    if (count === 0) {
      throw new ApplicationError("Mailbox message not found.", { id }, 404)
    }

    return mailboxMessageArchiveResponseSchema.parse({
      archived: true,
      count,
    } satisfies MailboxMessageArchiveResponse)
  }

  async archiveMessages(payload: unknown) {
    const parsedPayload = mailboxMessageArchivePayloadSchema.parse(payload)
    const count = await this.repository.archiveMessages(parsedPayload.ids)

    return mailboxMessageArchiveResponseSchema.parse({
      archived: true,
      count,
    } satisfies MailboxMessageArchiveResponse)
  }

  async restoreMessage(id: string) {
    const count = await this.repository.restoreMessage(id)

    if (count === 0) {
      throw new ApplicationError("Mailbox message not found.", { id }, 404)
    }

    return mailboxMessageRestoreResponseSchema.parse({
      restored: true,
      count,
    } satisfies MailboxMessageRestoreResponse)
  }

  async restoreMessages(payload: unknown) {
    const parsedPayload = mailboxMessageArchivePayloadSchema.parse(payload)
    const count = await this.repository.restoreMessages(parsedPayload.ids)

    return mailboxMessageRestoreResponseSchema.parse({
      restored: true,
      count,
    } satisfies MailboxMessageRestoreResponse)
  }

  async sendTemplatedEmail(
    input: EmailDispatchInput,
    options?: { allowDebugFallback?: boolean }
  ) {
    return this.sendEmail(input, {
      allowDebugFallback: options?.allowDebugFallback ?? false,
    })
  }

  private async sendEmail(
    input: EmailDispatchInput,
    options: { allowDebugFallback: boolean }
  ) {
    const resolved = await this.resolveMessageContent(input)
    const fromEmail =
      input.fromEmail ??
      this.config.notifications.email.fromEmail ??
      `noreply@${this.config.appDomain}`
    const fromName = input.fromName ?? this.config.notifications.email.fromName

    const recipients = [
      ...input.to.map((recipient) => ({
        ...recipient,
        recipientType: "to" as const,
      })),
      ...(input.cc ?? []).map((recipient) => ({
        ...recipient,
        recipientType: "cc" as const,
      })),
      ...(input.bcc ?? []).map((recipient) => ({
        ...recipient,
        recipientType: "bcc" as const,
      })),
    ]
    const baseMetadata = {
      templateData: resolved.templateData,
      source: input.referenceType ?? "manual",
    } satisfies Record<string, unknown>

    const message = await this.repository.createMessage({
      templateId: resolved.templateId,
      templateCode: resolved.templateCode,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      subject: resolved.subject,
      htmlBody: resolved.htmlBody,
      textBody: resolved.textBody,
      fromEmail,
      fromName: fromName ?? null,
      replyTo: input.replyTo ?? null,
      status: "queued",
      provider: this.config.notifications.email.enabled
        ? "smtp"
        : options.allowDebugFallback
          ? "debug"
          : null,
      metadata: baseMetadata,
      recipients,
    })

    try {
      if (this.config.notifications.email.enabled) {
        const dispatch = await sendSmtpMail({
          config: this.config.notifications.email,
          fromEmail,
          fromName: fromName ?? null,
          replyTo: input.replyTo ?? null,
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          subject: resolved.subject,
          html: resolved.htmlBody,
          text: resolved.textBody,
        })

        await this.repository.markMessageSent(message.id, {
          provider: "smtp",
          providerMessageId: dispatch.messageId,
          metadata: baseMetadata,
        })
      } else if (options.allowDebugFallback && this.config.auth.otpDebug) {
        await this.repository.markMessageSent(message.id, {
          provider: "debug",
          providerMessageId: `debug-${message.id}`,
          metadata: {
            ...baseMetadata,
            debug: true,
          },
        })
      } else {
        throw new Error("SMTP delivery is not configured.")
      }
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown email delivery error"
      await this.repository.markMessageFailed(message.id, {
        provider: this.config.notifications.email.enabled ? "smtp" : null,
        errorMessage: detail,
        metadata: baseMetadata,
      })
      throw new ApplicationError(
        "Unable to send email right now.",
        {
          detail,
          messageId: message.id,
        },
        502
      )
    }

    const persisted = await this.repository.findMessageById(message.id)

    if (!persisted) {
      throw new ApplicationError(
        "Mailbox message not found after dispatch.",
        { id: message.id },
        500
      )
    }

    return persisted
  }

  private async resolveMessageContent(input: EmailDispatchInput) {
    const template = input.templateId
      ? await this.repository.findTemplateById(input.templateId)
      : input.templateCode
        ? await this.repository.findTemplateByCode(input.templateCode)
        : null

    if ((input.templateId || input.templateCode) && !template) {
      throw new ApplicationError(
        "Mailbox template not found.",
        {
          templateId: input.templateId ?? "",
          templateCode: input.templateCode ?? "",
        },
        404
      )
    }

    if (template && !template.isActive) {
      throw new ApplicationError(
        "Mailbox template is inactive.",
        {
          templateId: template.id,
          templateCode: template.code,
        },
        409
      )
    }

    const templateData = input.templateData ?? template?.sampleData ?? {}
    const subject = template
      ? renderTemplateString(template.subjectTemplate, templateData)
      : input.subject ?? null
    const htmlBody = template
      ? renderTemplateString(template.htmlTemplate, templateData)
      : input.htmlBody ?? null
    const textBody = template
      ? renderTemplateString(template.textTemplate, templateData)
      : input.textBody ?? null

    if (!subject?.trim()) {
      throw new ApplicationError("Email subject is required.", {}, 400)
    }

    if (!htmlBody?.trim() && !textBody?.trim()) {
      throw new ApplicationError("Email body is required.", {}, 400)
    }

    return {
      templateId: template?.id ?? null,
      templateCode: template?.code ?? input.templateCode ?? null,
      subject: subject.trim(),
      htmlBody: htmlBody?.trim() ? htmlBody : null,
      textBody: textBody?.trim() ? textBody : null,
      templateData,
    }
  }
}
