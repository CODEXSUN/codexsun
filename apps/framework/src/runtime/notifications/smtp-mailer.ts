import nodemailer from "nodemailer"

import type { ServerConfig } from "../config/index.js"
import { ApplicationError } from "../errors/application-error.js"

type SmtpRecipient = {
  email: string
  name?: string | null
}

type SendSmtpMailInput = {
  config: ServerConfig["notifications"]["email"]
  fromEmail?: string
  fromName?: string | null
  replyTo?: string | null
  to: SmtpRecipient[]
  cc?: SmtpRecipient[]
  bcc?: SmtpRecipient[]
  subject: string
  html?: string | null
  text?: string | null
}

function formatRecipient(recipient: SmtpRecipient) {
  return recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email
}

export async function sendSmtpMail(input: SendSmtpMailInput) {
  if (!input.config.enabled || !input.config.user || !input.config.password) {
    throw new ApplicationError("SMTP delivery is not configured.", {}, 500)
  }

  const transporter = nodemailer.createTransport({
    host: input.config.host,
    port: input.config.port,
    secure: input.config.secure,
    auth: {
      user: input.config.user,
      pass: input.config.password,
    },
  })

  const info = await transporter.sendMail({
    from: input.fromName
      ? `"${input.fromName}" <${input.fromEmail ?? input.config.fromEmail}>`
      : input.fromEmail ?? input.config.fromEmail,
    replyTo: input.replyTo ?? undefined,
    to: input.to.map(formatRecipient),
    cc: input.cc?.map(formatRecipient),
    bcc: input.bcc?.map(formatRecipient),
    subject: input.subject,
    html: input.html ?? undefined,
    text: input.text ?? undefined,
  })

  return {
    messageId: info.messageId,
  }
}
