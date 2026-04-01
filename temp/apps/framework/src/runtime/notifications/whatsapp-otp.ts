import { environment } from '../config/environment'

interface SendWhatsAppOtpInput {
  phoneNumber: string
  otp: string
}

interface WhatsAppErrorPayload {
  error?: {
    message?: string
  }
}

export async function sendWhatsAppOtp(input: SendWhatsAppOtpInput) {
  const endpoint = `https://graph.facebook.com/${environment.notifications.whatsapp.graphApiVersion}/${environment.notifications.whatsapp.phoneNumberId}/messages`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${environment.notifications.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: input.phoneNumber.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: environment.notifications.whatsapp.templateName,
        language: {
          code: environment.notifications.whatsapp.templateLanguage,
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: input.otp,
              },
            ],
          },
        ],
      },
    }),
  })

  if (response.ok) {
    return
  }

  const payload = (await response.json().catch(() => null)) as WhatsAppErrorPayload | null
  const detail = payload?.error?.message ?? response.statusText ?? 'Unknown provider error'

  throw new Error(`WhatsApp delivery failed: ${detail}`)
}
