import type { ReactNode } from "react"

import LoginPage01 from "@/registry/blocks/auth/login-page-01"
import LoginPage01Code from "@/registry/blocks/auth/login-page-01.tsx?raw"
import LoginPage02 from "@/registry/blocks/auth/login-page-02"
import LoginPage02Code from "@/registry/blocks/auth/login-page-02.tsx?raw"
import SignInPanel01 from "@/registry/blocks/auth/sign-in-panel-01"
import SignInPanel01Code from "@/registry/blocks/auth/sign-in-panel-01.tsx?raw"
import FilterToolbar01 from "@/registry/blocks/data/filter-toolbar-01"
import FilterToolbar01Code from "@/registry/blocks/data/filter-toolbar-01.tsx?raw"
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
    id: "forms",
    name: "Forms",
    description: "Multi-field data capture and editable settings surfaces.",
  },
  {
    id: "data",
    name: "Data",
    description: "List filters, table helpers, and result control patterns.",
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
]

export const registryBlocksByCategory = registryBlockCategories.map((category) => ({
  ...category,
  items: registryBlocks.filter((block) => block.category === category.id),
}))

