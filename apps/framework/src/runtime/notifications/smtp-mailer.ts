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

let cachedTransport:
  | {
      key: string
      transporter: ReturnType<typeof nodemailer.createTransport>
    }
  | null = null

const smtpConnectionTimeoutMs = 5_000
const smtpGreetingTimeoutMs = 5_000
const smtpSocketTimeoutMs = 10_000
const smtpDnsTimeoutMs = 5_000

function formatRecipient(recipient: SmtpRecipient) {
  return recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email
}

function getTransportCacheKey(config: ServerConfig["notifications"]["email"]) {
  return JSON.stringify({
    authUser: config.user,
    host: config.host,
    port: config.port,
    secure: config.secure,
  })
}

function getTransporter(config: ServerConfig["notifications"]["email"]) {
  const cacheKey = getTransportCacheKey(config)

  if (cachedTransport?.key === cacheKey) {
    return cachedTransport.transporter
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: smtpConnectionTimeoutMs,
    greetingTimeout: smtpGreetingTimeoutMs,
    socketTimeout: smtpSocketTimeoutMs,
    dnsTimeout: smtpDnsTimeoutMs,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  cachedTransport = {
    key: cacheKey,
    transporter,
  }

  return transporter
}

export async function sendSmtpMail(input: SendSmtpMailInput) {
  if (!input.config.enabled || !input.config.user || !input.config.password) {
    throw new ApplicationError("SMTP delivery is not configured.", {}, 500)
  }

  const transporter = getTransporter(input.config)

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
