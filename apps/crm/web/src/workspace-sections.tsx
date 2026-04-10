import { ColdCallsPage } from "./pages/cold-calls-page"
import { CrmOverviewPage } from "./pages/overview-page"
import { LeadPipelinePage } from "./pages/lead-pipeline-page"

export function CrmWorkspaceSection({ sectionId }: { sectionId?: string }) {
  if ((sectionId ?? "overview") === "overview") {
    return <CrmOverviewPage />
  }

  if (sectionId === "cold-calls") {
    return <ColdCallsPage />
  }

  return <LeadPipelinePage />
}
