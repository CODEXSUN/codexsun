import type { PageContent } from "./page.schema.js";

export const initialLogicxPage: PageContent = {
  pageTitle: "LogicX | Practical software systems",
  description:
    "Custom software, ERPNext, Tally integration, website engineering and workflow automation.",
  profile: {
    name: "LogicX ERP",
    brand: "LogicX",
    location: "Software & integration",
    tagline: "Software that connects the work",
    domain: "logicx.in",
    emails: ["hello@logicx.in"],
    phones: [],
    address: [],
    gstin: ""
  },
  hero: {
    eyebrow: "Software that connects the work",
    title: "Practical systems.",
    secondLine: "Built around",
    emphasis: "your business.",
    intro:
      "Connect operations, finance and customer workflows through purposeful software that fits the way your team already works.",
    button: "Explore services",
    caption: "Custom software · ERP · Integration",
    artLabel: "Connected systems",
    artTitle: "Discover. Connect.",
    artEmphasis: "Deliver."
  },
  materials: {
    names: ["Custom software", "ERPNext", "Tally", "Web systems", "Automation"],
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
      { name: "Custom software", detail: "Purpose-built systems for the way your team works." },
      { name: "Tally integration", detail: "Finance data connected, validated and reconciled." },
      { name: "ERPNext delivery", detail: "Practical ERP rollout shaped around real operations." },
      { name: "Website engineering", detail: "Fast digital experiences built to keep evolving." },
      { name: "Workflow automation", detail: "Rules and approvals that remove repetitive work." },
      { name: "Hosting and care", detail: "Production care after every launch." }
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
    names: ["ERPNext", "Tally", "Web systems"],
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
    lineTwo: "Custom software · ERPNext · Tally · Websites · Automation"
  }
};
