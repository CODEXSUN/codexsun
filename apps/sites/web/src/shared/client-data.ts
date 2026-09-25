import type { LucideIcon } from "lucide-react";
import { BlocksIcon, BotIcon, Code2Icon, CpuIcon, Globe2Icon, Layers3Icon, SparklesIcon } from "lucide-react";

export type ClientSite = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  statement: string;
  accent: "cyan" | "orange" | "violet";
  mark: string;
  icon: LucideIcon;
  services: string[];
  stats: { label: string; value: string }[];
  featured: string;
  seo: { title: string; description: string; keywords: string[] };
  about: string;
  approach: string[];
  work: { title: string; type: string; description: string }[];
  contactLabel: string;
  contact?: { email: string; phone: string; label: string };
  location?: { city: string; region: string; country: string; address: string };
  socialLinks?: SiteSocialLink[];
  footer?: { tagline: string; copyright: string };
  sections?: SiteSection[];
};

export type SiteSection =
  | { type: "about"; title: string; body: string }
  | { type: "services"; title: string; items: string[] }
  | { type: "work"; title: string; items: { title: string; type: string; description: string }[] }
  | { type: "approach"; title: string; items: string[] }
  | { type: "cta"; label: string };

export type SiteSocialLink = { label: string; href: string };

export type PublicClientPayload = Omit<
  ClientSite,
  "icon" | "contact" | "location" | "socialLinks" | "footer" | "sections"
> & {
  contact: NonNullable<ClientSite["contact"]>;
  location: NonNullable<ClientSite["location"]>;
  socialLinks: NonNullable<ClientSite["socialLinks"]>;
  footer: NonNullable<ClientSite["footer"]>;
  sections: SiteSection[];
};

export const clientSites: ClientSite[] = [
  {
    slug: "codexsun",
    name: "Codexsun",
    eyebrow: "Platform studio",
    description: "A focused home for the people and products building the next layer of useful software.",
    statement: "Systems that feel clear, capable, and ready to grow.",
    accent: "cyan",
    mark: "CS",
    icon: Layers3Icon,
    services: ["Product platforms", "Shared UI systems", "Operational tooling"],
    stats: [
      { label: "Focus", value: "Platform" },
      { label: "Mode", value: "Build" },
      { label: "Pages", value: "Dynamic-ready" },
    ],
    featured: "A modular foundation for ambitious teams.",
    seo: {
      title: "Codexsun | Platform studio",
      description: "Codexsun builds clear, capable platforms and shared systems for teams ready to grow.",
      keywords: ["Codexsun", "software platform", "shared UI systems"],
    },
    about:
      "Codexsun is a platform studio for teams that need strong foundations without losing momentum. We turn complex product surfaces into calm, useful experiences.",
    approach: ["Clarify the system", "Compose the experience", "Ship the next useful version"],
    work: [
      {
        title: "Platform foundations",
        type: "Systems",
        description: "A modular base for product teams to build, operate, and evolve with confidence.",
      },
      {
        title: "Shared UI language",
        type: "Design systems",
        description: "Reusable interfaces that make multiple product surfaces feel like one coherent product.",
      },
      {
        title: "Operations cockpit",
        type: "Internal tools",
        description: "A focused control layer for the people keeping ambitious products moving.",
      },
    ],
    contactLabel: "Start a platform conversation",
  },
  {
    slug: "devxcrew",
    name: "DevXcrew",
    eyebrow: "Developer experience",
    description: "Tools, practices, and people that make shipping software feel lighter and more deliberate.",
    statement: "Make the hard parts easier to repeat.",
    accent: "orange",
    mark: "DX",
    icon: Code2Icon,
    services: ["Developer tooling", "Engineering workflows", "Technical enablement"],
    stats: [
      { label: "Focus", value: "DevEx" },
      { label: "Mode", value: "Ship" },
      { label: "Pages", value: "Static-ready" },
    ],
    featured: "A sharper path from idea to reliable delivery.",
    seo: {
      title: "DevXcrew | Developer experience",
      description:
        "DevXcrew makes developer experience practical through better tools, workflows, and technical enablement.",
      keywords: ["DevXcrew", "developer experience", "engineering workflows"],
    },
    about:
      "DevXcrew helps engineering teams remove friction from the path between an idea and a dependable release. The work is practical, measurable, and built to last.",
    approach: ["Find the friction", "Make the path visible", "Automate the repeatable"],
    work: [
      {
        title: "Release runway",
        type: "Developer tooling",
        description: "A cleaner release path that turns hidden handoffs into visible, repeatable steps.",
      },
      {
        title: "Team playbooks",
        type: "Enablement",
        description: "Simple operating patterns that help teams make good engineering decisions faster.",
      },
      {
        title: "Build intelligence",
        type: "Workflow design",
        description: "Useful signals for understanding where delivery slows down and where to improve next.",
      },
    ],
    contactLabel: "Improve your developer experience",
  },
  {
    slug: "skilloopz",
    name: "Skilloopz",
    eyebrow: "Learning network",
    description: "Practical learning paths that turn curiosity into confident, repeatable capability.",
    statement: "Keep learning in motion.",
    accent: "violet",
    mark: "SL",
    icon: SparklesIcon,
    services: ["Learning journeys", "Community programs", "Skills intelligence"],
    stats: [
      { label: "Focus", value: "Learning" },
      { label: "Mode", value: "Grow" },
      { label: "Pages", value: "Content-led" },
    ],
    featured: "A living space for skills, people, and momentum.",
    seo: {
      title: "Skilloopz | IT Training & Placement Assistance",
      description:
        "Skilloopz provides industry-focused IT training, mentor-led learning and placement assistance for students and graduates.",
      keywords: ["Skilloopz", "IT training", "placement assistance", "mentor-led learning"],
    },
    about:
      "Skilloopz provides industry-focused IT training, mentor-led learning and placement assistance for students and graduates.",
    approach: ["Start with a useful question", "Practice in the real world", "Share the next step"],
    work: [
      {
        title: "Learning paths",
        type: "Programs",
        description: "Focused journeys that help learners move from interest to applied capability.",
      },
      {
        title: "Skill circles",
        type: "Community",
        description: "A welcoming rhythm for people to learn together, ask better questions, and keep momentum.",
      },
      {
        title: "Progress signals",
        type: "Content systems",
        description: "A clear way to see what is changing as skills become part of everyday work.",
      },
    ],
    contactLabel: "Build a learning journey",
  },
  {
    slug: "logicx",
    name: "Logicx Info Tech",
    eyebrow: "Connected software systems",
    description: "Practical software, ERPNext, Tally integration, websites, and automation for real operations.",
    statement: "Systems that connect the work.",
    accent: "cyan",
    mark: "LX",
    icon: CpuIcon,
    services: [
      "Custom software",
      "Tally integration",
      "ERPNext delivery",
      "Website engineering",
      "Workflow automation",
      "Hosting and care",
    ],
    stats: [
      { label: "Focus", value: "Systems" },
      { label: "Mode", value: "Connect" },
      { label: "Pages", value: "Dynamic-ready" },
    ],
    featured: "Your systems, data, and people finally in sync.",
    seo: {
      title: "Logicx Info Tech | Practical software systems",
      description:
        "Logicx Info Tech builds custom software, ERPNext, Tally integrations, websites, and workflow automation.",
      keywords: ["Logicx", "ERPNext", "Tally integration", "workflow automation"],
    },
    about:
      "Logicx Info Tech connects operations, finance, and customer workflows through purposeful software that fits the way teams already work.",
    approach: ["Discover the real workflow", "Release in useful stages", "Own the outcome after launch"],
    work: [
      {
        title: "Connected operations",
        type: "Custom software",
        description: "Purpose-built systems that connect the work without adding unnecessary complexity.",
      },
      {
        title: "Finance integration",
        type: "Tally and ERPNext",
        description: "Validated flows that keep financial data dependable and useful.",
      },
      {
        title: "Digital experience",
        type: "Web systems",
        description: "Fast websites and internal tools that keep evolving with the business.",
      },
    ],
    contactLabel: "Make the next system easier to run",
  },
];

export const portalFeatures = [
  {
    title: "Static or dynamic",
    description: "Launch a fast, focused page or connect content to live data when the experience needs to evolve.",
    icon: Globe2Icon,
  },
  {
    title: "Modular by design",
    description:
      "Compose each client site from reusable sections, themes, and content blocks that stay easy to maintain.",
    icon: BlocksIcon,
  },
  {
    title: "Ready for the next layer",
    description: "Keep public delivery separate from the authenticated workspace so publishing can grow safely.",
    icon: BotIcon,
  },
];

export function hydrateClientSite(payload: PublicClientPayload): ClientSite {
  const fallback = clientSites.find((site) => site.slug === payload.slug);
  return { ...payload, icon: fallback?.icon ?? Layers3Icon };
}

export function clientPath(slug: string, page?: string): string {
  const suffix = page ? `/${page}` : "";
  return import.meta.env.VITE_SITES_CLIENT_SLUG === slug ? suffix || "/" : `/clients/${slug}${suffix}`;
}

export function getClientSections(client: ClientSite): SiteSection[] {
  return (
    client.sections ?? [
      { type: "about", title: `About ${client.name}`, body: client.about },
      { type: "services", title: "What lives here", items: client.services },
      { type: "work", title: "Selected work", items: client.work },
      { type: "approach", title: "Our approach", items: client.approach },
      { type: "cta", label: client.contactLabel },
    ]
  );
}
