import nodemailer from 'nodemailer'
import { environment } from '../config/environment'

interface SendEmailOtpInput {
  email: string
  otp: string
  expiresInMinutes: number
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

function getFromAddress() {
  const { fromEmail, fromName } = environment.notifications.email
  return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail
}

export async function sendEmailOtp(input: SendEmailOtpInput) {
  const mailTransporter = getTransporter()

  await mailTransporter.sendMail({
    from: getFromAddress(),
    to: input.email,
    subject: 'Your codexsun verification code',
    text: `Your codexsun verification code is ${input.otp}. It expires in ${input.expiresInMinutes} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>Your codexsun verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${input.otp}</p>
        <p>This code expires in ${input.expiresInMinutes} minutes.</p>
      </div>
    `,
  })
}
