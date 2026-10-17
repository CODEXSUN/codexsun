import { initialLogicxMarketing } from "./page.marketing-defaults.js";
import { logicxApplications } from "./page.logicx-apps.js";
import type { PageContent } from "./page.schema.js";

export const initialLogicxPage: PageContent = {
  marketing: initialLogicxMarketing,
  applications: logicxApplications,
  pageTitle: "LogicX Software | Custom software, Frappe, React & mobile apps",
  description:
    "Custom business software, Frappe and ERPNext, React web apps, mobile applications, integrations and ongoing automation support.",
  profile: {
    name: "LogicX Software",
    brand: "LogicX",
    location: "Software, apps & business automation",
    tagline: "Software that connects the work",
    domain: "logicx.in",
    emails: ["hello@logicx.in"],
    phones: [{ label: "+91 96552 27738", href: "+919655227738" }],
    whatsappNumber: "919655227738",
    mapQuery: "LogicX Software, logicx.in",
    address: [],
    gstin: ""
  },
  hero: {
    eyebrow: "Software that connects the work",
    title: "Your business.",
    secondLine: "Connected by",
    emphasis: "better software.",
    intro:
      "Custom software, Frappe ERP and connected apps for sales, finance and operations.",
    button: "Explore services",
    caption: "Custom software · ERP · Integration",
    artLabel: "Connected systems",
    artTitle: "Discover. Connect.",
    artEmphasis: "Deliver."
  },
  materials: {
    names: [
      "Custom software",
      "Frappe & ERPNext",
      "React apps",
      "Mobile apps",
      "Business automation",
      "Support"
    ],
    caption: "Useful technology, joined properly."
  },
  about: {
    label: "About LogicX",
    title: "Clear from discovery",
    emphasis: "to support.",
    intro: "From the first requirement to everyday use.",
    lead: "LogicX builds custom software, ERP solutions and business applications.",
    paragraphs: [
      "We build web and mobile applications, configure Frappe and ERPNext, and connect sales, finance and production workflows.",
      "Our work starts with your process. We agree the scope, deliver in stages and plan training, handover and support."
    ],
    profileLink: "Discuss your workflow"
  },
  processing: {
    label: "How we work",
    title: "From real workflow",
    emphasis: "to everyday use.",
    intro: "Discover the process, release useful improvements, and support the outcome.",
    foundationLabel: "Our focus",
    foundation: ["Operations", "Finance", "Customer workflows"],
    lines: [
      {
        title: "Delivery method",
        description: "Clear milestones from discovery to continued care.",
        stages: [
          ["Discover first", "Process, people, data and exceptions"],
          ["Release in stages", "Useful milestones with visible progress"],
          ["Own the outcome", "Documentation, monitoring and continued care"]
        ]
      }
    ]
  },
  finishes: {
    label: "What we build",
    title: "Useful technology,",
    emphasis: "joined properly.",
    intro: "Purposeful software for operations, finance and customer experience.",
    items: [
      {
        name: "Custom business software",
        detail:
          "Portals, internal tools and APIs built around your team and processes."
      },
      {
        name: "Frappe & ERPNext",
        detail:
          "ERPNext setup, Frappe applications, reports, data migration and integrations."
      },
      {
        name: "React web applications",
        detail:
          "Fast, accessible React portals, dashboards and business applications."
      },
      {
        name: "Mobile applications",
        detail:
          "Connected apps for customers, field teams and daily operations."
      },
      {
        name: "Business automation",
        detail:
          "Automate follow-ups, approvals, scheduled tasks and document handovers."
      },
      {
        name: "Tally & system integrations",
        detail:
          "Connect Tally, ERP and commerce through validated data exchange."
      },
      {
        name: "Websites & ecommerce",
        detail:
          "Editable websites, product catalogues and online stores connected to your business."
      },
      {
        name: "Hosting, maintenance & support",
        detail:
          "Hosting, backups, updates and ongoing improvements under an agreed support plan."
      }
    ]
  },
  responsibility: {
    label: "Our approach",
    title: "Practical delivery.",
    emphasis: "Continued care.",
    intro: "Keep systems understandable and accountable.",
    linkLabel: "Start a conversation",
    note: "Discuss scope and support requirements with our team.",
    items: [
      { title: "Understand the work", body: "Map your process, users and priorities." },
      { title: "Deliver useful stages", body: "Build, test and review with your team." },
      { title: "Support the system", body: "Train your team and plan ongoing care." }
    ]
  },
  equipment: {
    label: "Technology & integrations",
    names: [
      "Frappe",
      "ERPNext",
      "React",
      "TypeScript",
      "Mobile APIs",
      "MariaDB",
      "SQLite",
      "Tally"
    ],
    note: "Technology is selected around the workflow."
  },
  contact: {
    label: "Contact",
    title: "Make the next system",
    emphasis: "easier to run.",
    intro:
      "Tell us what you want to build, connect or improve. We will help define the next step.",
    officeLabel: "Get in touch",
    mapLabel: "Business location",
    formTitle: "Discuss your workflow",
    formIntro: "Share your goals, current tools and project needs."
  },
  footer: {
    lineOne: "Software built around your business.",
    lineTwo: "Custom software · Frappe · React · Mobile · Automation · Support"
  }
};
