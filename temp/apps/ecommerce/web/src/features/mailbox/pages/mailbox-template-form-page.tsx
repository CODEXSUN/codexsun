import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, SaveIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createMailboxTemplate,
  getMailboxTemplate,
  HttpError,
  updateMailboxTemplate,
} from '@/shared/api/client'
import { showErrorToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import { renderMailboxTemplate } from '../lib/mailbox-template'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save mailbox template.'
}

export function MailboxTemplateFormPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const isEditing = Boolean(templateId)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Transactional')
  const [description, setDescription] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [htmlTemplate, setHtmlTemplate] = useState('')
  const [textTemplate, setTextTemplate] = useState('')
  const [sampleDataText, setSampleDataText] = useState('{\n  "brandName": "codexsun"\n}')
  const [isSystem, setIsSystem] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!templateId) return
      setLoading(true)
      setErrorMessage(null)
      try {
        const template = await getMailboxTemplate(templateId)
        if (!cancelled) {
          setCode(template.code)
          setName(template.name)
          setCategory(template.category)
          setDescription(template.description ?? '')
          setSubjectTemplate(template.subjectTemplate)
          setHtmlTemplate(template.htmlTemplate ?? '')
          setTextTemplate(template.textTemplate ?? '')
          setSampleDataText(JSON.stringify(template.sampleData ?? {}, null, 2))
          setIsSystem(template.isSystem)
          setIsActive(template.isActive)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [templateId])

  const parsedSampleData = useMemo(() => {
    try {
      return JSON.parse(sampleDataText) as Record<string, unknown>
    } catch {
      return null
    }
  }, [sampleDataText])

  const preview = useMemo(() => ({
    subject: renderMailboxTemplate(subjectTemplate, parsedSampleData ?? {}),
    htmlBody: renderMailboxTemplate(htmlTemplate, parsedSampleData ?? {}),
    textBody: renderMailboxTemplate(textTemplate, parsedSampleData ?? {}),
  }), [htmlTemplate, parsedSampleData, subjectTemplate, textTemplate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (!code.trim() || !name.trim() || !category.trim() || !subjectTemplate.trim() || (!htmlTemplate.trim() && !textTemplate.trim()) || !parsedSampleData) {
      showValidationToast('mail template')
      setErrorMessage('Provide the required template fields and valid sample JSON.')
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
      }

      const saved = isEditing && templateId
        ? await updateMailboxTemplate(templateId, payload)
        : await createMailboxTemplate(payload)

      showSavedToast({
        entityLabel: 'mail template',
        recordName: saved.name,
        referenceId: saved.id,
        mode: isEditing ? 'update' : 'create',
      })
      void navigate('/admin/dashboard/mailbox/templates')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({ title: 'Mail template not saved', description: message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-sm text-muted-foreground">Loading mail template...</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3">
          <Link to="/admin/dashboard/mailbox/templates">
            <ArrowLeft className="size-4" />
            Back to templates
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Manage reusable mail copy, placeholders, and preview output before it is used by OTP or manual compose.</p>
      </div>

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="content" className="rounded-none px-4">Content</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none px-4">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
              <div className="rounded-md border border-border/70 bg-background/60 p-4">
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

                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-subject">Subject template</Label>
                    <Input id="mail-template-subject" value={subjectTemplate} onChange={(event) => setSubjectTemplate(event.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-html">HTML template</Label>
                    <Textarea id="mail-template-html" value={htmlTemplate} onChange={(event) => setHtmlTemplate(event.target.value)} className="min-h-[260px]" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-text">Text template</Label>
                    <Textarea id="mail-template-text" value={textTemplate} onChange={(event) => setTextTemplate(event.target.value)} className="min-h-[180px]" />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/70 bg-background/60 p-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mail-template-sample-data">Sample data JSON</Label>
                    <Textarea id="mail-template-sample-data" value={sampleDataText} onChange={(event) => setSampleDataText(event.target.value)} className="min-h-[220px] font-mono text-xs" />
                    {parsedSampleData ? null : <p className="text-xs text-destructive">Sample data must be valid JSON.</p>}
                  </div>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <input type="checkbox" checked={isSystem} onChange={(event) => setIsSystem(event.target.checked)} className="size-4 rounded border-input" />
                    System template
                  </label>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 rounded border-input" />
                    Active template
                  </label>
                  <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                    Supported placeholders use <code>{'{{key}}'}</code> and dotted paths like <code>{'{{customer.name}}'}</code>.
                  </div>
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
            <Link to="/admin/dashboard/mailbox/templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <SaveIcon className="size-4" />
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </form>
    </div>
  )
}

