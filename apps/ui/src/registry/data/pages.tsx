import type { ReactNode } from "react"

import CommonList01 from "@/registry/blocks/data/common-list-01"
import CommonList01Code from "@/registry/blocks/data/common-list-01.tsx?raw"
import MasterList01 from "@/registry/blocks/data/master-list-01"
import MasterList01Code from "@/registry/blocks/data/master-list-01.tsx?raw"
import MasterList02 from "@/registry/blocks/data/master-list-02"
import MasterList02Code from "@/registry/blocks/data/master-list-02.tsx?raw"
import MasterListSelectable01 from "@/registry/blocks/data/master-list-selectable-01"
import MasterListSelectable01Code from "@/registry/blocks/data/master-list-selectable-01.tsx?raw"

export const registryPageCategories = [
  {
    id: "application-pages",
    name: "Application Pages",
    description: "Full-page operational screens and master-style page systems.",
  },
] as const

export type RegistryPageCategory = (typeof registryPageCategories)[number]["id"]

export type RegistryPage = {
  id: string
  name: string
  summary: string
  description: string
  category: RegistryPageCategory
  componentIds: string[]
  code: string
  preview: ReactNode
}

export const registryPages: RegistryPage[] = [
  {
    id: "common-list-01",
    name: "Support Queue Page",
    summary:
      "Searchable operational queue page with filters, row actions, sortable columns, and lightweight follow-up handling.",
    description:
      "Use for support queues, approval backlogs, service follow-ups, and other application workflows where triage happens from a compact list.",
    category: "application-pages",
    componentIds: ["badge", "button", "dropdown-menu", "input", "pagination", "table"],
    code: CommonList01Code,
    preview: <CommonList01 />,
  },
  {
    id: "master-list-01",
    name: "Ledger Master Page",
    summary:
      "Operational ledger registry page with sticky actions, row menus, search, filters, and footer metrics.",
    description:
      "Use for chart of accounts, customer masters, vendor ledgers, and other application-level master screens that need accounting-style density.",
    category: "application-pages",
    componentIds: ["badge", "button", "dropdown-menu", "input", "pagination", "table"],
    code: MasterList01Code,
    preview: <MasterList01 />,
  },
  {
    id: "master-list-02",
    name: "Common Master Form Page",
    summary:
      "Common master workspace with popup upsert form, searchable lookup fields, and row-level restore or deactivate actions.",
    description:
      "Use for shared reference tables like cities, address types, units, and other setup lists that need create or edit in a modal instead of route navigation.",
    category: "application-pages",
    componentIds: ["button", "dropdown-menu", "input", "lookup", "pagination", "table"],
    code: MasterList02Code,
    preview: <MasterList02 />,
  },
  {
    id: "master-list-selectable-01",
    name: "Bulk Ledger Management Page",
    summary:
      "Ledger management page with row-selection checkboxes, column visibility controls, row menus, and bulk-ready list behavior.",
    description:
      "Use for high-volume administration flows where operators need to select multiple ledgers, manage visible columns, and work from a single dense screen.",
    category: "application-pages",
    componentIds: [
      "badge",
      "button",
      "checkbox",
      "dropdown-menu",
      "input",
      "pagination",
      "table",
    ],
    code: MasterListSelectable01Code,
    preview: <MasterListSelectable01 />,
  },
]

export const registryPagesByCategory = registryPageCategories.map((category) => ({
  ...category,
  items: registryPages.filter((page) => page.category === category.id),
}))
