import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { ecommerceWorkspaceItems } from "@ecommerce/shared"
import {
  AnimatedTabs,
  type AnimatedContentTab,
} from "@/registry/concerns/navigation/animated-tabs"

export function EcommerceWorkspaceTabs({
  sectionId,
  sections,
}: {
  sectionId?: string
  sections: Record<string, React.ReactNode>
}) {
  const navigate = useNavigate()
  const activeSectionId = sectionId ?? "overview"
  const tabs = useMemo<AnimatedContentTab[]>(
    () =>
      ecommerceWorkspaceItems.map((item) => ({
        label: item.name,
        value: item.id,
        content: sections[item.id] ?? null,
        contentClassName: "mt-0 rounded-[1.25rem] border border-border/70 bg-card/70 p-0",
      })),
    [sections]
  )

  return (
    <AnimatedTabs
      tabs={tabs}
      selectedTabValue={activeSectionId}
      onTabChange={(value) => {
        const nextItem = ecommerceWorkspaceItems.find((item) => item.id === value)

        if (nextItem) {
          void navigate(nextItem.route)
        }
      }}
    />
  )
}
