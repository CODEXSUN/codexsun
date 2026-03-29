import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { pathToFileURL } from "node:url"

const execFileAsync = promisify(execFile)

export type GitStatusSummary = {
  hasChanges: boolean
  stagedCount: number
  unstagedCount: number
  untrackedCount: number
}

export type AheadBehind = {
  ahead: number
  behind: number
}

type GitExecutionResult = {
  ok: boolean
  stdout: string
  stderr: string
}

type GitRepositoryState = {
  rootDir: string
  gitDir: string
  branch: string
  upstream: string | null
  remoteName: string | null
  status: GitStatusSummary
  aheadBehind: AheadBehind
  operation: string | null
}

function trimTrailingNewline(value: string): string {
  return value.replace(/\r?\n$/, "")
}

export function parseGitStatusPorcelain(raw: string): GitStatusSummary {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)

  let stagedCount = 0
  let unstagedCount = 0
  let untrackedCount = 0

  for (const line of lines) {
    const indexStatus = line[0] ?? " "
    const worktreeStatus = line[1] ?? " "

    if (line.startsWith("??")) {
      untrackedCount += 1
      continue
    }

    if (indexStatus !== " " && indexStatus !== "?") {
      stagedCount += 1
    }

    if (worktreeStatus !== " ") {
      unstagedCount += 1
    }
  }

  return {
    hasChanges: lines.length > 0,
    stagedCount,
    unstagedCount,
    untrackedCount,
  }
}

export function parseAheadBehind(raw: string): AheadBehind {
  const [aheadRaw = "0", behindRaw = "0"] = raw.trim().split(/\s+/)

  return {
    ahead: Number.parseInt(aheadRaw, 10) || 0,
    behind: Number.parseInt(behindRaw, 10) || 0,
  }
}

export function inferPushTarget(
  branch: string,
  upstream: string | null,
  remoteName: string | null
): string[] {
  if (upstream) {
    return ["push"]
  }

  if (!remoteName) {
    return ["push"]
  }

  return ["push", "-u", remoteName, branch]
}

export function parseLatestReferenceNumber(changelogContent: string): number {
  const matches = [...changelogContent.matchAll(/### \[#(\d+)\]/g)]
  const latestReference = matches[0]?.[1]

  if (!latestReference) {
    throw new Error("Could not determine the latest changelog reference number.")
  }

  const parsedReference = Number.parseInt(latestReference, 10)

  if (!Number.isFinite(parsedReference) || parsedReference <= 0) {
    throw new Error("The changelog reference number is invalid.")
  }

  return parsedReference
}

export function formatCommitMessage(referenceNumber: number, message: string): string {
  const normalizedMessage = message.trim().replace(/^#\d+\s+/, "")

  if (!normalizedMessage) {
    throw new Error("Commit message body is required.")
  }

  return `#${referenceNumber} ${normalizedMessage}`
}

function describeAheadBehind(aheadBehind: AheadBehind): string {
  if (aheadBehind.ahead === 0 && aheadBehind.behind === 0) {
    return "up to date"
  }

  if (aheadBehind.ahead > 0 && aheadBehind.behind === 0) {
    return `ahead by ${aheadBehind.ahead}`
  }

  if (aheadBehind.ahead === 0 && aheadBehind.behind > 0) {
    return `behind by ${aheadBehind.behind}`
  }

  return `diverged: ahead ${aheadBehind.ahead}, behind ${aheadBehind.behind}`
}

async function runGit(
  args: string[],
  cwd: string,
  allowFailure = false
): Promise<GitExecutionResult> {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
    })

    return {
      ok: true,
      stdout,
      stderr,
    }
  } catch (error) {
    const execError = error as {
      stdout?: string
      stderr?: string
      message: string
    }

    if (!allowFailure) {
      throw new Error(execError.stderr?.trim() || execError.message)
    }

    return {
      ok: false,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message,
    }
  }
}

async function getRepositoryRoot(cwd: string): Promise<string> {
  const result = await runGit(["rev-parse", "--show-toplevel"], cwd)

  return trimTrailingNewline(result.stdout)
}

async function getGitDirectory(cwd: string): Promise<string> {
  const result = await runGit(["rev-parse", "--git-dir"], cwd)

  return trimTrailingNewline(result.stdout)
}

function getChangelogPath(rootDir: string): string {
  return join(rootDir, "ASSIST", "Documentation", "CHANGELOG.md")
}

function getCurrentReferenceNumber(rootDir: string): number {
  const changelogPath = getChangelogPath(rootDir)

  if (!existsSync(changelogPath)) {
    throw new Error("ASSIST changelog file was not found.")
  }

  const changelogContent = readFileSync(changelogPath, "utf8")

  return parseLatestReferenceNumber(changelogContent)
}

function detectGitOperation(gitDir: string): string | null {
  const markers: Array<[string, string]> = [
    ["rebase-merge", "rebase in progress"],
    ["rebase-apply", "rebase in progress"],
    ["MERGE_HEAD", "merge in progress"],
    ["CHERRY_PICK_HEAD", "cherry-pick in progress"],
    ["REVERT_HEAD", "revert in progress"],
    ["BISECT_LOG", "bisect in progress"],
  ]

  for (const [relativePath, label] of markers) {
    if (existsSync(join(gitDir, relativePath))) {
      return label
    }
  }

  return null
}

async function inspectRepository(cwd: string): Promise<GitRepositoryState> {
  const rootDir = await getRepositoryRoot(cwd)
  const gitDirRaw = await getGitDirectory(rootDir)
  const gitDir = join(rootDir, gitDirRaw)

  const branchResult = await runGit(
    ["branch", "--show-current"],
    rootDir,
    true
  )
  const upstreamResult = await runGit(
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    rootDir,
    true
  )
  const remoteResult = await runGit(["remote"], rootDir, true)
  const statusResult = await runGit(["status", "--porcelain"], rootDir)

  const branch = trimTrailingNewline(branchResult.stdout)
  const upstream = upstreamResult.ok
    ? trimTrailingNewline(upstreamResult.stdout)
    : null

  const remotes = remoteResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const remoteName = upstream
    ? upstream.split("/")[0] ?? null
    : remotes.includes("origin")
      ? "origin"
      : (remotes[0] ?? null)

  let aheadBehind: AheadBehind = { ahead: 0, behind: 0 }

  if (upstream) {
    await runGit(["fetch", remoteName ?? "origin"], rootDir, true)
    const aheadBehindResult = await runGit(
      ["rev-list", "--left-right", "--count", `${upstream}...HEAD`],
      rootDir
    )
    aheadBehind = parseAheadBehind(aheadBehindResult.stdout)
  }

  return {
    rootDir,
    gitDir,
    branch,
    upstream,
    remoteName,
    status: parseGitStatusPorcelain(statusResult.stdout),
    aheadBehind,
    operation: detectGitOperation(gitDir),
  }
}

function printRepositoryState(state: GitRepositoryState): void {
  output.write("\nCodexsun GitHub Helper\n")
  output.write(`Repository: ${state.rootDir}\n`)
  output.write(`Branch: ${state.branch || "(detached HEAD)"}\n`)
  output.write(`Upstream: ${state.upstream ?? "(none)"}\n`)
  output.write(`Sync: ${describeAheadBehind(state.aheadBehind)}\n`)
  output.write(
    `Changes: staged ${state.status.stagedCount}, unstaged ${state.status.unstagedCount}, untracked ${state.status.untrackedCount}\n`
  )

  if (state.operation) {
    output.write(`Git state: ${state.operation}\n`)
  }
}

async function promptYesNo(
  rl: ReturnType<typeof createInterface>,
  label: string,
  defaultValue = true
): Promise<boolean> {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] "
  const answer = (await rl.question(`${label}${suffix}`)).trim().toLowerCase()

  if (!answer) {
    return defaultValue
  }

  return answer === "y" || answer === "yes"
}

async function promptRequired(
  rl: ReturnType<typeof createInterface>,
  label: string
): Promise<string> {
  while (true) {
    const answer = (await rl.question(`${label}: `)).trim()

    if (answer) {
      return answer
    }

    output.write("A value is required.\n")
  }
}

async function createCommitIfNeeded(
  state: GitRepositoryState,
  rl: ReturnType<typeof createInterface>
): Promise<void> {
  if (!state.status.hasChanges) {
    return
  }

  const shouldCommit = await promptYesNo(
    rl,
    "The repository has uncommitted changes. Stage all changes and create a commit?",
    true
  )

  if (!shouldCommit) {
    throw new Error("Commit and push cancelled because the repository is dirty.")
  }

  const referenceNumber = getCurrentReferenceNumber(state.rootDir)
  const messageBody = await promptRequired(
    rl,
    `Commit message body for #${referenceNumber}`
  )
  const message = formatCommitMessage(referenceNumber, messageBody)

  output.write(`Commit subject: ${message}\n`)

  await runGit(["add", "-A"], state.rootDir)
  const commitResult = await runGit(
    ["commit", "-m", message],
    state.rootDir,
    true
  )

  if (!commitResult.ok) {
    const combinedOutput = `${commitResult.stdout}\n${commitResult.stderr}`.trim()

    if (combinedOutput.includes("nothing to commit")) {
      output.write("Nothing new to commit after staging.\n")
      return
    }

    throw new Error(commitResult.stderr.trim() || "Git commit failed.")
  }

  output.write("Commit created successfully.\n")
}

async function rebaseIfNeeded(
  state: GitRepositoryState,
  rl: ReturnType<typeof createInterface>
): Promise<void> {
  if (!state.upstream || state.aheadBehind.behind === 0) {
    return
  }

  const shouldRebase = await promptYesNo(
    rl,
    `The branch is ${describeAheadBehind(state.aheadBehind)}. Pull and rebase before push?`,
    true
  )

  if (!shouldRebase) {
    throw new Error("Push cancelled because the branch is not in sync with upstream.")
  }

  const remoteName = state.remoteName ?? "origin"
  const branchName = state.upstream.split("/").slice(1).join("/")
  const rebaseResult = await runGit(
    ["pull", "--rebase", "--autostash", remoteName, branchName],
    state.rootDir,
    true
  )

  if (!rebaseResult.ok) {
    throw new Error(
      rebaseResult.stderr.trim() ||
        "Rebase failed. Resolve conflicts manually and run the helper again."
    )
  }

  output.write("Rebase completed successfully.\n")
}

async function pushBranch(
  state: GitRepositoryState,
  rl: ReturnType<typeof createInterface>
): Promise<void> {
  const pushArgs = inferPushTarget(state.branch, state.upstream, state.remoteName)
  const shouldPush = await promptYesNo(
    rl,
    `Push branch ${state.branch} now?`,
    true
  )

  if (!shouldPush) {
    throw new Error("Push cancelled.")
  }

  const pushResult = await runGit(pushArgs, state.rootDir, true)

  if (!pushResult.ok) {
    throw new Error(pushResult.stderr.trim() || "Git push failed.")
  }

  output.write("Push completed successfully.\n")
}

export async function runGitHubHelper(cwd = process.cwd()): Promise<number> {
  const rl = createInterface({ input, output })

  try {
    let state = await inspectRepository(cwd)
    printRepositoryState(state)

    if (!state.branch) {
      throw new Error("Detached HEAD is not supported. Check out a branch first.")
    }

    if (state.operation) {
      throw new Error(
        `Git has ${state.operation}. Resolve it before using the helper.`
      )
    }

    await createCommitIfNeeded(state, rl)
    state = await inspectRepository(state.rootDir)
    await rebaseIfNeeded(state, rl)
    state = await inspectRepository(state.rootDir)
    await pushBranch(state, rl)

    output.write("\nGitHub helper finished successfully.\n")
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    output.write(`\nGitHub helper failed: ${message}\n`)
    return 1
  } finally {
    rl.close()
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  const exitCode = await runGitHubHelper()
  process.exit(exitCode)
}
