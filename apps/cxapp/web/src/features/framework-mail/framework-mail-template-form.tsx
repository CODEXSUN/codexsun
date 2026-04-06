import { ArrowLeft, Save } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import type { MailboxTemplateUpsertPayload } from "@cxapp/shared"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { SectionShell, StateCard } from "../framework-users/user-shared"
import {
  createFrameworkMailboxTemplate,
  getFrameworkMailboxTemplate,
  updateFrameworkMailboxTemplate,
} from "./mail-api"
import { renderMailboxTemplate } from "./mail-template"

export function FrameworkMailTemplateForm() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const [loading, setLoading] = useState(Boolean(templateId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("auth")
  const [description, setDescription] = useState("")
  const [subjectTemplate, setSubjectTemplate] = useState("")
  const [htmlTemplate, setHtmlTemplate] = useState("")
  const [textTemplate, setTextTemplate] = useState("")
  const [sampleDataText, setSampleDataText] = useState(
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
  const [isSystem, setIsSystem] = useState(false)
  const [isActive, setIsActive] = useState(true)
  useGlobalLoading(loading || saving)

  useEffect(() => {
    let cancelled = false

    async function loadTemplate() {
      if (!templateId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await getFrameworkMailboxTemplate(templateId)

        if (!cancelled) {
          setCode(response.item.code)
          setName(response.item.name)
          setCategory(response.item.category)
          setDescription(response.item.description ?? "")
          setSubjectTemplate(response.item.subjectTemplate)
          setHtmlTemplate(response.item.htmlTemplate ?? "")
          setTextTemplate(response.item.textTemplate ?? "")
          setSampleDataText(JSON.stringify(response.item.sampleData ?? {}, null, 2))
          setIsSystem(response.item.isSystem)
          setIsActive(response.item.isActive)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load template.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadTemplate()

    return () => {
      cancelled = true
    }
  }, [templateId])

  const parsedSampleData = useMemo(() => {
    try {
      return JSON.parse(sampleDataText) as Record<string, unknown>
    } catch {
      return null
    }
  }, [sampleDataText])

  const preview = useMemo(
    () => ({
      subject: renderMailboxTemplate(subjectTemplate, parsedSampleData ?? {}),
      htmlBody: renderMailboxTemplate(htmlTemplate, parsedSampleData ?? {}),
      textBody: renderMailboxTemplate(textTemplate, parsedSampleData ?? {}),
    }),
    [htmlTemplate, parsedSampleData, subjectTemplate, textTemplate]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (
      !code.trim() ||
      !name.trim() ||
      !category.trim() ||
      !subjectTemplate.trim() ||
      (!htmlTemplate.trim() && !textTemplate.trim())
    ) {
      setError("Provide the required template fields before saving.")
      return
    }

    if (!parsedSampleData) {
      setError("Sample data must be valid JSON.")
      return
    }

    setSaving(true)

    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || null,
        subjectTemplate: subjectTemplate.trim(),
        htmlTemplate: htmlTemplate.trim() || null,
        textTemplate: textTemplate.trim() || null,
        sampleData: parsedSampleData,
        isSystem,
        isActive,
      } satisfies MailboxTemplateUpsertPayload

      if (templateId) {
        await updateFrameworkMailboxTemplate(templateId, payload)
      } else {
        await createFrameworkMailboxTemplate(payload)
      }

      void navigate("/dashboard/mail-service/templates")
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save mail template."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <StateCard message="Loading mail template..." />
  }

  return (
    <SectionShell
      title={templateId ? "Edit Mail Template" : "New Mail Template"}
      description="Build reusable HTML and text templates for OTP and application email with live placeholder preview."
      actions={
        <Button variant="outline" asChild>
          <Link to="/dashboard/mail-service/templates">
            <ArrowLeft className="size-4" />
            Back to templates
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
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
              <Card className="border-border/70 bg-background/80">
                <CardContent className="grid gap-4 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="mail-template-code">Code</Label>
                      <Input id="mail-template-code" value={code} onChange={(event) => setCode(event.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mail-template-name">Name</Label>
                      <Input id="mail-template-name" value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mail-template-category">Category</Label>
                      <Input id="mail-template-category" value={category} onChange={(event) => setCategory(event.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mail-template-description">Description</Label>
                      <Input id="mail-template-description" value={description} onChange={(event) => setDescription(event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-subject">Subject template</Label>
                    <Input id="mail-template-subject" value={subjectTemplate} onChange={(event) => setSubjectTemplate(event.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-html">HTML template</Label>
                    <Textarea id="mail-template-html" value={htmlTemplate} onChange={(event) => setHtmlTemplate(event.target.value)} className="min-h-[320px] font-mono text-xs" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-text">Text template</Label>
                    <Textarea id="mail-template-text" value={textTemplate} onChange={(event) => setTextTemplate(event.target.value)} className="min-h-[200px] font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="text-base">Rendering data</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-sample-data">Sample data JSON</Label>
                    <Textarea id="mail-template-sample-data" value={sampleDataText} onChange={(event) => setSampleDataText(event.target.value)} className="min-h-[260px] font-mono text-xs" />
                  </div>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <Checkbox checked={isSystem} onCheckedChange={(checked) => setIsSystem(Boolean(checked))} />
                    System template
                  </label>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(Boolean(checked))} />
                    Active template
                  </label>
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
                    Use placeholders like <code>{"{{displayName}}"}</code> or nested values like <code>{"{{customer.name}}"}</code>.
                  </div>
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
            <Link to="/dashboard/mail-service/templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : templateId ? "Save changes" : "Create template"}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}
