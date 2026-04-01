import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MarketingHero } from '@ui/components/marketing/marketing-hero'
import { SectionIntro } from '@ui/components/marketing/section-intro'
import { ShowcaseCard } from '@ui/components/marketing/showcase-card'
import { StatStrip } from '@ui/components/marketing/stat-strip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrandMark } from '@/shared/branding/brand-mark'
import { useBranding } from '@/shared/branding/branding-provider'
import { SiteEnquiryForm } from '@/features/site/components/site-enquiry-form'
import {
  siteBioMilestones,
  siteContactChannels,
  siteHighlights,
  siteNavigationItems,
  sitePrinciples,
  siteProjects,
  siteServices,
  siteTeam,
  siteTemplates,
} from '@/features/site/config/site-content'

function HeroAside() {
  return (
    <>
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <Badge variant="outline">Codexsun</Badge>
          <CardTitle>Software made simple.</CardTitle>
          <CardDescription>
            Public-facing sites, landing pages, and business software positioning built on one shared system.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {siteNavigationItems.slice(1, 5).map((item) => (
            <Link key={item.path} to={item.path} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm font-medium transition hover:border-border hover:bg-muted/20">
              {item.label}
            </Link>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>What Codexsun does</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['Online shopping ecommerce', 'CRM', 'HRMS', 'Accounts', 'Integrations', 'Portfolio websites'].map((item) => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

export function PortfolioHomePage() {
  return (
    <div className="space-y-10 pb-8">
      <MarketingHero
        badge="Codexsun Site"
        eyebrow="Portfolio and landing system"
        title="Business websites and software positioning pages built from one shared Codexsun foundation."
        description="Codexsun builds portfolio websites, landing pages, and software presentation surfaces that explain your business clearly and connect cleanly to ecommerce, CRM, HRMS, billing, and integration workflows."
        actions={[
          { label: 'Start enquiry', href: '/enquiry' },
          { label: 'View projects', href: '/projects', variant: 'outline' },
        ]}
        aside={<HeroAside />}
      />

      <StatStrip items={siteHighlights.map((item) => ({ ...item }))} />

      <section className="space-y-5">
        <SectionIntro badge="Services" title="Pages that sell the work clearly." description="Codexsun websites explain what you do, what problems you solve, and how prospects should start a conversation." action={<Button asChild variant="outline"><Link to="/services">Open services</Link></Button>} />
        <div className="grid gap-4 lg:grid-cols-2">
          {siteServices.map((service) => (
            <ShowcaseCard key={service.title} icon={service.icon} category="Service" title={service.title} description={service.description} tags={service.tags} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionIntro badge="Projects" title="Current Codexsun implementation stories." description="Use the public site to show delivery direction, operating outcomes, and the modules already being shaped in the platform." action={<Button asChild variant="outline"><Link to="/projects">All projects</Link></Button>} />
        <div className="grid gap-4 xl:grid-cols-3">
          {siteProjects.map((project) => (
            <ShowcaseCard key={project.title} icon={project.icon} category={project.category} title={project.title} description={project.description} tags={project.tags} metrics={project.metrics} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <Badge variant="outline">Team and bio</Badge>
            <CardTitle>Show the people and the thinking behind the product.</CardTitle>
            <CardDescription>A Codexsun site should include founder context, team trust, project proof, and direct enquiry capture.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link to="/team">
                Meet the team
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/bio">Read the bio</Link>
            </Button>
          </CardContent>
        </Card>
        <SiteEnquiryForm title="Plan your next site or software launch" description="Use the shared enquiry path for company websites, service pages, landing pages, and business application positioning." />
      </section>
    </div>
  )
}

export function AboutPage() {
  const branding = useBranding()
  return (
    <div className="space-y-8">
      <MarketingHero badge="About Codexsun" eyebrow="Brand and approach" title="Codexsun builds practical business software and the public-facing websites that explain it." description={`${branding.brandName} is shaped around one direct idea: software should make the business easier to understand and easier to run.`} aside={<Card className="border-border/70 shadow-none"><CardHeader><BrandMark /><CardDescription className="text-sm leading-7">{branding.summary}</CardDescription></CardHeader></Card>} />
      <section className="grid gap-4 lg:grid-cols-2">
        {sitePrinciples.map((principle) => (
          <Card key={principle} className="border-border/70 shadow-none"><CardContent className="px-6 py-5 text-sm leading-7 text-muted-foreground">{principle}</CardContent></Card>
        ))}
      </section>
      <section className="space-y-5">
        <SectionIntro badge="Bio" title="Company direction" description="The site narrative should connect company story, software delivery, and current implementation focus." />
        <div className="grid gap-4 lg:grid-cols-3">
          {siteBioMilestones.map((milestone) => (
            <Card key={milestone.title} className="border-border/70 shadow-none"><CardHeader><Badge variant="outline">{milestone.year}</Badge><CardTitle>{milestone.title}</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">{milestone.description}</CardContent></Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export function ServicesPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Services" title="Codexsun service pages for websites and business software." description="These are the service areas the site should explain clearly, with enough structure for future proposals, pricing, and implementation scoping." />
      <div className="grid gap-4 lg:grid-cols-2">
        {siteServices.map((service) => (
          <ShowcaseCard key={service.title} icon={service.icon} category="Service area" title={service.title} description={service.description} tags={service.tags} />
        ))}
      </div>
    </div>
  )
}

export function ProjectsPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Projects" title="Existing Codexsun project stories." description="Public proof points for current work across platform positioning, operations apps, and website lead funnels." />
      <div className="grid gap-4 xl:grid-cols-3">
        {siteProjects.map((project) => (
          <ShowcaseCard key={project.title} icon={project.icon} category={project.category} title={project.title} description={project.description} tags={project.tags} metrics={project.metrics} />
        ))}
      </div>
    </div>
  )
}

export function TemplatesPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Templates" title="Reusable site templates for Codexsun delivery." description="Template sets reduce launch time while keeping marketing pages consistent across service-led and software-led websites." />
      <div className="grid gap-4 lg:grid-cols-2">
        {siteTemplates.map((template) => (
          <ShowcaseCard key={template.title} icon={template.icon} category={template.audience} title={template.title} description={template.description} tags={template.tags} />
        ))}
      </div>
    </div>
  )
}

export function TeamPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Team" title="People behind the delivery." description="Use this page to show who leads product direction, implementation, support, and content across Codexsun projects." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {siteTeam.map((member) => (
          <Card key={member.name} className="border-border/70 shadow-none"><CardHeader><div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-lg font-semibold text-foreground">{member.initials}</div><CardTitle>{member.name}</CardTitle><CardDescription>{member.role}</CardDescription></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">{member.focus}</CardContent></Card>
        ))}
      </div>
    </div>
  )
}

export function BioPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Bio" title="Codexsun company and founder bio." description="This page gives the public site a trust-building narrative that connects product thinking, implementation discipline, and future direction." />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-none"><CardHeader><CardTitle>Software, operations, and clarity.</CardTitle><CardDescription>Codexsun focuses on business systems that are understandable to operators, not just developers. The goal is to reduce confusion between ecommerce, customer workflows, HR, accounts, and integration work.</CardDescription></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">The same design direction used in the apps is also used in the site. That keeps the public promise aligned with the real product experience.</CardContent></Card>
        <div className="grid gap-4">
          {siteBioMilestones.map((milestone) => (
            <Card key={milestone.title} className="border-border/70 shadow-none"><CardHeader><Badge variant="outline">{milestone.year}</Badge><CardTitle>{milestone.title}</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">{milestone.description}</CardContent></Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ContactPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <Badge variant="outline">Contact</Badge>
          <CardTitle>Talk to Codexsun about websites or software delivery.</CardTitle>
          <CardDescription>Use direct contact details for first touch, then move structured opportunities into the enquiry flow.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {siteContactChannels.map((channel) => (
            <div key={channel.label} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{channel.label}</p><p className="mt-1 text-sm font-medium text-foreground">{channel.value}</p></div>
          ))}
        </CardContent>
      </Card>
      <SiteEnquiryForm title="Request a review" description="Capture enough detail for website, software, and integration discussions without overloading the first conversation." />
    </div>
  )
}

export function EnquiryPage() {
  return (
    <div className="space-y-8">
      <SectionIntro badge="Enquiry" title="Start with the business need." description="This page collects meaningful context for a portfolio website, landing page, or software-led project without forcing a long discovery process upfront." />
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <Card className="border-border/70 shadow-none"><CardHeader><CardTitle>What to include</CardTitle><CardDescription>Short, useful context leads to a better first response.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm leading-7 text-muted-foreground"><div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">What kind of site or software surface do you need?</div><div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">Which modules matter most: ecommerce, CRM, HRMS, accounts, or integrations?</div><div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">What is the expected launch timing and who needs to review it internally?</div></CardContent></Card>
        <SiteEnquiryForm />
      </div>
    </div>
  )
}
