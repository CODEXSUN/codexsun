import type { LogicxMarketing } from "./page.marketing-schema.js";



const engagementItems = [

  {

    title: "Find the right first move.", label: "01 / DISCOVER",

    detail: "Map your process, review current tools and agree the first improvement.",

    items: ["Workflow and bottleneck review", "Existing software and data assessment", "A scoped roadmap with clear priorities"],

    topic: "Workflow discovery consultation"

  },

  {

    title: "Build. Connect. Make it useful.", label: "02 / DELIVER",

    detail: "Configure the right apps, develop what is missing and validate each release with your team.",

    items: ["Custom web, mobile and ERP development", "Data migration and approved integrations", "Pilot, acceptance checks and team training"],

    topic: "Software delivery and integration"

  },

  {

    title: "A better system, over time.", label: "03 / EVOLVE",

    detail: "Train your team, maintain the system and plan improvements as your needs grow.",

    items: ["Handover and operating documentation", "Agreed maintenance and monitoring", "Regular reviews and phased improvements"],

    topic: "Ongoing software improvement"

  }

];



const industries = [

  ["Textiles, from yarn to dispatch", "Connect lot tracking, processing plans, quality checks, job work and dispatch."],

  ["Handloom & knitting workflows", "Manage yarn issue, job allocation, output and finishing. Machine connections are assessed against compatible interfaces."],

  ["Sales that stay connected", "Bring enquiries, follow-ups, quotations and billing into a connected CRM workflow."],

  ["A stronger digital presence", "Build your website, catalogue and social presence. Connect enquiry sources and approved channel integrations."]

];



const questions = [

  [

    "Should we choose an existing application or custom software?",

    "We review your workflow first. Use an existing app where it fits, then configure, integrate or build the missing parts."

  ],

  [

    "Can you work with our current ERP or accounting software?",

    "We assess your software, APIs and data access, then agree a safe integration approach before development."

  ],

  [

    "How are price and delivery dates agreed?",

    "We review your scope and agree deliverables, milestones and pricing. Changes are discussed before extra work begins."

  ],

  [

    "Can we start small and add more later?",

    "Yes. Start with one useful workflow, validate it with your team and add further modules in planned stages."

  ],

  [

    "What happens after the software launches?",

    "We agree training, documentation, hosting and support responsibilities. Maintenance and improvements can follow under a separate plan."

  ]

];



export const initialLogicxMarketing: LogicxMarketing = {

  heroImage: "/design/logicx-architecture.webp",

  approachImage: "/design/logicx-architecture.webp",
  practiceBackdrop: "/design/logicx-connected-workspace.webp",
  industryBackdrop: "/design/logicx-textile-workshop.webp",
  deliveryBackdrop: "/design/logicx-architecture.webp",

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

    intro: "Custom software, ERP, web and mobile apps - built to work together.",

    button: "Explore all services"

  },

  applications: {

    label: "The application collection",

    title: "Business apps. Connected to your work.",

    intro:

      "Explore LogicX applications for sales, finance, commerce and team operations.",

    button: "Explore applications"

  },

  examples: {

    label: "Software in practice",

    title: "Your workflow. Connected by LogicX.",

    intro:

      "See how software can connect textile production, sales and digital enquiries.",

    button: "Discuss your workflow"

  },

  industries: {

    label: "Built around real operations",

    title: "Your industry. Every detail matters.",

    intro:

      "We build around how your team sells, produces and delivers.",

    button: "Find your applications"

  },

  engagements: {

    label: "A practical way forward",

    title: "A clear start. A lasting partnership.",

    intro:

      "A clear scope. Useful releases. Support that continues after launch.",

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

    title: "What would you like to build next?",

    intro: "Talk to LogicX about custom software, ERP or your next business app.",

    button: "Start a conversation"

  },

  exampleItems: [

    {

      title: "Textile production, in sync.",

      detail: "Track yarn and fabric lots through processing, quality checks and dispatch in one shared workflow.",

      steps: ["Receive & identify lots", "Plan processing", "Record quality", "Prepare dispatch"]

    },

    {

      title: "Every stitch. A clearer picture.",

      detail: "Plan yarn allocation, record loom and knitting output, and follow job work through finishing.",

      steps: ["Allocate yarn", "Assign loom or knitting jobs", "Record output", "Review finishing"]

    },

    {

      title: "Turn conversations into customers.",

      detail: "Capture enquiries, assign follow-ups and connect quotations with orders and billing.",

      steps: ["Capture the enquiry", "Assign & follow up", "Send a quotation", "Confirm the order"]

    },

    {

      title: "Be found. Stay connected.",

      detail: "Connect your website, catalogue and social profiles with a clear enquiry process.",

      steps: ["Publish your story", "Connect social profiles", "Capture enquiries", "Review & improve"]

    }

  ],

  industryItems: industries.map(([title, detail]) => ({ title: title!, detail: detail! })),

  engagementItems: engagementItems,

  questions: questions.map(([title, answer]) => ({ title: title!, answer: answer! }))

};

