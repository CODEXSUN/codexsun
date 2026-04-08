import { ColdCallsPage } from "./pages/cold-calls-page"
import { LeadPipelinePage } from "./pages/lead-pipeline-page"

export function CrmWorkspaceSection({ sectionId }: { sectionId?: string }) {
  if (sectionId === "cold-calls") {
    return <ColdCallsPage />
  }

  // Default: leads pipeline view
  return <LeadPipelinePage />
}
