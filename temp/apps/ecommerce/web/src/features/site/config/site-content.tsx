import type { LucideIcon } from 'lucide-react'
import {
  Blocks,
  BookTemplate,
  BriefcaseBusiness,
  Building2,
  Globe2,
  Handshake,
  Layers3,
  LayoutTemplate,
  MonitorSmartphone,
  Palette,
  Rocket,
  Users,
  Workflow,
} from 'lucide-react'

export interface SiteService {
  title: string
  description: string
  icon: LucideIcon
  tags: string[]
}

export interface SiteProject {
  title: string
  category: string
  description: string
  icon: LucideIcon
  metrics: Array<{ label: string; value: string }>
  tags: string[]
}

export interface SiteTemplate {
  title: string
  audience: string
  description: string
  icon: LucideIcon
  tags: string[]
}

export interface SiteTeamMember {
  name: string
  role: string
  focus: string
  initials: string
}

export interface SiteMilestone {
  year: string
  title: string
  description: string
}

export const siteNavigationItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Projects', path: '/projects' },
  { label: 'Templates', path: '/templates' },
  { label: 'Team', path: '/team' },
  { label: 'Bio', path: '/bio' },
  { label: 'Enquiry', path: '/enquiry' },
  { label: 'Contact', path: '/contact' },
] as const

export const siteWorkspaceItems = [
  {
    id: 'site-overview',
    name: 'Site Overview',
    route: '/admin/dashboard/site',
    summary: 'Portfolio landing direction, value proposition, and rollout fit for Codexsun.',
    icon: Globe2,
  },
  {
    id: 'site-projects',
    name: 'Projects',
    route: '/admin/dashboard/site/projects',
    summary: 'Showcase implementation stories, delivery outcomes, and public proof points.',
    icon: BriefcaseBusiness,
  },
  {
    id: 'site-services',
    name: 'Services',
    route: '/admin/dashboard/site/services',
    summary: 'Define public-facing service narratives for websites, landing pages, and software positioning.',
    icon: Workflow,
  },
  {
    id: 'site-templates',
    name: 'Templates',
    route: '/admin/dashboard/site/templates',
    summary: 'Reusable landing-page structures for portfolio, service, and product-led sites.',
    icon: LayoutTemplate,
  },
  {
    id: 'site-team',
    name: 'Team',
    route: '/admin/dashboard/site/team',
    summary: 'Public-facing team introductions, roles, and operating strengths.',
    icon: Users,
  },
  {
    id: 'site-bio',
    name: 'Bio',
    route: '/admin/dashboard/site/bio',
    summary: 'Founder and company narrative for trust-building pages and proposals.',
    icon: Building2,
  },
  {
    id: 'site-enquiries',
    name: 'Enquiries',
    route: '/admin/dashboard/site/enquiries',
    summary: 'Lead capture paths, enquiry form coverage, and inbound qualification expectations.',
    icon: Handshake,
  },
] as const

export const siteHighlights = [
  {
    label: 'Delivery Areas',
    value: '6',
    hint: 'Ecommerce, CRM, HRMS, accounts, integrations, and websites.',
    icon: Layers3,
  },
  {
    label: 'Reusable Templates',
    value: '4',
    hint: 'Starter structures for landing pages, service sites, and company profiles.',
    icon: BookTemplate,
  },
  {
    label: 'Launch Model',
    value: 'Web + Desktop',
    hint: 'Shared product thinking across browser-facing and operator-facing surfaces.',
    icon: MonitorSmartphone,
  },
  {
    label: 'Positioning',
    value: 'Software Made Simple',
    hint: 'Direct messaging built around business clarity rather than technical noise.',
    icon: Rocket,
  },
] as const

export const siteServices: SiteService[] = [
  {
    title: 'Portfolio Websites',
    description: 'Codexsun designs company websites that explain what you do, where you deliver, and how prospects should contact your team.',
    icon: Globe2,
    tags: ['Corporate sites', 'Company profiles', 'Public pages'],
  },
  {
    title: 'Landing Pages',
    description: 'Focused launch pages for campaigns, products, services, and regional market pushes with clear conversion paths.',
    icon: Palette,
    tags: ['Campaign pages', 'Lead capture', 'Launch support'],
  },
  {
    title: 'Business App Positioning',
    description: 'Messaging and interface structure for ecommerce, CRM, HRMS, accounts, and operations software.',
    icon: Workflow,
    tags: ['ERP positioning', 'Modules', 'B2B messaging'],
  },
  {
    title: 'Template Systems',
    description: 'Reusable sections, cards, and case-study layouts so every new site starts from a stronger baseline.',
    icon: Blocks,
    tags: ['Reusable sections', 'Consistent branding', 'Faster rollout'],
  },
]

export const siteProjects: SiteProject[] = [
  {
    title: 'Codexsun Business Suite',
    category: 'Platform Positioning',
    description: 'Unified brand positioning for ecommerce, CRM, HRMS, accounts, and integration modules inside one business software narrative.',
    icon: Workflow,
    metrics: [
      { label: 'Apps framed', value: '5 core suites' },
      { label: 'Audience', value: 'SME operators' },
    ],
    tags: ['Branding', 'Architecture', 'Product messaging'],
  },
  {
    title: 'Billing And Accounts Experience',
    category: 'Operations App',
    description: 'Clean workspace structure for invoices, ledgers, payments, journals, contra, and GST-focused accounting flow.',
    icon: BriefcaseBusiness,
    metrics: [
      { label: 'Workflows', value: '8 finance modules' },
      { label: 'Platform', value: 'Web + Desktop' },
    ],
    tags: ['Billing', 'Accounts', 'Operator UX'],
  },
  {
    title: 'Portfolio And Enquiry Funnel',
    category: 'Website Rollout',
    description: 'Marketing-first page system for about, services, projects, team, bio, contact, and structured enquiry collection.',
    icon: LayoutTemplate,
    metrics: [
      { label: 'Page types', value: '8 public pages' },
      { label: 'Intent', value: 'Lead generation' },
    ],
    tags: ['Portfolio', 'Enquiry', 'Lead capture'],
  },
]

export const siteTemplates: SiteTemplate[] = [
  {
    title: 'Software Company Profile',
    audience: 'B2B software teams',
    description: 'A full company website structure with services, projects, team, bio, and enquiry-ready conversion sections.',
    icon: Building2,
    tags: ['Company intro', 'Services', 'Projects'],
  },
  {
    title: 'Campaign Landing Page',
    audience: 'Product or service launch',
    description: 'Short-form persuasive layout for offers, product releases, or new market entry pages.',
    icon: Rocket,
    tags: ['CTA-heavy', 'Offer page', 'Fast launch'],
  },
  {
    title: 'Implementation Showcase',
    audience: 'Consulting and delivery teams',
    description: 'Case-study style page set focused on execution proof, outcomes, and delivery confidence.',
    icon: BriefcaseBusiness,
    tags: ['Case study', 'Proof', 'Outcomes'],
  },
  {
    title: 'Product Suite Landing',
    audience: 'Multi-module products',
    description: 'Section pattern for showing interconnected modules such as ecommerce, CRM, HRMS, and billing.',
    icon: Layers3,
    tags: ['Modules', 'Suite story', 'Cross-sell'],
  },
]

export const siteTeam: SiteTeamMember[] = [
  {
    name: 'Sundar',
    role: 'Founder',
    focus: 'Product direction, system design, and implementation strategy for Codexsun customer rollouts.',
    initials: 'SU',
  },
  {
    name: 'Delivery Team',
    role: 'Implementation',
    focus: 'Project onboarding, module setup, data readiness, and business process alignment.',
    initials: 'DT',
  },
  {
    name: 'Design And Content',
    role: 'Brand And UI',
    focus: 'Landing page structure, proposal assets, positioning, and reusable component systems.',
    initials: 'DC',
  },
  {
    name: 'Support Operations',
    role: 'Client Success',
    focus: 'Training, follow-up, issue capture, and practical workflow improvements after go-live.',
    initials: 'CS',
  },
]

export const siteBioMilestones: SiteMilestone[] = [
  {
    year: 'Foundation',
    title: 'Codexsun started as a practical business software effort.',
    description: 'The focus was simple: reduce fragmented tools and give small and mid-size businesses one connected operating system.',
  },
  {
    year: 'Expansion',
    title: 'The platform grew from software delivery into portfolio-ready products.',
    description: 'Ecommerce, CRM, HRMS, accounts, and integrations became part of one shared product narrative.',
  },
  {
    year: 'Current',
    title: 'Now the platform is being shaped as one reusable web and desktop suite.',
    description: 'That includes internal operator experiences, public marketing sites, and modular app workspaces built from the same base.',
  },
]

export const sitePrinciples = [
  'Explain business value before technical detail.',
  'Use one consistent brand system across public websites and internal applications.',
  'Design marketing pages so they can turn into working product surfaces later.',
  'Keep enquiry capture direct, short, and tied to practical business needs.',
] as const

export const siteContactChannels = [
  { label: 'Email', value: 'hello@codexsun.com' },
  { label: 'Phone', value: '+91 95141 41494' },
  { label: 'Location', value: 'Chennai, India' },
  { label: 'Website', value: 'codexsun.com' },
] as const

export const siteEnquiryTopics = [
  'Portfolio website',
  'Landing page',
  'Ecommerce',
  'Billing and accounts',
  'CRM or HRMS',
  'Integration and automation',
] as const
