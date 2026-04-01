import type { MailboxRecipientInput, MailboxTemplate } from '@shared/index'

export function renderMailboxTemplate(template: string | null | undefined, data: Record<string, unknown>) {
  if (!template) {
    return ''
  }

  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = key.split('.').reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment]
      }

      return undefined
    }, data)

    if (value == null) {
      return ''
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value)
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    return ''
  })
}

export function parseRecipientList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((email) => ({ email, name: null })) satisfies MailboxRecipientInput[]
}

export function formatRecipientLabel(recipient: { email: string; name?: string | null }) {
  return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
}

export function createTemplatePreview(template: MailboxTemplate | null, templateData: Record<string, unknown>, fallback: { subject: string; htmlBody: string; textBody: string }) {
  if (!template) {
    return fallback
  }

  return {
    subject: renderMailboxTemplate(template.subjectTemplate, templateData),
    htmlBody: renderMailboxTemplate(template.htmlTemplate, templateData),
    textBody: renderMailboxTemplate(template.textTemplate, templateData),
  }
}
