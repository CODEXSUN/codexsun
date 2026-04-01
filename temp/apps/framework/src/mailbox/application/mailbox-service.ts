import type {
  MailboxMessageListResponse,
  MailboxMessageResponse,
  MailboxRecipientInput,
  MailboxRecipientType,
  MailboxTemplateListResponse,
  MailboxTemplateResponse,
} from '@shared/index'
import {
  mailboxMessageListResponseSchema,
  mailboxMessageResponseSchema,
  mailboxSendPayloadSchema,
  mailboxTemplateListResponseSchema,
  mailboxTemplateResponseSchema,
  mailboxTemplateUpsertPayloadSchema,
} from '@shared/index'
import { environment } from '@framework-core/runtime/config/environment'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { sendSmtpMail } from '@framework-core/runtime/notifications/smtp-mailer'
import type { MailboxRepository } from '../data/mailbox-repository'
import { renderTemplateString } from '../domain/template-renderer'

interface EmailDispatchInput {
  to: MailboxRecipientInput[]
  cc?: MailboxRecipientInput[]
  bcc?: MailboxRecipientInput[]
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
  constructor(private readonly repository: MailboxRepository) {}

  async listMessages() {
    const items = await this.repository.listMessages()
    return mailboxMessageListResponseSchema.parse({ items } satisfies MailboxMessageListResponse)
  }

  async getMessageById(id: string) {
    const item = await this.repository.findMessageById(id)
    if (!item) {
      throw new ApplicationError('Mailbox message not found.', { id }, 404)
    }

    return mailboxMessageResponseSchema.parse({ item } satisfies MailboxMessageResponse)
  }

  async listTemplates(includeInactive = true) {
    const items = await this.repository.listTemplates(includeInactive)
    return mailboxTemplateListResponseSchema.parse({ items } satisfies MailboxTemplateListResponse)
  }

  async getTemplateById(id: string) {
    const item = await this.repository.findTemplateById(id)
    if (!item) {
      throw new ApplicationError('Mailbox template not found.', { id }, 404)
    }

    return mailboxTemplateResponseSchema.parse({ item } satisfies MailboxTemplateResponse)
  }

  async createTemplate(payload: unknown) {
    const parsedPayload = mailboxTemplateUpsertPayloadSchema.parse(payload)
    const item = await this.repository.createTemplate(parsedPayload)
    return mailboxTemplateResponseSchema.parse({ item } satisfies MailboxTemplateResponse)
  }

  async updateTemplate(id: string, payload: unknown) {
    const parsedPayload = mailboxTemplateUpsertPayloadSchema.parse(payload)
    const item = await this.repository.updateTemplate(id, parsedPayload)
    return mailboxTemplateResponseSchema.parse({ item } satisfies MailboxTemplateResponse)
  }

  async deactivateTemplate(id: string) {
    const item = await this.repository.setTemplateActiveState(id, false)
    return mailboxTemplateResponseSchema.parse({ item } satisfies MailboxTemplateResponse)
  }

  async restoreTemplate(id: string) {
    const item = await this.repository.setTemplateActiveState(id, true)
    return mailboxTemplateResponseSchema.parse({ item } satisfies MailboxTemplateResponse)
  }

  async send(payload: unknown) {
    const parsedPayload = mailboxSendPayloadSchema.parse(payload)
    const item = await this.sendEmail({
      ...parsedPayload,
      templateData: parsedPayload.templateData,
    }, { allowDebugFallback: false })

    return mailboxMessageResponseSchema.parse({ item } satisfies MailboxMessageResponse)
  }

  async sendTemplatedEmail(input: EmailDispatchInput, options?: { allowDebugFallback?: boolean }) {
    return this.sendEmail(input, { allowDebugFallback: options?.allowDebugFallback ?? false })
  }

  private async sendEmail(input: EmailDispatchInput, options: { allowDebugFallback: boolean }) {
    const resolved = await this.resolveMessageContent(input)
    const fromEmail = input.fromEmail ?? environment.notifications.email.fromEmail
    const fromName = input.fromName ?? environment.notifications.email.fromName

    if (!fromEmail) {
      throw new ApplicationError('Outgoing email sender is not configured.', {}, 500)
    }

    const recipients = [
      ...input.to.map((recipient) => ({ ...recipient, recipientType: 'to' as MailboxRecipientType })),
      ...(input.cc ?? []).map((recipient) => ({ ...recipient, recipientType: 'cc' as MailboxRecipientType })),
      ...(input.bcc ?? []).map((recipient) => ({ ...recipient, recipientType: 'bcc' as MailboxRecipientType })),
    ]

    const baseMetadata = {
      templateData: resolved.templateData,
      source: input.referenceType ?? 'manual',
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
      fromName,
      replyTo: input.replyTo ?? null,
      status: 'queued',
      provider: environment.notifications.email.enabled ? 'smtp' : options.allowDebugFallback ? 'debug' : null,
      metadata: baseMetadata,
      recipients,
    })

    try {
      if (environment.notifications.email.enabled) {
        const dispatch = await sendSmtpMail({
          fromEmail,
          fromName,
          replyTo: input.replyTo ?? null,
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          subject: resolved.subject,
          html: resolved.htmlBody,
          text: resolved.textBody,
        })

        await this.repository.markMessageSent(message.id, {
          provider: 'smtp',
          providerMessageId: dispatch.messageId,
          metadata: baseMetadata,
        })
      } else if (options.allowDebugFallback && environment.auth.otp.debug) {
        await this.repository.markMessageSent(message.id, {
          provider: 'debug',
          providerMessageId: `debug-${message.id}`,
          metadata: {
            ...baseMetadata,
            debug: true,
          },
        })
      } else {
        throw new Error('SMTP delivery is not configured.')
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown email delivery error'
      await this.repository.markMessageFailed(message.id, {
        provider: environment.notifications.email.enabled ? 'smtp' : null,
        errorMessage: detail,
        metadata: baseMetadata,
      })

      throw new ApplicationError('Unable to send email right now.', { detail, messageId: message.id }, 502)
    }

    const persisted = await this.repository.findMessageById(message.id)
    if (!persisted) {
      throw new ApplicationError('Mailbox message not found after dispatch.', { id: message.id }, 500)
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
      throw new ApplicationError('Mailbox template not found.', { templateId: input.templateId ?? '', templateCode: input.templateCode ?? '' }, 404)
    }

    if (template && !template.isActive) {
      throw new ApplicationError('Mailbox template is inactive.', { templateId: template.id, templateCode: template.code ?? '' }, 409)
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
      throw new ApplicationError('Email subject is required.', {}, 400)
    }

    if (!htmlBody?.trim() && !textBody?.trim()) {
      throw new ApplicationError('Email body is required.', {}, 400)
    }

    return {
      templateId: template?.id ?? null,
      templateCode: template?.code ?? input.templateCode ?? null,
      subject: subject.trim(),
      htmlBody: htmlBody?.trim() ? htmlBody : null,
      textBody: textBody?.trim() ? textBody : null,
      templateData: templateData as Record<string, string | number | boolean | null>,
    }
  }
}
