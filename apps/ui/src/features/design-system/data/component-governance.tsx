import { docsEntries } from "../../docs/data/catalog"
import type { DocsEntry } from "../../docs/data/catalog"

export type DesignSystemComponentDefault = {
  componentId: string
  componentLabel: string
  applicationName: string
  defaultExampleId: string
  defaultExampleTitle: string
  aliases: string[]
  usage: string
  notes: string
}

export type DesignSystemBuildChannel = {
  id: string
  name: string
  summary: string
  requiredComponentIds: string[]
}

type ComponentSeed = {
  applicationName: string
  defaultExampleId: string
  aliases: string[]
  usage: string
  notes: string
}

const componentSeedMap: Record<string, ComponentSeed> = {
  accordion: {
    applicationName: "contained",
    defaultExampleId: "accordion-04",
    aliases: ["box"],
    usage: "FAQ, policy disclosure, and expandable support content.",
    notes: "Use the contained accordion as the project default for all FAQ-style sections.",
  },
  alert: {
    applicationName: "primary",
    defaultExampleId: "alert-01",
    aliases: ["default", "banner"],
    usage: "Inline system messages and workflow guidance.",
    notes: "Reserve destructive and warning variants for interruption-level messaging only.",
  },
  "alert-dialog": {
    applicationName: "standard",
    defaultExampleId: "alert-dialog-01",
    aliases: ["confirm"],
    usage: "Destructive confirmation and explicit approval checkpoints.",
    notes: "Keep confirmation dialogs short and action-oriented.",
  },
  avatar: {
    applicationName: "profile",
    defaultExampleId: "avatar-01",
    aliases: ["default"],
    usage: "People, owners, assignees, and actor identity surfaces.",
    notes: "Favor the simple profile avatar across lists and headers.",
  },
  badge: {
    applicationName: "pill",
    defaultExampleId: "badge-01",
    aliases: ["status", "label"],
    usage: "Status markers, counts, and compact metadata.",
    notes: "Avoid using badges as primary actions.",
  },
  breadcrumb: {
    applicationName: "path",
    defaultExampleId: "breadcrumb-01",
    aliases: ["default"],
    usage: "Hierarchical navigation in nested app workspaces.",
    notes: "Use the simple path breadcrumb unless steps are the core interaction.",
  },
  button: {
    applicationName: "primary",
    defaultExampleId: "button-01",
    aliases: ["cta", "default"],
    usage: "Primary submission, confirmation, and call-to-action controls.",
    notes: "Use secondary and ghost only where hierarchy is already visually obvious.",
  },
  card: {
    applicationName: "panel",
    defaultExampleId: "card-01",
    aliases: ["default"],
    usage: "Section grouping, dashboard panels, and form containers.",
    notes: "Treat card as the default surface wrapper for grouped content.",
  },
  carousel: {
    applicationName: "hero",
    defaultExampleId: "carousel-01",
    aliases: ["default"],
    usage: "Feature highlights and media-led marketing sections.",
    notes: "Do not use carousel as the default data-navigation pattern inside apps.",
  },
  checkbox: {
    applicationName: "field",
    defaultExampleId: "checkbox-01",
    aliases: ["default", "selector"],
    usage: "Single opt-in, checklist, and multi-select field controls.",
    notes: "Use card-style checkbox variants only when the option itself needs richer content.",
  },
  collapsible: {
    applicationName: "disclosure",
    defaultExampleId: "collapsible-01",
    aliases: ["default"],
    usage: "Optional detail reveal within dense forms and tables.",
    notes: "Prefer collapsible for single-section disclosure and accordion for multi-item disclosure.",
  },
  "dropdown-menu": {
    applicationName: "action-menu",
    defaultExampleId: "dropdown-menu-01",
    aliases: ["menu"],
    usage: "Secondary actions for records, cards, and table rows.",
    notes: "Keep high-frequency primary actions visible outside the menu.",
  },
  input: {
    applicationName: "field",
    defaultExampleId: "input-01",
    aliases: ["text-field", "default"],
    usage: "Single-line text, numeric, and file entry across the application.",
    notes: "Adornments are allowed, but the base field stays the project default.",
  },
  "input-otp": {
    applicationName: "otp",
    defaultExampleId: "input-otp-01",
    aliases: ["verification-code"],
    usage: "One-time passcode and verification flows.",
    notes: "Use only for verification experiences, not generic segmented inputs.",
  },
  "navigation-menu": {
    applicationName: "site-nav",
    defaultExampleId: "navigation-menu-01",
    aliases: ["main-nav"],
    usage: "Top-level route clusters and app sections.",
    notes: "Use rich navigation only when the information architecture truly requires it.",
  },
  pagination: {
    applicationName: "table-pagination",
    defaultExampleId: "pagination-14",
    aliases: ["pager", "page-nav"],
    usage: "Paged tables, record indexes, and dense listing screens.",
    notes: "Use the table-pagination variant across app data grids to keep list behavior consistent.",
  },
  progress: {
    applicationName: "linear",
    defaultExampleId: "progress-02",
    aliases: ["status-meter"],
    usage: "Upload, sync, onboarding, and task progression feedback.",
    notes: "Prefer linear progress with a label in application workflows.",
  },
  "radio-group": {
    applicationName: "choice",
    defaultExampleId: "radio-group-01",
    aliases: ["single-select"],
    usage: "Mutually exclusive form choices.",
    notes: "Only upgrade to card variants when option context must stay visible.",
  },
  select: {
    applicationName: "picker",
    defaultExampleId: "select-01",
    aliases: ["dropdown-field"],
    usage: "Controlled option picking in forms and filters.",
    notes: "Use the base picker unless a workflow explicitly needs icon or theme selection.",
  },
  separator: {
    applicationName: "rule",
    defaultExampleId: "separator-01",
    aliases: ["divider"],
    usage: "Separate sections inside cards, drawers, and dialogs.",
    notes: "Use the plain rule by default; labeled separators should remain exceptional.",
  },
  slider: {
    applicationName: "range",
    defaultExampleId: "slider-01",
    aliases: ["default"],
    usage: "Numeric range and intensity input.",
    notes: "Prefer fields for exact numeric entry and sliders for approximate tuning.",
  },
  spinner: {
    applicationName: "busy",
    defaultExampleId: "spinner-01",
    aliases: ["loading"],
    usage: "Short-lived loading placeholders and async action feedback.",
    notes: "Pair spinner with a label when latency exceeds a quick interaction.",
  },
  switch: {
    applicationName: "toggle",
    defaultExampleId: "switch-01",
    aliases: ["default"],
    usage: "Immediate on/off settings and feature toggles.",
    notes: "Use switch only when the value changes immediately without further submit action.",
  },
  table: {
    applicationName: "data-grid",
    defaultExampleId: "table-09",
    aliases: ["grid", "list"],
    usage: "Operational records, reports, and dense business data.",
    notes: "Use the data-table variant as the default foundation for app data views.",
  },
  tabs: {
    applicationName: "contained",
    defaultExampleId: "tabs-05",
    aliases: ["box"],
    usage: "Segmented content within a single page or workspace.",
    notes: "The contained tabs align with the application’s panel-heavy layout language.",
  },
  textarea: {
    applicationName: "notes",
    defaultExampleId: "textarea-01",
    aliases: ["multiline-field"],
    usage: "Descriptions, notes, and longer free-form responses.",
    notes: "Start with the base notes field and add helper text only when needed.",
  },
  tooltip: {
    applicationName: "hint",
    defaultExampleId: "tooltip-01",
    aliases: ["helper"],
    usage: "Short helper text and icon clarifications.",
    notes: "Do not hide essential workflow instructions inside tooltips.",
  },
}

const docsEntryMap = new Map<string, DocsEntry>(
  docsEntries.map((entry): [string, DocsEntry] => [entry.id, entry])
)

function getDefaultExampleTitle(componentId: string, defaultExampleId: string) {
  const entry = docsEntryMap.get(componentId)

  if (!entry) {
    return defaultExampleId
  }

  return (
    entry.examples.find((example) => example.id === defaultExampleId)?.title ??
    entry.examples[0]?.title ??
    defaultExampleId
  )
}

export const designSystemComponentDefaults: DesignSystemComponentDefault[] = docsEntries.map(
  (entry) => {
    const seed = componentSeedMap[entry.id] ?? {
      applicationName: "default",
      defaultExampleId: entry.examples[0]?.id ?? `${entry.id}-01`,
      aliases: [],
      usage: `${entry.name} usage is available in the component catalog.`,
      notes: "No custom project naming has been defined yet.",
    }

    return {
      componentId: entry.id,
      componentLabel: entry.name,
      applicationName: seed.applicationName,
      defaultExampleId: seed.defaultExampleId,
      defaultExampleTitle: getDefaultExampleTitle(
        entry.id,
        seed.defaultExampleId
      ),
      aliases: seed.aliases,
      usage: seed.usage,
      notes: seed.notes,
    }
  }
)

const defaultMap = new Map(
  designSystemComponentDefaults.map((item) => [item.componentId, item])
)

export function getDesignSystemComponentDefault(componentId: string) {
  return defaultMap.get(componentId) ?? null
}

export function resolveProjectComponentName(componentId: string) {
  return getDesignSystemComponentDefault(componentId)?.applicationName ?? componentId
}

export function resolveProjectComponentDefaultExampleId(componentId: string) {
  return (
    getDesignSystemComponentDefault(componentId)?.defaultExampleId ?? null
  )
}

export const applicationBuildChannels: DesignSystemBuildChannel[] = [
  {
    id: "actions",
    name: "Action controls",
    summary: "Primary buttons, compact labels, and high-frequency commands.",
    requiredComponentIds: ["button", "badge", "dropdown-menu"],
  },
  {
    id: "forms",
    name: "Form input",
    summary: "Core capture controls for data entry, verification, and settings.",
    requiredComponentIds: [
      "input",
      "textarea",
      "select",
      "checkbox",
      "radio-group",
      "switch",
      "input-otp",
      "slider",
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    summary: "Movement across pages, sections, and records.",
    requiredComponentIds: [
      "breadcrumb",
      "navigation-menu",
      "pagination",
      "tabs",
    ],
  },
  {
    id: "surfaces",
    name: "Surfaces",
    summary: "Grouping, layout, and supporting presentation surfaces.",
    requiredComponentIds: ["card", "separator", "avatar", "carousel"],
  },
  {
    id: "feedback",
    name: "Feedback",
    summary: "States, confirmations, disclosure, and async progress.",
    requiredComponentIds: [
      "accordion",
      "alert",
      "alert-dialog",
      "collapsible",
      "progress",
      "spinner",
      "tooltip",
    ],
  },
]

export const applicationBuildReadiness = applicationBuildChannels.map((channel) => {
  const presentComponentIds = channel.requiredComponentIds.filter((componentId) =>
    docsEntryMap.has(componentId)
  )
  const missingComponentIds = channel.requiredComponentIds.filter(
    (componentId) => !docsEntryMap.has(componentId)
  )

  return {
    ...channel,
    presentComponentIds,
    missingComponentIds,
    status: missingComponentIds.length === 0 ? "ready" : "missing",
    coveragePercent: Math.round(
      (presentComponentIds.length / channel.requiredComponentIds.length) * 100
    ),
  }
})

const requiredComponentIds = Array.from(
  new Set(
    applicationBuildChannels.flatMap((channel) => channel.requiredComponentIds)
  )
)

export const applicationBuildCoverage = {
  requiredCount: requiredComponentIds.length,
  presentCount: requiredComponentIds.filter((componentId) =>
    docsEntryMap.has(componentId)
  ).length,
  missingComponentIds: requiredComponentIds.filter(
    (componentId) => !docsEntryMap.has(componentId)
  ),
}

export const designSystemGovernanceSummary = {
  governedComponents: designSystemComponentDefaults.length,
  aliasedComponents: designSystemComponentDefaults.filter(
    (item) => item.aliases.length > 0
  ).length,
  defaultVariants: designSystemComponentDefaults.filter((item) =>
    item.defaultExampleId.length > 0
  ).length,
}
