import { ColdCallsPage } from "./pages/cold-calls-page"
import { CrmOverviewPage } from "./pages/overview-page"
import { LeadPipelinePage } from "./pages/lead-pipeline-page"
import { CrmTaskMonitorPage } from "./pages/task-monitor-page"

export function CrmWorkspaceSection({ sectionId }: { sectionId?: string }) {
  if ((sectionId ?? "overview") === "overview") {
    return <CrmOverviewPage />
  }

  if (sectionId === "cold-calls") {
    return <ColdCallsPage />
  }

  if (sectionId === "task-monitor") {
    return <CrmTaskMonitorPage />
  }

  return <LeadPipelinePage />
}
