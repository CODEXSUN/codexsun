import { ArrowUpRight, Globe2, LayoutTemplate, Users, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionIntro } from '@ui/components/marketing/section-intro'
import { ShowcaseCard } from '@ui/components/marketing/showcase-card'
import { StatStrip } from '@ui/components/marketing/stat-strip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteEnquiryForm } from '@/features/site/components/site-enquiry-form'
import {
  siteBioMilestones,
  siteContactChannels,
  siteHighlights,
  siteProjects,
  siteServices,
  siteTeam,
  siteTemplates,
} from '@/features/site/config/site-content'

export function SiteWorkspacePage() {
  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
          <Badge className="px-4 py-1.5">Site</Badge>
          <div className="mt-3 max-w-3xl space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Codexsun portfolio sites and landing pages.</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Build company profile pages, software positioning pages, project showcases, team credibility pages, and enquiry funnels from one shared site workspace.
            </p>
          </div>
        </CardHeader>
      </Card>

      <StatStrip items={siteHighlights.map((item) => ({ ...item }))} />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Site scope</CardTitle>
            <CardDescription>The site app now covers the full Codexsun marketing surface instead of only a placeholder shell.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              'Landing home page for Codexsun software offering',
              'About, services, projects, templates, team, bio, and enquiry pages',
              'Direct contact and structured enquiry capture pages',
              'Shared content reused across public web and admin workspace routes',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">{item}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Public site routes</CardTitle>
            <CardDescription>These routes are ready for the `web` target and reuse the same site content set.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {['/', '/about', '/services', '/projects', '/templates', '/team', '/bio', '/enquiry', '/contact'].map((route) => (
              <div key={route} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{route}</span>
                <Link to={route} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">Open<ArrowUpRight className="size-4" /></Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SiteProjectsPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Projects" title="Public showcase projects" description="Use these cards to present Codexsun implementation areas and software proof points." />
      <div className="grid gap-4 xl:grid-cols-3">
        {siteProjects.map((project) => (
          <ShowcaseCard key={project.title} icon={project.icon} category={project.category} title={project.title} description={project.description} metrics={project.metrics} tags={project.tags} />
        ))}
      </div>
    </div>
  )
}

export function SiteTemplatesPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Templates" title="Reusable site templates" description="Starter structures for software companies, service launches, implementation showcases, and multi-module product suites." />
      <div className="grid gap-4 lg:grid-cols-2">
        {siteTemplates.map((template) => (
          <ShowcaseCard key={template.title} icon={template.icon} category={template.audience} title={template.title} description={template.description} tags={template.tags} />
        ))}
      </div>
    </div>
  )
}

export function SiteTeamPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Team" title="Public team presentation" description="Team cards can be reused in company pages, proposals, and trust sections." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {siteTeam.map((member) => (
          <Card key={member.name} className="border-border/70 shadow-none">
            <CardHeader>
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-lg font-semibold text-foreground">{member.initials}</div>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">{member.focus}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function SiteBioPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Bio" title="Founder and company bio blocks" description="A site needs more than a service list. These narrative sections add trust and continuity to the brand story." />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Recommended bio ingredients</CardTitle>
            <CardDescription>Keep the story practical and tied to business outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">What problem the company started to solve</div>
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">How the software suite grew across modules</div>
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">What kind of clients and operating teams it serves</div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {siteBioMilestones.map((milestone) => (
            <Card key={milestone.title} className="border-border/70 shadow-none">
              <CardHeader>
                <Badge variant="outline">{milestone.year}</Badge>
                <CardTitle>{milestone.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">{milestone.description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SiteEnquiriesPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Enquiries" title="Lead capture coverage" description="The public site now includes a structured enquiry page and contact route. This workspace keeps the expected enquiry shape visible for future CRM hookup." />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Public contact routes</CardTitle>
            <CardDescription>Visitors can reach Codexsun through direct contact or full enquiry capture.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">`/contact` for direct outreach and context capture</div>
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">`/enquiry` for deeper website or software requirement capture</div>
            {siteContactChannels.map((channel) => (
              <div key={channel.label} className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm"><span className="font-medium text-foreground">{channel.label}</span><span className="ml-2 text-muted-foreground">{channel.value}</span></div>
            ))}
          </CardContent>
        </Card>
        <SiteEnquiryForm title="Shared enquiry form" description="Current UI flow is ready. Storage and CRM handoff can plug in without redesigning the page later." />
      </div>
    </div>
  )
}

export function SiteServicesSnapshotPage() {
  return (
    <div className="space-y-4">
      <SectionIntro badge="Services" title="Site service modules" description="These sections define what the public site should explain about Codexsun." />
      <div className="grid gap-4 lg:grid-cols-2">
        {siteServices.map((service) => (
          <ShowcaseCard key={service.title} icon={service.icon} category="Service area" title={service.title} description={service.description} tags={service.tags} />
        ))}
      </div>
      <Card className="border-border/70 shadow-none">
        <CardContent className="grid gap-4 px-6 py-6 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4"><Globe2 className="size-5 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">Portfolio websites</p></div>
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4"><LayoutTemplate className="size-5 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">Landing pages</p></div>
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4"><Workflow className="size-5 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">Software positioning</p></div>
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4"><Users className="size-5 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">Trust pages</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
