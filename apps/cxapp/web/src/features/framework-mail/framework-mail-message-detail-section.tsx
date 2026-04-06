import { ArrowLeft, MailPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import type { MailboxMessage } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { SectionShell, StateCard } from "../framework-users/user-shared"
import { getFrameworkMailboxMessage } from "./mail-api"

function ValueItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export function FrameworkMailMessageDetailSection() {
  const { messageId } = useParams()
  const [item, setItem] = useState<MailboxMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useGlobalLoading(loading)

  useEffect(() => {
    let cancelled = false

    async function loadMessage() {
      if (!messageId) {
        setError("Mailbox message id is required.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await getFrameworkMailboxMessage(messageId)

        if (!cancelled) {
          setItem(response.item)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load mailbox message."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMessage()

    return () => {
      cancelled = true
    }
  }, [messageId])

  if (loading) {
    return <StateCard message="Loading mailbox message..." />
  }

  if (!item) {
    return <StateCard message={error ?? "Mailbox message not found."} />
  }

  return (
    <SectionShell
      title={item.subject}
      description="Inspect recipients, provider status, rendered content, and payload metadata for this email."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/dashboard/mail-service">
              <ArrowLeft className="size-4" />
              Back to mail service
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/mail-service/compose">
              <MailPlus className="size-4" />
              Compose
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ValueItem label="Status" value={item.status} />
        <ValueItem
          label="From"
          value={item.fromName ? `${item.fromName} <${item.fromEmail}>` : item.fromEmail}
        />
        <ValueItem label="Template" value={item.templateCode ?? "-"} />
        <ValueItem label="Provider" value={item.provider ?? "-"} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="text-base">Message details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <ValueItem label="Reply to" value={item.replyTo ?? "-"} />
                <ValueItem
                  label="Reference"
                  value={
                    item.referenceType && item.referenceId
                      ? `${item.referenceType} / ${item.referenceId}`
                      : "-"
                  }
                />
                <ValueItem label="Provider id" value={item.providerMessageId ?? "-"} />
                <ValueItem
                  label="Sent at"
                  value={item.sentAt ? new Date(item.sentAt).toLocaleString() : "-"}
                />
                <ValueItem
                  label="Failed at"
                  value={item.failedAt ? new Date(item.failedAt).toLocaleString() : "-"}
                />
                <ValueItem label="Created" value={new Date(item.createdAt).toLocaleString()} />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="text-base">Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {recipient.name
                          ? `${recipient.name} <${recipient.email}>`
                          : recipient.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(recipient.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{recipient.recipientType}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="text-base">HTML body</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="max-h-[560px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: item.htmlBody ?? "<p>-</p>" }}
                />
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="text-base">Text body</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[560px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm whitespace-pre-wrap">
                  {item.textBody ?? "-"}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="metadata" className="space-y-4">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="text-base">Stored metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[560px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm whitespace-pre-wrap">
                {JSON.stringify(item.metadata ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
          {item.errorMessage ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {item.errorMessage}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </SectionShell>
  )
}
