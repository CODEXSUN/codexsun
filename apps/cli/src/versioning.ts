import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export type ApplicationVersion = {
  referenceNumber: number
  version: string
  label: string
  releaseTag: string
}

type PackageManifest = {
  version?: string
}

type PackageLockManifest = {
  version?: string
  packages?: Record<string, { version?: string }>
}

export function createApplicationVersion(referenceNumber: number): ApplicationVersion {
  if (!Number.isInteger(referenceNumber) || referenceNumber <= 0) {
    throw new Error("Reference number must be a positive integer.")
  }

  const version = `1.0.${referenceNumber}`

  return {
    referenceNumber,
    version,
    label: `v ${version}`,
    releaseTag: `v-${version}`,
  }
}

export function parseLatestReference(changelogContent: string): {
  number: number
  title: string
} {
  const match = changelogContent.match(
    /### \[(?:#(\d+)|v\s+1\.0\.(\d+))\]\s+\d{4}-\d{2}-\d{2}\s+-\s+(.+)/
  )

  const latestReferenceRaw = match?.[1] ?? match?.[2]
  const latestTitle = match?.[3]?.trim()

  if (!latestReferenceRaw || !latestTitle) {
    throw new Error("Could not determine the latest changelog reference entry.")
  }

  const latestReference = Number.parseInt(latestReferenceRaw, 10)

  if (!Number.isFinite(latestReference) || latestReference <= 0) {
    throw new Error("The changelog reference number is invalid.")
  }

  return {
    number: latestReference,
    title: latestTitle,
  }
}

export function formatCommitMessage(referenceNumber: number, message: string): string {
  const normalizedMessage = message
    .trim()
    .replace(/^#\d+\s*-\s*/, "")
    .replace(/^#\d+\s+/, "")

  if (!normalizedMessage) {
    throw new Error("Commit message body is required.")
  }

  return `#${referenceNumber} - ${normalizedMessage}`
}

function updatePackageVersionFile(filePath: string, version: string) {
  const manifest = JSON.parse(readFileSync(filePath, "utf8")) as PackageManifest
  manifest.version = version
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
}

function updatePackageLockVersionFile(filePath: string, version: string) {
  const manifest = JSON.parse(readFileSync(filePath, "utf8")) as PackageLockManifest
  manifest.version = version

  if (manifest.packages?.[""]) {
    manifest.packages[""].version = version
  }

  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
}

function renderApplicationVersionFile(version: ApplicationVersion) {
  return [
    "export type ApplicationVersion = {",
    "  referenceNumber: number",
    "  version: string",
    "  label: string",
    "  releaseTag: string",
    "}",
    "",
    "export const applicationVersion: ApplicationVersion = {",
    `  referenceNumber: ${version.referenceNumber},`,
    `  version: "${version.version}",`,
    `  label: "${version.label}",`,
    `  releaseTag: "${version.releaseTag}",`,
    "}",
    "",
  ].join("\n")
}

function updateChangelog(content: string, version: ApplicationVersion) {
  let updated = content

  updated = updated.replace(
    /- Current package version: `[^`]+`/,
    `- Current package version: \`${version.version}\``
  )
  updated = updated.replace(
    /- Current release tag: `[^`]+`/,
    `- Current release tag: \`${version.releaseTag}\``
  )
  updated = updated.replace(
    /- Reference format: `[^`]+`/,
    "- Reference format: `v 1.0.<number>` linked to task `#<number>`"
  )
  updated = updated.replace(
    /^##\s+v-[^\r\n]+/m,
    `## ${version.releaseTag}`
  )
  updated = updated.replace(
    /### \[#(\d+)\]\s+(\d{4}-\d{2}-\d{2}\s+-\s+.+)$/gm,
    (_match, referenceNumber, suffix) => `### [v 1.0.${referenceNumber}] ${suffix}`
  )

  return updated
}

export function syncVersionFiles(rootDir: string, referenceNumber: number) {
  const version = createApplicationVersion(referenceNumber)

  updatePackageVersionFile(join(rootDir, "package.json"), version.version)
  updatePackageLockVersionFile(join(rootDir, "package-lock.json"), version.version)
  updatePackageVersionFile(join(rootDir, "apps", "mobile", "package.json"), version.version)
  updatePackageLockVersionFile(
    join(rootDir, "apps", "mobile", "package-lock.json"),
    version.version
  )

  writeFileSync(
    join(rootDir, "apps", "framework", "shared", "application-version.ts"),
    renderApplicationVersionFile(version),
    "utf8"
  )

  const changelogPath = join(rootDir, "ASSIST", "Documentation", "CHANGELOG.md")
  const changelogContent = readFileSync(changelogPath, "utf8")
  writeFileSync(changelogPath, updateChangelog(changelogContent, version), "utf8")

  return version
}
