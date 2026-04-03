import { docsEntries } from "../../registry/data/catalog"
import type { DocsEntry } from "../../registry/data/catalog"
import { projectDesignSystemDefaults } from "./project-defaults"

export type DesignSystemComponentDefault = {
  componentId: string
  componentLabel: string
  applicationName: string
  defaultExampleId: string
  defaultExampleTitle: string
  availableExamples: {
    id: string
    title: string
  }[]
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

export const designSystemComponentDefaults: DesignSystemComponentDefault[] =
  docsEntries.map((entry) => {
    const seed = projectDesignSystemDefaults[entry.id] ?? {
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
      availableExamples: entry.examples.map((example) => ({
        id: example.id,
        title: example.title,
      })),
      aliases: seed.aliases,
      usage: seed.usage,
      notes: seed.notes,
    }
  })

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

export function formatDesignSystemExampleLabel(
  componentId: string,
  exampleId: string
) {
  const componentDefault = getDesignSystemComponentDefault(componentId)

  if (!componentDefault) {
    return exampleId
  }

  const exampleIndex = componentDefault.availableExamples.findIndex(
    (example) => example.id === exampleId
  )
  const exampleTitle =
    componentDefault.availableExamples[exampleIndex]?.title ?? exampleId

  if (exampleIndex === -1) {
    return exampleTitle
  }

  return `${String(exampleIndex + 1).padStart(2, "0")} - ${exampleTitle}`
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
      "lookup",
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
