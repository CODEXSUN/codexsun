import type { DatabaseFoundationSection } from "../types.js"

export const mediaStorageSection: DatabaseFoundationSection = {
  key: "media-storage",
  order: 5,
  name: "Media And Storage",
  purpose: "Defines storage targets, media folders, file metadata, versions, tags, and usage.",
  tables: [
    { key: "storage_disks", name: "storage_disks", purpose: "Storage disk definitions." },
    { key: "storage_roots", name: "storage_roots", purpose: "Storage root definitions." },
    { key: "media_folders", name: "media_folders", purpose: "Logical media folders." },
    { key: "media_files", name: "media_files", purpose: "Stored media metadata." },
    { key: "media_versions", name: "media_versions", purpose: "Versioned media derivations." },
    { key: "media_tags", name: "media_tags", purpose: "Media tag definitions." },
    { key: "media_tag_map", name: "media_tag_map", purpose: "Media to tag mapping." },
    { key: "media_usage", name: "media_usage", purpose: "Media usage records." },
  ],
}
