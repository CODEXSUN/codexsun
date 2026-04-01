import type { FormEvent } from 'react'
import type { MailboxSendPayload, MailboxTemplate, MailboxTemplateSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, SendIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getMailboxTemplate, HttpError, listMailboxTemplates, sendMailboxMessage } from '@/shared/api/client'
import { showErrorToast, showSuccessToast, showValidationToast } from '@/shared/notifications/toast'
import { createTemplatePreview, parseRecipientList } from '../lib/mailbox-template'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to send email.'
}

export function MailboxComposePage() {
  const navigate = useNavigate()
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templates, setTemplates] = useState<MailboxTemplateSummary[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MailboxTemplate | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [toText, setToText] = useState('')
  const [ccText, setCcText] = useState('')
  const [bccText, setBccText] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [textBody, setTextBody] = useState('')
  const [templateDataText, setTemplateDataText] = useState('{\n  "brandName": "codexsun"\n}')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingTemplates(true)
      try {
        const items = await listMailboxTemplates(false)
        if (!cancelled) {
          setTemplates(items)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplates(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedTemplate() {
      if (!templateId) {
        setSelectedTemplate(null)
        return
      }

      try {
        const template = await getMailboxTemplate(templateId)
        if (!cancelled) {
          setSelectedTemplate(template)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
          setSelectedTemplate(null)
        }
      }
    }

    void loadSelectedTemplate()
    return () => { cancelled = true }
  }, [templateId])

  const parsedTemplateData = useMemo(() => {
    try {
      return JSON.parse(templateDataText) as Record<string, unknown>
    } catch {
      return null
    }
  }, [templateDataText])

  const preview = useMemo(() => createTemplatePreview(selectedTemplate, parsedTemplateData ?? {}, {
    subject,
    htmlBody,
    textBody,
  }), [htmlBody, parsedTemplateData, selectedTemplate, subject, textBody])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const to = parseRecipientList(toText)
    const cc = parseRecipientList(ccText)
    const bcc = parseRecipientList(bccText)

    if (to.length === 0 || !parsedTemplateData || (!selectedTemplate && !subject.trim()) || (!selectedTemplate && !htmlBody.trim() && !textBody.trim())) {
      showValidationToast('mailbox')
      setErrorMessage('Provide recipients, valid template data JSON, and either a template or direct message content.')
      return
    }

    setSending(true)
    try {
      const payload: MailboxSendPayload = {
        to,
        cc,
        bcc,
        templateId: selectedTemplate?.id,
        templateCode: undefined,
        templateData: parsedTemplateData,
        referenceType: null,
        referenceId: null,
        replyTo: null,
        fromName: null,
        subject: selectedTemplate ? undefined : subject.trim(),
        htmlBody: selectedTemplate ? null : htmlBody.trim() || null,
        textBody: selectedTemplate ? null : textBody.trim() || null,
      }
      const sent = await sendMailboxMessage(payload)

      showSuccessToast({
        title: 'Email sent',
        description: `Mailbox message ${sent.subject} was queued and delivered.`,
      })
      void navigate(`/admin/dashboard/mailbox/messages/${sent.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({ title: 'Email not sent', description: message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3">
          <Link to="/admin/dashboard/mailbox/messages">
            <ArrowLeft className="size-4" />
            Back to mailbox
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Compose direct mail or send from an existing template while storing the result in the mailbox ledger.</p>
      </div>

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="compose" className="rounded-none px-4">Compose</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none px-4">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
              <div className="rounded-md border border-border/70 bg-background/60 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="mail-compose-to">To</Label>
                    <Input id="mail-compose-to" value={toText} onChange={(event) => setToText(event.target.value)} />
                    <p className="text-xs text-muted-foreground">Comma-separated email addresses.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-cc">Cc</Label>
                    <Input id="mail-compose-cc" value={ccText} onChange={(event) => setCcText(event.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-bcc">Bcc</Label>
                    <Input id="mail-compose-bcc" value={bccText} onChange={(event) => setBccText(event.target.value)} />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="mail-compose-template">Template</Label>
                    <select
                      id="mail-compose-template"
                      value={templateId}
                      onChange={(event) => setTemplateId(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      disabled={loadingTemplates}
                    >
                      <option value="">Direct compose</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-subject">Subject</Label>
                    <Input id="mail-compose-subject" value={subject} onChange={(event) => setSubject(event.target.value)} disabled={Boolean(selectedTemplate)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-html">HTML body</Label>
                    <Textarea id="mail-compose-html" value={htmlBody} onChange={(event) => setHtmlBody(event.target.value)} className="min-h-[240px]" disabled={Boolean(selectedTemplate)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-text">Text body</Label>
                    <Textarea id="mail-compose-text" value={textBody} onChange={(event) => setTextBody(event.target.value)} className="min-h-[180px]" disabled={Boolean(selectedTemplate)} />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/70 bg-background/60 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="mail-compose-template-data">Template data JSON</Label>
                  <Textarea id="mail-compose-template-data" value={templateDataText} onChange={(event) => setTemplateDataText(event.target.value)} className="min-h-[320px] font-mono text-xs" />
                  {parsedTemplateData ? null : <p className="text-xs text-destructive">Template data must be valid JSON.</p>}
                </div>
                <div className="mt-4 rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                  Select a template to render the subject and body from placeholders. Leave the template blank for direct compose.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-md border-border/70 bg-background/60">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rendered subject</p>
                  <p className="mt-3 text-sm text-foreground">{preview.subject || '-'}</p>
                  <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rendered HTML</p>
                  <div className="mt-3 max-h-[520px] overflow-auto rounded-md border border-border/70 bg-background p-4 text-sm" dangerouslySetInnerHTML={{ __html: preview.htmlBody || '<p>-</p>' }} />
                </CardContent>
              </Card>
              <Card className="rounded-md border-border/70 bg-background/60">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rendered text</p>
                  <pre className="mt-3 max-h-[520px] overflow-auto rounded-md border border-border/70 bg-background p-4 text-sm whitespace-pre-wrap">{preview.textBody || '-'}</pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link to="/admin/dashboard/mailbox/messages">Cancel</Link>
          </Button>
          <Button type="submit" disabled={sending}>
            <SendIcon className="size-4" />
            {sending ? 'Sending...' : 'Send email'}
          </Button>
        </div>
      </form>
    </div>
  )
}

