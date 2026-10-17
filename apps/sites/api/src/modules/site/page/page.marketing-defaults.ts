import type { LogicxMarketing } from "./page.marketing-schema.js";

const engagementItems = [
  {
    number: "01",
    title: "Build something new",
    label: "CUSTOM SOFTWARE",
    detail:
      "Turn a business requirement into a focused web app, mobile experience, or internal tool.",
    items: ["Discovery and scope", "Design and development", "Testing and launch"],
    topic: "Custom software project"
  },
  {
    number: "02",
    title: "Make your systems work together",
    label: "ERP & AUTOMATION",
    detail: "Adapt Frappe and ERPNext, connect existing tools, and simplify the work between them.",
    items: ["Workflow and ERP configuration", "Data migration and integrations", "Team onboarding"],
    topic: "ERP and automation consultation"
  },
  {
    number: "03",
    title: "Keep moving after launch",
    label: "ONGOING SUPPORT",
    detail:
      "Plan maintenance, improvements, and practical support around the software your team uses.",
    items: ["Maintenance planning", "Monitoring and issue review", "Agreed improvement milestones"],
    topic: "Software support plan"
  }
];

const industries = [
  ["Manufacturing & textiles", "Connect enquiries, production planning, stock, and dispatch."],
  ["Retail & ecommerce", "Bring products, orders, customers, and inventory into one workflow."],
  ["Professional services", "Organise leads, projects, approvals, time, and billing."],
  ["Growing businesses", "Replace scattered spreadsheets with shared tools and clear ownership."]
];

const questions = [
  [
    "Should we choose an existing application or custom software?",
    "We begin with the workflow. An existing application may cover the core requirement; configuration, integration, or custom development can address the gaps. Explore the application catalogue, then discuss the fit with us."
  ],
  [
    "Can you work with our current ERP or accounting software?",
    "We can assess Frappe, ERPNext, Tally, and other systems for integration. The approach depends on available APIs, data access, permissions, and the version you use. We agree those boundaries before implementation."
  ],
  [
    "How are price and delivery dates agreed?",
    "Share your goals, users, integrations, and preferred timeline. We review the scope and propose milestones, deliverables, assumptions, and pricing for your approval. Changes are reviewed before additional work begins."
  ],
  [
    "Can we start small and add more later?",
    "Yes. A focused first release helps validate the workflow with your team. Further modules and integrations can be planned as separate milestones once the first release is in use."
  ],
  [
    "What happens after the software launches?",
    "We agree the handover, documentation, training, hosting responsibilities, and support scope for the project. Maintenance and ongoing improvements can be arranged separately around your needs."
  ]
];

export const initialLogicxMarketing: LogicxMarketing = {
  heroImage: "/design/logicx-architecture.webp",
  approachImage: "/design/logicx-architecture.webp",
  primaryLabel: "Let's talk about your project",
  secondaryLabel: "See how it works",
  navigationLabel: "Let's build",
  proofLabels: ["Custom development", "ERP integration", "Ongoing support"],
  technologies: ["Frappe", "ERPNext", "React", "Tailwind CSS", "Python", "Node.js"],
  featuredServices: [
    "custom-business-software",
    "frappe-erpnext",
    "react-web-applications",
    "mobile-applications",
    "business-automation",
    "tally-system-integrations"
  ],
  serviceImages: [
    "custom-business-software",
    "frappe-erpnext",
    "react-web-applications",
    "mobile-applications",
    "business-automation",
    "tally-system-integrations",
    "websites-ecommerce",
    "hosting-maintenance-support"
  ].map((slug, i) => ({
    slug,
    image: `/service-previews/${["custom-software", "frappe-erp", "react-web", "mobile-apps", "automation", "integrations", "ecommerce", "support"][i]}.svg`
  })),
  services: {
    label: "Our services",
    title: "Software for every part of your business.",
    intro: "We connect business workflows through software, ERP and integrations.",
    button: "Explore all services"
  },
  applications: {
    label: "The application collection",
    title: "A workspace for the way you work.",
    intro:
      "Find a starting point for customer relationships, finance, commerce, and daily operations. We help you plan configuration, integration, and rollout.",
    button: "Explore applications"
  },
  examples: {
    label: "Software in practice",
    title: "Less friction. A clearer way to work.",
    intro:
      "Illustrative workflows show how connected software can support everyday operations. These are examples, not customer case studies.",
    button: "Discuss your workflow"
  },
  industries: {
    label: "Built around real operations",
    title: "Different businesses. Better flow.",
    intro:
      "From the first customer enquiry to the final invoice, connect the steps that matter to your team.",
    button: "Find your applications"
  },
  engagements: {
    label: "A practical way forward",
    title: "Software that fits your business.",
    intro:
      "Start with a clear requirement. Build in useful stages. Keep improving as your business grows.",
    button: "Discuss this option"
  },
  faq: {
    label: "Before we build",
    title: "A few things you might be wondering.",
    intro: "A good project starts with clear expectations.",
    button: "Ask us a question"
  },
  closing: {
    label: "Your next step",
    title: "Have an idea, a workflow, or a system to improve?",
    intro: "Let's find the right software solution for your business.",
    button: "Start a conversation"
  },
  exampleItems: [
    {
      title: "From enquiry to order",
      detail: "Give sales and operations a shared view of the customer journey.",
      steps: ["Capture the enquiry", "Prepare a quotation", "Confirm the order", "Track delivery"]
    },
    {
      title: "From stock to dispatch",
      detail: "Make the movement of materials and finished goods easier to follow.",
      steps: ["Receive materials", "Plan production", "Review availability", "Record dispatch"]
    },
    {
      title: "From task to invoice",
      detail: "Connect project progress with approvals and billing.",
      steps: ["Assign the work", "Track progress", "Approve delivery", "Prepare billing"]
    }
  ],
  industryItems: industries.map(([title, detail]) => ({ title: title!, detail: detail! })),
  engagementItems: engagementItems.map(({ number: _number, ...item }) => item),
  questions: questions.map(([title, answer]) => ({ title: title!, answer: answer! }))
};
