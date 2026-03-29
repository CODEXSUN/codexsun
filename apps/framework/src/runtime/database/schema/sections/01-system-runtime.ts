import type { DatabaseFoundationSection } from "../types.js"

export const systemRuntimeSection: DatabaseFoundationSection = {
  key: "system-runtime",
  order: 1,
  name: "System And Runtime Control",
  purpose: "Tracks migrations, seeders, system settings, and runtime job control.",
  tables: [
    { key: "system_migrations", name: "system_migrations", purpose: "Applied migration history." },
    { key: "system_seeders", name: "system_seeders", purpose: "Applied seeder history." },
    { key: "system_settings", name: "system_settings", purpose: "Platform-level setting storage." },
    { key: "system_jobs", name: "system_jobs", purpose: "Runtime background job state." },
    { key: "system_job_locks", name: "system_job_locks", purpose: "Exclusive runtime job locks." },
  ],
}
