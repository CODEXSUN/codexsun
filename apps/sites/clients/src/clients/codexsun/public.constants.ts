import codexsunBillingPreview from "./assets/demo/work/codexsun-billing-suite.png";
import codexsunPlatformPreview from "./assets/demo/work/codexsun-platform.png";
import zeroCompanionPreview from "./assets/demo/work/zero-ai-companion.png";
import aiTrustImage from "./assets/uploads/insights/ai-trust.png";
import clarityWorkflowsImage from "./assets/uploads/insights/clarity-workflows.png";
import deepListeningImage from "./assets/uploads/insights/deep-listening.png";

const PLATFORM_WEB_ORIGIN = (import.meta.env.VITE_PLATFORM_WEB_ORIGIN ?? "").replace(/\/$/, "");

export function platformUrl(path: string) {
  return `${PLATFORM_WEB_ORIGIN}${path}`;
}

export const SITE_TITLE = "CODEXSUN";
export const CORE_LINE = "Software makes simple.";
export const HERO_TITLE = "WE TURN\nCOMPLEXITY\nINTO CLARITY";

export type HeroMessage = {
  title: string;
  description: string;
};

export const HERO_MESSAGES: readonly HeroMessage[] = [
  {
    title: "One clean workspace for the work that runs your business",
    description:
      "Run your website, billing, users, and daily work from one clean workspace that feels easy from the first click."
  },
  {
    title: "Billing work without the daily confusion",
    description:
      "Prepare sales, receipts, payments, and reports in a focused flow, so office work stays clear and accountable."
  },
  {
    title: "Start small, grow when your business is ready",
    description:
      "Use the tools you need now, then add more workflows as your customers, accounts, website, and operations grow."
  }
] as const;

export const NAV_ITEMS = [
  { id: "hero", label: "Home" },
  { id: "work", label: "Products" },
  { id: "approach", label: "Enterprise" },
  { id: "capabilities", label: "Customers" },
  { id: "insights", label: "Partners" },
  { id: "about", label: "Resources" },
  { id: "contact", label: "Contact" }
] as const;

export const PRODUCT_NAV_ITEMS = [
  { id: "product-selected", label: "Selected Work" },
  { id: "product-outcomes", label: "Product Outcomes" }
] as const;

export const CAPABILITIES = [
  {
    id: "strategy",
    title: "Business Platform",
    summary: "A modular operating layer for companies, teams, branches and industries."
  },
  {
    id: "design",
    title: "Unified Experience",
    summary: "Dense, clear workspaces designed for real business operations."
  },
  {
    id: "engineering",
    title: "Billing & Accounting",
    summary: "Indian billing, GST-ready documents, ledgers, payments and financial control."
  },
  {
    id: "ai",
    title: "AI & Automation",
    summary: "Permission-aware assistance, workflow automation and operational intelligence."
  },
  {
    id: "cloud",
    title: "Cloud & Offline",
    summary: "Tenant isolation, deployable app bundles and sync-ready workflows."
  },
  {
    id: "care",
    title: "Product Care",
    summary: "Migration, monitoring, support and continuous platform evolution."
  }
] as const;

export type WorkItem = {
  title: string;
  slug: string;
  type: string;
  client: string;
  year: string;
  role: string;
  heroLine: string;
  problem: string;
  research: string;
  design: string;
  engineering: string;
  result: string;
  impact: string;
  description: string;
  visual: string;
  previewImage: string;
  previewImages: string[];
  status: "live" | "draft" | "building";
  visibility: "public" | "private";
  previewUrl: string;
  liveUrl: string;
  repoUrl: string;
  caseStudyUrl: string;
  version: string;
  stack: string[];
  services: string[];
  metrics: Array<{ label: string; value: string; detail: string }>;
  deployment: {
    provider: "vercel" | "custom" | "none";
    projectName: string;
    productionUrl: string;
    previewUrl: string;
    status: "not-configured" | "queued" | "building" | "ready" | "error";
    environment: "production" | "preview" | "development";
    buildCommand: string;
    outputDirectory: string;
    notes: string;
  };
};

export const WORK_ITEMS: readonly WorkItem[] = [
  {
    title: "CODEXSUN Platform",
    slug: "codexsun-platform",
    type: "Business Operating Platform",
    client: "CODEXSUN",
    year: "2026",
    role: "Platform strategy, product design and engineering",
    heroLine: "One platform for the work that runs a business.",
    problem:
      "Business systems become fragmented across identity, operations, billing, files, communication and reporting.",
    research:
      "We mapped tenant, company, role, module and industry boundaries around real operational workflows.",
    design:
      "A consistent workspace system keeps complex business tasks dense, readable and predictable.",
    engineering:
      "A TypeScript modular monolith composes tenant-aware apps through explicit contracts, queues and events.",
    result:
      "A modular SaaS foundation that keeps platform services stable while business apps evolve independently.",
    impact: "Teams gain one governed workspace without losing industry-specific depth.",
    description:
      "CODEXSUN connects platform administration, tenant operations and app-specific workflows in one product system.",
    visual: "dashboard",
    previewImage: codexsunPlatformPreview,
    previewImages: [codexsunPlatformPreview],
    status: "live",
    visibility: "public",
    previewUrl: platformUrl("/login"),
    liveUrl: platformUrl("/login"),
    repoUrl: "",
    caseStudyUrl: "/work/codexsun-platform",
    version: "1.0",
    stack: ["React", "TypeScript", "Fastify", "MariaDB"],
    services: ["Platform", "Core", "Billing", "Mail"],
    metrics: [
      {
        label: "Ownership",
        value: "Modular",
        detail: "Every business capability owns its contracts and lifecycle."
      },
      {
        label: "Tenancy",
        value: "Isolated",
        detail: "Tenant context remains explicit across data and runtime boundaries."
      },
      {
        label: "Delivery",
        value: "Composable",
        detail: "Apps activate and deploy as governed product bundles."
      }
    ],
    deployment: {
      provider: "custom",
      projectName: "codexsun-platform",
      productionUrl: platformUrl("/login"),
      previewUrl: "",
      status: "ready",
      environment: "production",
      buildCommand: "npm run build",
      outputDirectory: "dist/apps/platform/web",
      notes: "Platform, Core and application workspaces are composed through the CODEXSUN runtime."
    }
  },
  {
    title: "Billing Suite",
    slug: "billing-suite",
    type: "Billing, Collections & Business Control",
    client: "CODEXSUN",
    year: "2026",
    role: "Domain design and full-stack product engineering",
    heroLine: "Commercial documents become operational intelligence.",
    problem:
      "Invoices, purchases, receipts and payments often live in separate workflows with weak visibility and control.",
    research:
      "We followed document numbering, GST, contact, allocation, approval and outstanding flows end to end.",
    design:
      "Focused document workspaces combine fast entry with clear show, print, mail and lifecycle states.",
    engineering:
      "Tenant-owned persistence, concurrent numbering, allocation locks and typed APIs protect business correctness.",
    result:
      "A connected billing suite for quotations, sales, purchases, exports, receipts, payments and reports.",
    impact: "Operators see movement, outstanding balances and document history from one desk.",
    description:
      "CODEXSUN Billing turns daily documents into an auditable, company-aware operating flow.",
    visual: "dashboard",
    previewImage: codexsunBillingPreview,
    previewImages: [codexsunBillingPreview],
    status: "live",
    visibility: "public",
    previewUrl: platformUrl("/login"),
    liveUrl: platformUrl("/login"),
    repoUrl: "",
    caseStudyUrl: "/work/billing-suite",
    version: "1.0",
    stack: ["React", "TanStack Query", "Fastify", "MariaDB"],
    services: ["Billing", "Core Masters", "Mail"],
    metrics: [
      {
        label: "Documents",
        value: "Connected",
        detail: "Commercial documents share contacts, products and company context."
      },
      {
        label: "Control",
        value: "Auditable",
        detail: "Lifecycle actions and allocations remain traceable."
      },
      {
        label: "Insight",
        value: "Immediate",
        detail: "Dashboards and statements project live business movement."
      }
    ],
    deployment: {
      provider: "custom",
      projectName: "codexsun-billing",
      productionUrl: platformUrl("/login"),
      previewUrl: "",
      status: "ready",
      environment: "production",
      buildCommand: "npm run build",
      outputDirectory: "dist/apps/platform/web",
      notes: "Billing is activated per tenant and composed with Core and Platform services."
    }
  },
  {
    title: "ZERO",
    slug: "zero-ai-companion",
    type: "Permission-Aware Business Companion",
    client: "CODEXSUN",
    year: "2026",
    role: "AI product strategy and platform architecture",
    heroLine: "Business intelligence that respects the business.",
    problem:
      "Generic assistants can expose data without understanding tenant, permission, workflow or audit boundaries.",
    research:
      "We defined tool access around tenant context, role permissions, confirmation and traceable business actions.",
    design:
      "ZERO explains records, risks and next actions in clear language without hiding uncertainty.",
    engineering:
      "Permission-aware tools and audited action contracts keep assistance inside platform governance.",
    result:
      "An AI companion designed to understand business context without becoming a backdoor around control.",
    impact: "Teams can ask better questions, find risks sooner and act with confidence.",
    description:
      "ZERO is CODEXSUN’s governed intelligence layer for summaries, recommendations and confirmed actions.",
    visual: "object",
    previewImage: zeroCompanionPreview,
    previewImages: [zeroCompanionPreview],
    status: "building",
    visibility: "public",
    previewUrl: "",
    liveUrl: "",
    repoUrl: "",
    caseStudyUrl: "/work/zero-ai-companion",
    version: "Roadmap",
    stack: ["Permission Tools", "Events", "Audit", "AI Models"],
    services: ["ZERO", "Platform", "App Contracts"],
    metrics: [
      {
        label: "Access",
        value: "Scoped",
        detail: "Every tool call respects tenant and permission boundaries."
      },
      {
        label: "Actions",
        value: "Confirmed",
        detail: "Business-changing actions require explicit confirmation."
      },
      {
        label: "Trust",
        value: "Audited",
        detail: "Recommendations and actions remain explainable and traceable."
      }
    ],
    deployment: {
      provider: "none",
      projectName: "zero",
      productionUrl: "",
      previewUrl: "",
      status: "not-configured",
      environment: "development",
      buildCommand: "",
      outputDirectory: "",
      notes: "ZERO is being developed as a governed platform capability."
    }
  }
] as const;

export type InsightItem = {
  id: string;
  title: string;
  slug: string;
  tag: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  visual: "lines" | "signal" | "field";
  image: string;
  content: string;
};

export const INSIGHTS: readonly InsightItem[] = [
  {
    id: "insight-1",
    title: "Designing Clarity Into Business Workflows",
    slug: "designing-clarity-into-business-workflows",
    tag: "Jul 17, 2026 / 6 min read",
    excerpt:
      "How module ownership turns scattered operations into calm, legible systems people can trust.",
    publishedAt: "2026-07-17",
    readTime: "6 min read",
    visual: "lines",
    image: clarityWorkflowsImage,
    content:
      "# Designing clarity into business workflows\n\nBusiness software becomes difficult when fields, rules and lifecycle decisions lose their owner. Clarity starts by giving every capability one explicit boundary.\n\n## Make ownership visible\n\nA module should own its records, validation, routes, persistence and user experience. Composition connects those modules without absorbing their business behavior.\n\n## Preserve the real workflow\n\nGood interfaces reflect the decisions people make: create, review, correct, approve, suspend, restore and understand history. The system should make every state visible.\n\n## Build for change\n\nClear contracts let a business evolve one capability without destabilizing the rest of the platform."
  },
  {
    id: "insight-2",
    title: "Why Business Platforms Start With Deep Listening",
    slug: "why-business-platforms-start-with-deep-listening",
    tag: "Jul 10, 2026 / 5 min read",
    excerpt:
      "The strongest platform decisions arrive before the interface, where teams learn how work actually moves.",
    publishedAt: "2026-07-10",
    readTime: "5 min read",
    visual: "signal",
    image: deepListeningImage,
    content:
      "# Why business platforms start with deep listening\n\nRequirements describe requested screens. Listening reveals the operational system underneath them.\n\n## Follow the work\n\nObserve how information enters, who verifies it, what can block it and how exceptions are recovered. Those details define the product more accurately than a feature list.\n\n## Translate carefully\n\nA useful platform turns business language into stable records, permissions and workflows without forcing every company into the same shape.\n\n## Keep learning\n\nThe platform should measure where work slows down and evolve with the people who depend on it."
  },
  {
    id: "insight-3",
    title: "Building AI Business Tools People Can Trust",
    slug: "building-ai-business-tools-people-can-trust",
    tag: "Jul 03, 2026 / 4 min read",
    excerpt:
      "Useful AI is less about spectacle and more about boundaries, confidence and readable behavior.",
    publishedAt: "2026-07-03",
    readTime: "4 min read",
    visual: "field",
    image: aiTrustImage,
    content:
      "# Building AI business tools people can trust\n\nAn assistant becomes valuable when it understands what it may read, what it may recommend and what still needs human confirmation.\n\n## Permissions are product behavior\n\nAI must use the same tenant and role boundaries as every other application surface. Convenience cannot become a hidden access path.\n\n## Make uncertainty visible\n\nPredictions should be labelled as estimates, with enough context for a person to judge them.\n\n## Confirm meaningful actions\n\nDrafting is different from sending. Recommending is different from changing a ledger. Trusted systems preserve that distinction."
  }
] as const;

export const SOCIAL_LINKS = [
  { label: "Application", href: platformUrl("/login") },
  { label: "Platform Status", href: platformUrl("/status") },
  { label: "Super Admin", href: platformUrl("/sa/login") }
] as const;
