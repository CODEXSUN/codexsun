import { ZetroClaudeAnalysisPage } from "./pages/claude-analysis-page";
import { ZetroFindingsPage } from "./pages/findings-page";
import { ZetroGuardrailsPage } from "./pages/guardrails-page";
import { ZetroMemoryPage } from "./pages/memory-page";
import { ZetroOverviewPage } from "./pages/overview-page";
import { ZetroPlaybooksPage } from "./pages/playbooks-page";
import { ZetroReviewPage } from "./pages/review-page";
import { ZetroRolloutPlanPage } from "./pages/rollout-plan-page";
import { ZetroRunsPage } from "./pages/runs-page";
import { ZetroSettingsPage } from "./pages/settings-page";

export function ZetroWorkspaceSection({ sectionId }: { sectionId?: string }) {
  switch (sectionId ?? "overview") {
    case "claude-analysis":
      return <ZetroClaudeAnalysisPage />;
    case "playbooks":
      return <ZetroPlaybooksPage />;
    case "rollout-plan":
      return <ZetroRolloutPlanPage />;
    case "runs":
      return <ZetroRunsPage />;
    case "findings":
      return <ZetroFindingsPage />;
    case "review":
      return <ZetroReviewPage />;
    case "memory":
      return <ZetroMemoryPage />;
    case "guardrails":
      return <ZetroGuardrailsPage />;
    case "settings":
      return <ZetroSettingsPage />;
    case "overview":
    default:
      return <ZetroOverviewPage />;
  }
}
