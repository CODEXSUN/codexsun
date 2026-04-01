import type { MailboxMessage } from '@shared/index'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MailPlusIcon } from 'lucide-react'
import { EntityDetailHeader } from '@/components/entity/entity-detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMailboxMessage, HttpError } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load mailbox message.'
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[170px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

export function MailboxMessageShowPage() {
  const { messageId } = useParams()
  const [item, setItem] = useState<MailboxMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!messageId) return
      setLoading(true)
      setErrorMessage(null)
      try {
        const message = await getMailboxMessage(messageId)
        if (!cancelled) {
          setItem(message)
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
    return () => {
      cancelled = true
    }
  }, [messageId])

  if (loading) {
    return <Card><CardContent className="p-8 text-sm text-muted-foreground">Loading mailbox message...</CardContent></Card>
  }

  if (!item) {
    return <Card><CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Mailbox message not found.'}</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/mailbox/messages"
        backLabel="Back to mailbox"
        title={item.subject}
        description="Review outgoing mail content, recipients, provider feedback, and delivery state."
        isActive={item.status === 'sent'}
        actions={(
          <Button variant="outline" asChild>
            <Link to="/admin/dashboard/mailbox/compose">
              <MailPlusIcon className="size-4" />
              Compose
            </Link>
          </Button>
        )}
      />

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-none px-4">Overview</TabsTrigger>
          <TabsTrigger value="content" className="rounded-none px-4">Content</TabsTrigger>
          <TabsTrigger value="metadata" className="rounded-none px-4">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <table className="w-full border-collapse">
              <tbody>
                <ValueRow label="Status" value={item.status} />
                <ValueRow label="From" value={item.fromName ? `${item.fromName} <${item.fromEmail}>` : item.fromEmail} />
                <ValueRow label="Reply To" value={item.replyTo ?? '-'} />
                <ValueRow label="Template" value={item.templateCode ?? '-'} />
                <ValueRow label="Reference" value={item.referenceType && item.referenceId ? `${item.referenceType} / ${item.referenceId}` : '-'} />
                <ValueRow label="Provider" value={item.provider ?? '-'} />
                <ValueRow label="Provider Id" value={item.providerMessageId ?? '-'} />
                <ValueRow label="Sent At" value={item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'} />
                <ValueRow label="Failed At" value={item.failedAt ? new Date(item.failedAt).toLocaleString() : '-'} />
                <ValueRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <table className="w-full border-collapse">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Type</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Recipient</th>
                </tr>
              </thead>
              <tbody>
                {item.recipients.map((recipient) => (
                  <tr key={recipient.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-foreground"><Badge variant="outline">{recipient.recipientType}</Badge></td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">HTML body</p>
                <div className="mt-3 max-h-[520px] overflow-auto rounded-md border border-border/70 bg-background p-4 text-sm" dangerouslySetInnerHTML={{ __html: item.htmlBody ?? '<p>-</p>' }} />
              </CardContent>
            </Card>
            <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Text body</p>
                <pre className="mt-3 max-h-[520px] overflow-auto rounded-md border border-border/70 bg-background p-4 text-sm whitespace-pre-wrap">{item.textBody ?? '-'}</pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metadata">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <pre className="max-h-[520px] overflow-auto p-4 text-sm whitespace-pre-wrap">{JSON.stringify(item.metadata ?? {}, null, 2)}</pre>
          </div>
          {item.errorMessage ? (
            <Card className="mt-4 border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">{item.errorMessage}</CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

