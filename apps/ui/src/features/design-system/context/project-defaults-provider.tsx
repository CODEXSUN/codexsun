/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { designSystemComponentDefaults } from "../data/component-governance"

type ProjectDefaultOverrideMap = Record<string, string>

type ResolvedProjectDefault = {
  componentId: string
  componentLabel: string
  sourceDefaultExampleId: string
  sourceDefaultExampleTitle: string
  activeDefaultExampleId: string
  activeDefaultExampleTitle: string
  applicationName: string
  aliases: string[]
  isOverridden: boolean
}

type ProjectDefaultsContextValue = {
  overrides: ProjectDefaultOverrideMap
  resetAllPreviewDefaults: () => void
  clearPreviewDefault: (componentId: string) => void
  setPreviewDefault: (componentId: string, exampleId: string) => void
  getResolvedDefault: (componentId: string) => ResolvedProjectDefault | null
}

const PROJECT_DEFAULTS_STORAGE_KEY = "codexsun.ui.project-default-overrides"

const ProjectDefaultsContext = createContext<ProjectDefaultsContextValue | null>(
  null
)

function readStoredOverrides() {
  if (typeof window === "undefined") {
    return {}
  }

  const rawValue = window.localStorage.getItem(PROJECT_DEFAULTS_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    )
  } catch {
    return {}
  }
}

type ProviderComponentDefault = (typeof designSystemComponentDefaults)[number]

function buildResolvedDefault(
  componentDefault: ProviderComponentDefault,
  overrideExampleId?: string
): ResolvedProjectDefault {
  const activeDefaultExampleId =
    overrideExampleId ?? componentDefault.defaultExampleId

  return {
    componentId: componentDefault.componentId,
    componentLabel: componentDefault.componentLabel,
    sourceDefaultExampleId: componentDefault.defaultExampleId,
    sourceDefaultExampleTitle: componentDefault.defaultExampleTitle,
    activeDefaultExampleId,
    activeDefaultExampleTitle:
      componentDefault.availableExamples.find(
        (example) => example.id === activeDefaultExampleId
      )?.title ?? componentDefault.defaultExampleTitle,
    applicationName: componentDefault.applicationName,
    aliases: componentDefault.aliases,
    isOverridden:
      overrideExampleId !== undefined &&
      overrideExampleId !== componentDefault.defaultExampleId,
  }
}

export function ProjectDefaultsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [overrides, setOverrides] = useState<ProjectDefaultOverrideMap>(() =>
    readStoredOverrides()
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(
      PROJECT_DEFAULTS_STORAGE_KEY,
      JSON.stringify(overrides)
    )
  }, [overrides])

  const value = useMemo<ProjectDefaultsContextValue>(
    () => ({
      overrides,
      setPreviewDefault(componentId, exampleId) {
        setOverrides((current) => ({
          ...current,
          [componentId]: exampleId,
        }))
      },
      clearPreviewDefault(componentId) {
        setOverrides((current) => {
          const next = { ...current }
          delete next[componentId]
          return next
        })
      },
      resetAllPreviewDefaults() {
        setOverrides({})
      },
      getResolvedDefault(componentId) {
        const componentDefault =
          designSystemComponentDefaults.find(
            (item) => item.componentId === componentId
          ) ?? null

        if (!componentDefault) {
          return null
        }

        return buildResolvedDefault(componentDefault, overrides[componentId])
      },
    }),
    [overrides]
  )

  return (
    <ProjectDefaultsContext.Provider value={value}>
      {children}
    </ProjectDefaultsContext.Provider>
  )
}

export function useProjectDefaults() {
  const context = useContext(ProjectDefaultsContext)

  if (!context) {
    throw new Error("useProjectDefaults must be used within ProjectDefaultsProvider")
  }

  return context
}
