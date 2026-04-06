import { ArrowLeft, SendHorizonal } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import type {
  MailboxSendPayload,
  MailboxTemplate,
  MailboxTemplateListResponse,
} from "@cxapp/shared"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { SectionShell } from "../framework-users/user-shared"
import {
  getFrameworkMailboxTemplate,
  listFrameworkMailboxTemplates,
  sendFrameworkMailboxMessage,
} from "./mail-api"
import { createTemplatePreview, parseRecipientList } from "./mail-template"

export function FrameworkMailComposeSection() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<MailboxTemplateListResponse["items"]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MailboxTemplate | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toText, setToText] = useState("")
  const [ccText, setCcText] = useState("")
  const [bccText, setBccText] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [textBody, setTextBody] = useState("")
  const [templateDataText, setTemplateDataText] = useState(
    JSON.stringify(
      {
        displayName: "Workspace User",
        otp: "123456",
        expiryMinutes: 10,
      },
      null,
      2
    )
  )
  useGlobalLoading(loadingTemplates || sending)

  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      setLoadingTemplates(true)
      setError(null)

      try {
        const response = await listFrameworkMailboxTemplates(false)

        if (!cancelled) {
          setTemplates(response.items)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load templates.")
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplates(false)
        }
      }
    }

    void loadTemplates()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedTemplate() {
      if (!templateId) {
        setSelectedTemplate(null)
        return
      }

      try {
        const response = await getFrameworkMailboxTemplate(templateId)

        if (!cancelled) {
          setSelectedTemplate(response.item)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load selected template."
          )
          setSelectedTemplate(null)
        }
      }
    }

    void loadSelectedTemplate()

    return () => {
      cancelled = true
    }
  }, [templateId])

  const parsedTemplateData = useMemo(() => {
    try {
      return JSON.parse(templateDataText) as Record<string, unknown>
    } catch {
      return null
    }
  }, [templateDataText])

  const preview = useMemo(
    () =>
      createTemplatePreview(selectedTemplate, parsedTemplateData ?? {}, {
        subject,
        htmlBody,
        textBody,
      }),
    [htmlBody, parsedTemplateData, selectedTemplate, subject, textBody]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const to = parseRecipientList(toText)
    const cc = parseRecipientList(ccText)
    const bcc = parseRecipientList(bccText)

    if (to.length === 0) {
      setError("Add at least one recipient.")
      return
    }

    if (!parsedTemplateData) {
      setError("Template data must be valid JSON.")
      return
    }

    if (!selectedTemplate && !subject.trim()) {
      setError("Subject is required when no template is selected.")
      return
    }

    if (!selectedTemplate && !htmlBody.trim() && !textBody.trim()) {
      setError("Provide an HTML or text body when no template is selected.")
      return
    }

    setSending(true)

    try {
      const response = await sendFrameworkMailboxMessage({
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
      } satisfies MailboxSendPayload)

      void navigate(`/dashboard/mail-service/messages/${encodeURIComponent(response.item.id)}`)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <SectionShell
      title="Compose Email"
      description="Send direct mail or render from a saved template while keeping a complete delivery ledger inside CxSun."
      actions={
        <Button variant="outline" asChild>
          <Link to="/dashboard/mail-service">
            <ArrowLeft className="size-4" />
            Back to mail service
          </Link>
        </Button>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="compose" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
              <Card className="border-border/70 bg-background/80">
                <CardContent className="grid gap-4 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="mail-compose-to">To</Label>
                      <Input id="mail-compose-to" value={toText} onChange={(event) => setToText(event.target.value)} placeholder="alice@example.com, bob@example.com" />
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
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <option value="">Direct compose</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-subject">Subject</Label>
                    <Input id="mail-compose-subject" value={subject} disabled={Boolean(selectedTemplate)} onChange={(event) => setSubject(event.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-html">HTML body</Label>
                    <Textarea id="mail-compose-html" value={htmlBody} disabled={Boolean(selectedTemplate)} onChange={(event) => setHtmlBody(event.target.value)} className="min-h-[260px]" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-text">Text body</Label>
                    <Textarea id="mail-compose-text" value={textBody} disabled={Boolean(selectedTemplate)} onChange={(event) => setTextBody(event.target.value)} className="min-h-[180px]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="text-base">Template data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="mail-compose-data">Preview data JSON</Label>
                    <Textarea id="mail-compose-data" value={templateDataText} onChange={(event) => setTemplateDataText(event.target.value)} className="min-h-[320px] font-mono text-xs" />
                  </div>
                  <p className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
                    Select a saved template to lock the subject and body to that layout. Leave the template blank for one-off direct messages.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="text-base">Rendered email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subject</p>
                    <p className="mt-2 text-sm text-foreground">{preview.subject || "-"}</p>
                  </div>
                  <div className="max-h-[540px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm" dangerouslySetInnerHTML={{ __html: preview.htmlBody || "<p>-</p>" }} />
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="text-base">Plain text fallback</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[620px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm whitespace-pre-wrap">
                    {preview.textBody || "-"}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link to="/dashboard/mail-service">Cancel</Link>
          </Button>
          <Button type="submit" disabled={sending}>
            <SendHorizonal className="size-4" />
            {sending ? "Sending..." : "Send email"}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}
