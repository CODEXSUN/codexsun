import type { ReactNode } from "react"

import LoginPage01 from "@/registry/blocks/auth/login-page-01"
import LoginPage01Code from "@/registry/blocks/auth/login-page-01.tsx?raw"
import LoginPage02 from "@/registry/blocks/auth/login-page-02"
import LoginPage02Code from "@/registry/blocks/auth/login-page-02.tsx?raw"
import SignInPanel01 from "@/registry/blocks/auth/sign-in-panel-01"
import SignInPanel01Code from "@/registry/blocks/auth/sign-in-panel-01.tsx?raw"
import FeaturedCard1 from "@/registry/blocks/commerce/featured-card-1"
import FeaturedCard1Code from "@/registry/blocks/commerce/featured-card-1.tsx?raw"
import FeaturedCard3 from "@/registry/blocks/commerce/featured-card-3"
import FeaturedCard3Code from "@/registry/blocks/commerce/featured-card-3.tsx?raw"
import FeaturedCard4 from "@/registry/blocks/commerce/featured-card-4"
import FeaturedCard4Code from "@/registry/blocks/commerce/featured-card-4.tsx?raw"
import FeaturedCard5 from "@/registry/blocks/commerce/featured-card-5"
import FeaturedCard5Code from "@/registry/blocks/commerce/featured-card-5.tsx?raw"
import FeaturedCard6 from "@/registry/blocks/commerce/featured-card-6"
import FeaturedCard6Code from "@/registry/blocks/commerce/featured-card-6.tsx?raw"
import ToastStack01 from "@/registry/blocks/feedback/toast-stack-01"
import ToastStack01Code from "@/registry/blocks/feedback/toast-stack-01.tsx?raw"
import FilterToolbar01 from "@/registry/blocks/data/filter-toolbar-01"
import FilterToolbar01Code from "@/registry/blocks/data/filter-toolbar-01.tsx?raw"
import InlineEditableTable01 from "@/registry/blocks/data/inline-editable-table-01"
import InlineEditableTable01Code from "@/registry/blocks/data/inline-editable-table-01.tsx?raw"
import StorefrontSearch01 from "@/registry/blocks/data/storefront-search-01"
import StorefrontSearch01Code from "@/registry/blocks/data/storefront-search-01.tsx?raw"
import ProfileSettingsForm01 from "@/registry/blocks/forms/profile-settings-form-01"
import ProfileSettingsForm01Code from "@/registry/blocks/forms/profile-settings-form-01.tsx?raw"
import SupportRequestForm01 from "@/registry/blocks/forms/support-request-form-01"
import SupportRequestForm01Code from "@/registry/blocks/forms/support-request-form-01.tsx?raw"

export const registryBlockCategories = [
  {
    id: "auth",
    name: "Authentication",
    description: "Sign-in, access, and account entry flows.",
  },
  {
    id: "feedback",
    name: "Feedback",
    description: "Toast stacks, alerts, and async workflow messaging patterns.",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Multi-field data capture and editable settings surfaces.",
  },
  {
    id: "data",
    name: "Data",
    description: "List filters, table helpers, and result control patterns.",
  },
  {
    id: "commerce",
    name: "Commerce",
    description: "Storefront discovery, merchandising, and shopping flow surfaces.",
  },
] as const

export type RegistryBlockCategory = (typeof registryBlockCategories)[number]["id"]

export type RegistryBlock = {
  id: string
  name: string
  summary: string
  description: string
  category: RegistryBlockCategory
  componentIds: string[]
  code: string
  preview: ReactNode
}

export const registryBlocks: RegistryBlock[] = [
  {
    id: "login-page-01",
    name: "Login Page",
    summary:
      "A full-page authentication block with supporting project narrative and a sign-in panel.",
    description:
      "Use this as the starting point for workspace sign-in and future auth surfaces in upcoming projects.",
    category: "auth",
    componentIds: ["badge", "button", "card", "input", "separator"],
    code: LoginPage01Code,
    preview: <LoginPage01 />,
  },
  {
    id: "login-page-02",
    name: "Login Page Split Hero",
    summary:
      "A sign-in page block with a compact auth card and a supporting workspace value panel.",
    description:
      "Use this when the product needs a stronger landing message alongside the credential flow.",
    category: "auth",
    componentIds: [
      "badge",
      "button",
      "card",
      "checkbox",
      "input",
      "separator",
    ],
    code: LoginPage02Code,
    preview: <LoginPage02 />,
  },
  {
    id: "sign-in-panel-01",
    name: "Sign In Panel",
    summary:
      "Authentication block with single-column credentials and action footer.",
    description:
      "Use for sign-in, invite acceptance, and account access checkpoints.",
    category: "auth",
    componentIds: ["button", "card", "input", "separator"],
    code: SignInPanel01Code,
    preview: <SignInPanel01 />,
  },
  {
    id: "toast-stack-01",
    name: "Record Result Toasts",
    summary:
      "Two-line application toasts for save, warning, and failure outcomes with clear record naming.",
    description:
      "Use this when the app needs colorful record-result messaging with a concise action line and an exact record detail line.",
    category: "feedback",
    componentIds: ["alert", "badge", "button", "spinner"],
    code: ToastStack01Code,
    preview: <ToastStack01 />,
  },
  {
    id: "support-request-form-01",
    name: "Support Request Form",
    summary:
      "Multi-field support form with routed category, urgency, and details.",
    description:
      "Use for contact, issue reporting, and operational service requests.",
    category: "forms",
    componentIds: ["button", "card", "checkbox", "input", "select", "textarea"],
    code: SupportRequestForm01Code,
    preview: <SupportRequestForm01 />,
  },
  {
    id: "profile-settings-form-01",
    name: "Profile Settings Form",
    summary:
      "Settings block with profile fields, preferences, and immediate toggles.",
    description:
      "Use for account settings, organization preferences, and profile editing.",
    category: "forms",
    componentIds: ["button", "card", "input", "separator", "switch", "textarea"],
    code: ProfileSettingsForm01Code,
    preview: <ProfileSettingsForm01 />,
  },
  {
    id: "filter-toolbar-01",
    name: "Filter Toolbar",
    summary:
      "Compact listing filter block with search, segmented status, and actions.",
    description:
      "Use above tables and result lists where filtering is part of the main workflow.",
    category: "data",
    componentIds: ["badge", "button", "input", "select"],
    code: FilterToolbar01Code,
    preview: <FilterToolbar01 />,
  },
  {
    id: "inline-editable-table-01",
    name: "Inline Editable Table",
    summary:
      "Editable data block with in-cell text, quantity, date, lookup, notes, switch, and row actions.",
    description:
      "Use this for dense operator workflows such as dispatch plans, quote lines, or setup tables where edits should stay in the grid instead of opening a separate form.",
    category: "data",
    componentIds: ["button", "input", "lookup", "switch", "table", "textarea"],
    code: InlineEditableTable01Code,
    preview: <InlineEditableTable01 />,
  },
  {
    id: "storefront-search-01",
    name: "Storefront Search",
    summary:
      "Commerce search surface with category selector, search action, filter row, and discovery chips.",
    description:
      "Use this for storefront and catalog discovery flows where search needs to feel editorial and product-led.",
    category: "commerce",
    componentIds: ["button", "dropdown-menu", "input"],
    code: StorefrontSearch01Code,
    preview: <StorefrontSearch01 />,
  },
  {
    id: "featured-card-1",
    name: "FeaturedCard-1",
    summary:
      "Single featured product card for focused merchandising and responsive card studies.",
    description:
      "Use this when the storefront needs one hero product card preview that can be tuned independently before scaling to a row.",
    category: "commerce",
    componentIds: ["badge", "button", "card"],
    code: FeaturedCard1Code,
    preview: <FeaturedCard1 />,
  },
  {
    id: "featured-card-3",
    name: "FeaturedCard-3",
    summary:
      "Three-up featured card row for spacious storefront merchandising previews.",
    description:
      "Use this when the storefront needs a roomy featured lane with larger product storytelling.",
    category: "commerce",
    componentIds: ["badge", "button", "card"],
    code: FeaturedCard3Code,
    preview: <FeaturedCard3 />,
  },
  {
    id: "featured-card-4",
    name: "FeaturedCard-4",
    summary:
      "Four-up featured card row balancing editorial detail and denser product coverage.",
    description:
      "Use this variant when the storefront needs one more card per row without losing readability.",
    category: "commerce",
    componentIds: ["badge", "button", "card"],
    code: FeaturedCard4Code,
    preview: <FeaturedCard4 />,
  },
  {
    id: "featured-card-5",
    name: "FeaturedCard-5",
    summary:
      "Five-up featured card row for compact discovery lanes and promotional rails.",
    description:
      "Use this when the storefront needs tighter product density while keeping the same card language.",
    category: "commerce",
    componentIds: ["badge", "button", "card"],
    code: FeaturedCard5Code,
    preview: <FeaturedCard5 />,
  },
  {
    id: "featured-card-6",
    name: "FeaturedCard-6",
    summary:
      "Six-up featured card row for maximum single-row coverage in design-time previews.",
    description:
      "Use this for dense featured strip exploration and tighter product-led layout studies.",
    category: "commerce",
    componentIds: ["badge", "button", "card"],
    code: FeaturedCard6Code,
    preview: <FeaturedCard6 />,
  },
]

export const registryBlocksByCategory = registryBlockCategories.map((category) => ({
  ...category,
  items: registryBlocks.filter((block) => block.category === category.id),
}))

