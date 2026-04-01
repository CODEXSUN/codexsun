import type { FormEvent } from 'react'
import type { Company } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, SendIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { getCompany, HttpError, sendMailboxMessage } from '@/shared/api/client'
import { useBranding } from '@/shared/branding/branding-provider'
import { showErrorToast, showSuccessToast, showValidationToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Unable to complete the support request.'
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized && normalized !== '-' ? normalized : null
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

function resolveSupportEmail(company: Company | null, fallbackEmail: string) {
  const supportEmail =
    company?.emails.find((entry) => entry.isActive && entry.emailType.trim().toLowerCase() === 'support')?.email
    ?? company?.primaryEmail

  return normalizeText(supportEmail) ?? fallbackEmail
}

function resolveSupportPhone(company: Company | null, fallbackPhone: string) {
  const whatsappPhone =
    company?.phones.find((entry) => entry.isActive && entry.phoneType.trim().toLowerCase() === 'whatsapp')?.phoneNumber
    ?? company?.phones.find((entry) => entry.isActive && entry.isPrimary)?.phoneNumber
    ?? company?.primaryPhone

  return normalizeText(whatsappPhone) ?? fallbackPhone
}

function buildSupportMessage({
  customerName,
  customerEmail,
  message,
}: {
  customerName: string
  customerEmail: string
  message: string
}) {
  return [
    'Customer support request',
    '',
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    '',
    'Message:',
    message,
  ].join('\n')
}

export function CustomerSupportPage() {
  const { session } = useAuth()
  const branding = useBranding()
  const [company, setCompany] = useState<Company | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isLoadingContact, setIsLoadingContact] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const customerName = session?.user.displayName?.trim() || 'Customer'
  const customerEmail = session?.user.email?.trim() || ''

  useEffect(() => {
    if (!branding.company?.id) {
      return
    }

    let cancelled = false
    setIsLoadingContact(true)

    void getCompany(branding.company.id)
      .then((item) => {
        if (!cancelled) {
          setCompany(item)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompany(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingContact(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [branding.company?.id])

  const supportEmail = useMemo(
    () => resolveSupportEmail(company, branding.email),
    [branding.email, company],
  )
  const supportPhone = useMemo(
    () => resolveSupportPhone(company, branding.phone),
    [branding.phone, company],
  )
  const whatsappHref = useMemo(() => {
    const phoneDigits = toPhoneDigits(supportPhone)
    if (!phoneDigits) {
      return '#'
    }

    const whatsappText = buildSupportMessage({
      customerName,
      customerEmail,
      message: message.trim() || 'I need help with my account or order.',
    })

    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappText)}`
  }, [customerEmail, customerName, message, supportPhone])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (!customerEmail || !message.trim()) {
      showValidationToast('support request')
      setErrorMessage('Customer email and message are required before sending support mail.')
      return
    }

    setSending(true)

    try {
      const trimmedMessage = message.trim()
      await sendMailboxMessage({
        to: [{ email: supportEmail, name: branding.brandName }],
        cc: [],
        bcc: [],
        subject: `Customer support request from ${customerName}`,
        textBody: buildSupportMessage({
          customerName,
          customerEmail,
          message: trimmedMessage,
        }),
        htmlBody: [
          '<div>',
          '<p><strong>Customer support request</strong></p>',
          `<p><strong>Customer:</strong> ${customerName}</p>`,
          `<p><strong>Email:</strong> ${customerEmail}</p>`,
          `<p><strong>Message:</strong></p>`,
          `<p>${trimmedMessage.replace(/\n/g, '<br />')}</p>`,
          '</div>',
        ].join(''),
        templateId: undefined,
        templateCode: undefined,
        templateData: {},
        replyTo: customerEmail,
        fromName: null,
        referenceType: 'customer-support',
        referenceId: session?.user.id ?? null,
      })

      setMessage('')
      showSuccessToast({
        title: 'Support mail sent',
        description: `Your message was sent to ${supportEmail}.`,
      })
    } catch (error) {
      const nextMessage = toErrorMessage(error)
      setErrorMessage(nextMessage)
      showErrorToast({
        title: 'Support mail not sent',
        description: nextMessage,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Support</Badge>
          <div className="space-y-3">
            <CardTitle className="text-4xl tracking-tight sm:text-5xl">Reach support without leaving your account.</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Send a support email from your account contact or continue the conversation on WhatsApp using the company support number.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Mail support</CardTitle>
            <CardDescription>
              Your contact email is fixed from the signed-in account. Write the issue once and send it directly to the current company support email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="customer-support-email">Your email</Label>
                  <Input id="customer-support-email" value={customerEmail} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-support-message">Message</Label>
                <Textarea
                  id="customer-support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[220px]"
                  placeholder="Describe the issue, order question, or help you need."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={sending || !customerEmail}>
                  <SendIcon className="size-4" />
                  {sending ? 'Sending...' : 'Send email'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={!toPhoneDigits(supportPhone)}
                >
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Send on WhatsApp
                  </a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support channels</CardTitle>
            <CardDescription>
              Live company contact details currently available in this account environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
              <p className="mt-2 font-medium text-foreground">{supportEmail}</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">WhatsApp</p>
              <p className="mt-2 font-medium text-foreground">{supportPhone}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="outline" asChild>
                <a href={`mailto:${supportEmail}`}>
                  <SendIcon className="size-4" />
                  Open mail app
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                disabled={!toPhoneDigits(supportPhone)}
              >
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Open WhatsApp
                </a>
              </Button>
            </div>
            {isLoadingContact ? (
              <p className="text-sm text-muted-foreground">Refreshing company contact details...</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
