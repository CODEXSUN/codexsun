import nodemailer from 'nodemailer'
import { environment } from '../config/environment'

interface SmtpRecipient {
  email: string
  name?: string | null
}

interface SendSmtpMailInput {
  fromEmail?: string
  fromName?: string | null
  replyTo?: string | null
  to: SmtpRecipient[]
  cc?: SmtpRecipient[]
  bcc?: SmtpRecipient[]
  subject: string
  text?: string | null
  html?: string | null
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: environment.notifications.email.host,
    port: environment.notifications.email.port,
    secure: environment.notifications.email.secure,
    auth: {
      user: environment.notifications.email.user,
      pass: environment.notifications.email.password,
    },
  })

  return transporter
}

function formatRecipient(recipient: SmtpRecipient) {
  return recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email
}

export async function sendSmtpMail(input: SendSmtpMailInput) {
  const activeTransporter = getTransporter()
  const info = await activeTransporter.sendMail({
    from: input.fromName ? `"${input.fromName}" <${input.fromEmail ?? environment.notifications.email.fromEmail}>` : (input.fromEmail ?? environment.notifications.email.fromEmail),
    replyTo: input.replyTo ?? undefined,
    to: input.to.map(formatRecipient),
    cc: input.cc?.map(formatRecipient),
    bcc: input.bcc?.map(formatRecipient),
    subject: input.subject,
    text: input.text ?? undefined,
    html: input.html ?? undefined,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  })

  return {
    messageId: info.messageId,
  }
}
