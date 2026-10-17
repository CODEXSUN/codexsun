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
      "Custom software, Frappe and ERPNext, React web apps and mobile experiences. We connect the tools, teams and decisions that keep your business moving.",
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
    intro: "Practical systems shaped around real operations.",
    lead: "We connect business workflows through software, ERP and integrations.",
    paragraphs: [
      "Each engagement starts with the real workflow, then chooses the smallest reliable combination of product, integration and infrastructure needed to improve it.",
      "We map the process, establish the data and integration boundaries, release in useful stages, and remain accountable after the system reaches production."
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
          "Purpose-built portals, internal tools, operational systems and APIs, designed around your processes and permissions."
      },
      {
        name: "Frappe & ERPNext",
        detail:
          "Frappe applications, DocTypes, ERPNext setup, workflow extensions, reports, migrations and integrations."
      },
      {
        name: "React web applications",
        detail:
          "Responsive customer portals, dashboards and business applications with React, typed APIs and accessible interfaces."
      },
      {
        name: "Mobile applications",
        detail:
          "Mobile workflows for customers and field teams, connected to business APIs with offline needs assessed during discovery."
      },
      {
        name: "Business automation",
        detail:
          "Approvals, scheduled jobs, document flows and integrations that reduce repeated work while preserving traceability."
      },
      {
        name: "Tally & system integrations",
        detail:
          "Connect accounting, commerce, ERP and external services through validated data exchange and explicit ownership."
      },
      {
        name: "Websites & ecommerce",
        detail:
          "Portfolio sites, content workspaces and storefront experiences connected to your business processes."
      },
      {
        name: "Hosting, maintenance & support",
        detail:
          "Deployment, monitoring, backups, upgrades, issue resolution and ongoing improvements under an agreed support scope."
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
      { title: "Understand the work", body: "Start with people, processes and exceptions." },
      { title: "Deliver useful stages", body: "Agree milestones and review progress." },
      { title: "Support the system", body: "Document and maintain the solution after launch." }
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
      "Share the process that is slowing your team down. We will help shape a practical path to a dependable software system.",
    officeLabel: "Get in touch",
    mapLabel: "Business location",
    formTitle: "Discuss your workflow",
    formIntro: "Tell us about your current process and the improvement you need."
  },
  footer: {
    lineOne: "Software that connects the work.",
    lineTwo: "Custom software · Frappe · React · Mobile · Automation · Support"
  }
};
