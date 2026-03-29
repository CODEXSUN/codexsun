import type { DatabaseFoundationSection } from "../types.js"

export const deploymentUpdatesSection: DatabaseFoundationSection = {
  key: "deployment-updates",
  order: 6,
  name: "Deployment And Update Operations",
  purpose: "Tracks deployment targets, release artifacts, and update execution records.",
  tables: [
    { key: "deployment_targets", name: "deployment_targets", purpose: "Deployment destination records." },
    { key: "deployment_runs", name: "deployment_runs", purpose: "Deployment execution records." },
    { key: "release_artifacts", name: "release_artifacts", purpose: "Built release artifacts." },
    { key: "update_sources", name: "update_sources", purpose: "Git or zip update sources." },
    { key: "update_git_runs", name: "update_git_runs", purpose: "Git-based update execution records." },
    { key: "update_zip_packages", name: "update_zip_packages", purpose: "Uploaded zip packages." },
    { key: "update_zip_runs", name: "update_zip_runs", purpose: "Zip-based update execution records." },
  ],
}
