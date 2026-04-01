import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { siteEnquiryTopics } from '@/features/site/config/site-content'
import { showSuccessToast } from '@/shared/notifications/toast'

interface SiteEnquiryFormProps {
  title?: string
  description?: string
}

export function SiteEnquiryForm({
  title = 'Start an enquiry',
  description = 'Share the business context, required pages, and target software or workflow scope.',
}: SiteEnquiryFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    topic: siteEnquiryTopics[0],
    phone: '',
    message: '',
  })

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="site-enquiry-name">Name</Label>
            <Input id="site-enquiry-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Operations lead" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="site-enquiry-email">Email</Label>
            <Input id="site-enquiry-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="team@company.com" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="site-enquiry-company">Company</Label>
            <Input id="site-enquiry-company" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} placeholder="Prospect company" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="site-enquiry-phone">Phone</Label>
            <Input id="site-enquiry-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+91 90000 00000" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="site-enquiry-topic">Topic</Label>
          <select
            id="site-enquiry-topic"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={form.topic}
            onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
          >
            {siteEnquiryTopics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="site-enquiry-message">Message</Label>
          <Textarea
            id="site-enquiry-message"
            rows={7}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder="Explain the business model, needed pages, modules, target region, and expected launch."
            className="min-h-40 resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/15 px-4 py-3 text-sm">
          <p className="text-muted-foreground">This form is UI-ready now and can be connected to CRM or mailbox capture later.</p>
          <Button
            type="button"
            onClick={() => {
              showSuccessToast({
                title: 'Enquiry captured',
                description: `Prepared ${form.topic.toLowerCase()} enquiry for follow-up.`,
              })
            }}
          >
            Send enquiry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
