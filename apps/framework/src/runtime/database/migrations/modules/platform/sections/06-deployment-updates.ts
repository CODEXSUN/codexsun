import type { DatabaseMigrationSection } from "../../../types.js"

export const deploymentUpdatesMigrationSection: DatabaseMigrationSection = {
  key: "platform-06-deployment-updates",
  order: 6,
  moduleKey: "platform",
  schemaSectionKey: "deployment-updates",
  name: "Deployment And Update Operations",
  tableNames: [
    "deployment_targets",
    "deployment_runs",
    "release_artifacts",
    "update_sources",
    "update_git_runs",
    "update_zip_packages",
    "update_zip_runs",
  ],
}
