import type { PageContent } from "./page.schema.js";
// Public descriptions reviewed against repository app READMEs and the host app inventory.
export const logicxApplications: NonNullable<PageContent["applications"]> = [
  {
    slug: "codexsun",
    name: "CODEXSUN",
    category: "Workspace",
    summary: "A connected front desk for requirements and business workspaces.",
    features: ["Requirement capture", "Connected portals", "Review and approvals"]
  },
  {
    slug: "core",
    name: "Core",
    category: "Workspace",
    summary: "Shared company, contact, product and location records.",
    features: ["Company and financial year", "Contact and product masters", "Geographic records"]
  },
  {
    slug: "platform",
    name: "Business workspace",
    category: "Workspace",
    summary: "Identity, company context and access for business applications.",
    features: ["Tenant sign-in", "Role permissions", "Application access"]
  },
  {
    slug: "logicx-erp",
    name: "LogicX ERP",
    category: "Operations",
    summary:
      "The LogicX ERP overview and Scheme capability, with further workflows agreed per project.",
    features: ["ERP overview", "Scheme records", "Scoped extensions"]
  },
  {
    slug: "crm",
    name: "CRM",
    category: "Sales",
    summary: "Manage customer relationships, enquiries and follow-up work.",
    features: ["Enquiry management", "Customer records", "Sales activities"]
  },
  {
    slug: "billing",
    name: "Billing",
    category: "Finance",
    summary: "Run sales, purchases and party outstanding workflows.",
    features: ["Quotations and invoices", "Receipts and payments", "Outstanding management"]
  },
  {
    slug: "accounts",
    name: "Accounts",
    category: "Finance",
    summary: "Keep accounting records and books in a dedicated workspace.",
    features: ["Chart of accounts", "Journals", "Bank and cash books"]
  },
  {
    slug: "ecommerce",
    name: "Ecommerce",
    category: "Commerce",
    summary: "A connected workspace for ecommerce operations and storefronts.",
    features: ["Product catalogue", "Storefront management", "Order workflows"]
  },
  {
    slug: "qcafe",
    name: "QCafe",
    category: "Commerce",
    summary: "Restaurant operations with a dedicated point-of-sale experience.",
    features: ["Menu management", "Table operations", "POS workflows"]
  },
  {
    slug: "tconnect",
    name: "TConnect",
    category: "Commerce",
    summary: "Business discovery, company profiles and association communities.",
    features: ["Buyer and seller discovery", "Company profiles", "Association communities"]
  },
  {
    slug: "hrms",
    name: "HRMS",
    category: "People",
    summary:
      "A foundation workspace for people and workforce administration, with further modules scoped per project.",
    features: ["App workspace foundation", "Tenant access", "Workforce modules by agreement"]
  },
  {
    slug: "himsx",
    name: "Himsx",
    category: "Operations",
    summary:
      "A foundation workspace for hospital information and administration, ready for scoped extension.",
    features: ["App workspace foundation", "Tenant access", "Hospital workflows by agreement"]
  },
  {
    slug: "auditor",
    name: "Auditor",
    category: "Operations",
    summary: "Organize audit clients and review work.",
    features: ["Client management", "Audit planning", "Evidence review"]
  },
  {
    slug: "sites",
    name: "Site Studio",
    category: "Digital",
    summary: "Manage client websites, published pages, blogs and enquiries.",
    features: ["Client workspaces", "Website and blog publishing", "Private enquiry inbox"]
  },
  {
    slug: "docs",
    name: "Docs",
    category: "Knowledge",
    summary: "Bring documentation and business knowledge into one workspace.",
    features: ["Documentation", "Knowledge management", "Searchable guidance"]
  },
  {
    slug: "blog",
    name: "Blog",
    category: "Digital",
    summary: "Editorial tools for articles, authors, media and publication.",
    features: ["Articles and authors", "Media and SEO", "Publishing workflows"]
  },
  {
    slug: "mail",
    name: "Mail",
    category: "Communication",
    summary: "Business mail with compose, drafts and delivery tracking.",
    features: ["Inbox and compose", "Drafts and sent history", "SMTP delivery tracking"]
  },
  {
    slug: "chat",
    name: "Chat",
    category: "Communication",
    summary: "Team conversations with channels and direct threads.",
    features: ["Team channels", "Direct messages", "Attachments"]
  },
  {
    slug: "notes",
    name: "Notes",
    category: "Knowledge",
    summary: "Capture team notes and find them when needed.",
    features: ["Quick capture", "Search", "Suspend and restore"]
  },
  {
    slug: "task-manager",
    name: "Task Manager",
    category: "Operations",
    summary: "Organize tenant-owned to-do planning and daily work.",
    features: ["To-do planning", "Task tracking", "Work organization"]
  },
  {
    slug: "project-manager",
    name: "Project Manager",
    category: "Operations",
    summary: "Plan project work and review ideas in a shared workspace.",
    features: ["Project planning", "Ideas", "Work tracking"]
  },
  {
    slug: "frappe",
    name: "Frappe Connector",
    category: "Integration",
    summary: "Connect approved Frappe sources with selected CRM workflows.",
    features: ["Frappe connection", "Manual CRM sync", "Explicit integration scope"]
  },
  {
    slug: "zetro",
    name: "Zetro",
    category: "Automation",
    summary: "An AI coworker with private conversations and controlled business capabilities.",
    features: ["Private chat history", "Business context", "Permission-aware actions"]
  }
];
