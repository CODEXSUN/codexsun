import type { DatabaseMigrationSection } from "../../../types.js"

export const mediaStorageMigrationSection: DatabaseMigrationSection = {
  key: "platform-05-media-storage",
  order: 5,
  moduleKey: "platform",
  schemaSectionKey: "media-storage",
  name: "Media And Storage",
  tableNames: [
    "storage_disks",
    "storage_roots",
    "media_folders",
    "media_files",
    "media_versions",
    "media_tags",
    "media_tag_map",
    "media_usage",
  ],
}
