import { ColdCallsPage } from "./pages/cold-calls-page"
import { CrmCustomer360Page } from "./pages/customer-360-page"
import { CrmOverviewPage } from "./pages/overview-page"
import { LeadPipelinePage } from "./pages/lead-pipeline-page"
import { CrmScoreboardPage } from "./pages/scoreboard-page"
import { CrmTaskMonitorPage } from "./pages/task-monitor-page"

export function CrmWorkspaceSection({ sectionId }: { sectionId?: string }) {
  if ((sectionId ?? "overview") === "overview") {
    return <CrmOverviewPage />
  }

  if (sectionId === "cold-calls") {
    return <ColdCallsPage />
  }

  if (sectionId === "customer-360") {
    return <CrmCustomer360Page />
  }

  if (sectionId === "task-monitor") {
    return <CrmTaskMonitorPage />
  }

  if (sectionId === "scoreboard") {
    return <CrmScoreboardPage />
  }

  return <LeadPipelinePage />
}
