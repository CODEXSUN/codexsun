import { BookOpenIcon } from 'lucide-react'

import { MainWorkspace, type MainWorkspaceProps } from '../main-workspace'

export type DocumentationWorkspaceProps = MainWorkspaceProps

/** Shared MDI workspace defaults for documentation and knowledge applications. */
export function DocumentationWorkspace({
  applicationIcon = BookOpenIcon,
  applicationId = 'docs',
  applicationName = 'Docs',
  primaryAction = null,
  searchPlaceholder = 'Search documentation',
  sidebarContentClassName = 'docs-sidebar-scroll',
  sidebarStateKey = `codexsun.${applicationId}.sidebar`,
  statusLabel = 'Ready',
  workspaceTitle = 'Documentation',
  ...props
}: DocumentationWorkspaceProps) {
  return (
    <MainWorkspace
      {...props}
      applicationIcon={applicationIcon}
      applicationId={applicationId}
      applicationName={applicationName}
      primaryAction={primaryAction}
      searchPlaceholder={searchPlaceholder}
      sidebarContentClassName={sidebarContentClassName}
      sidebarStateKey={sidebarStateKey}
      statusLabel={statusLabel}
      workspaceTitle={workspaceTitle}
    />
  )
}
