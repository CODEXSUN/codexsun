import type { TaskExecutionPlan } from '../project-tasks'
import type { ChatWorkspaceScope } from './agent-chat.types'

export function taskInputFromPlan(
  content: string,
  scope: ChatWorkspaceScope | undefined,
  sourceConversationId: string | null,
) {
  const title = findLabeledValue(content, 'Title') ?? firstContentLine(content) ?? 'Chat follow-up'
  const description = findLabeledSection(content, 'Task') ?? content
  const plan = scope && sourceConversationId ? parsePlan(content, scope, sourceConversationId) : null
  return {
    description: description.trim().slice(0, 2_000),
    ...(plan ? { plan } : {}),
    priority: 'medium' as const,
    title: cleanMarkdown(title).slice(0, 160),
  }
}

function parsePlan(
  content: string,
  scope: ChatWorkspaceScope,
  sourceConversationId: string,
): TaskExecutionPlan | null {
  const parsed = collectPlanBullets(content)
  if (parsed.acceptanceCriteria.length && parsed.checks.length) {
    return {
      acceptanceCriteria: parsed.acceptanceCriteria,
      checks: parsed.checks,
      scope: {
        application: scope.application,
        ...(scope.documentationPaths?.length ? { documentationPaths: scope.documentationPaths } : {}),
        folderPath: scope.folderPath,
        module: scope.module,
      },
      sourceConversationId,
    }
  }
  const acceptanceCriteria = findBullets(content, 'Acceptance criteria')
  const checks = findBullets(content, 'Checks')
  if (!acceptanceCriteria.length || !checks.length) return null
  return {
    acceptanceCriteria,
    checks,
    scope: {
      application: scope.application,
      ...(scope.documentationPaths?.length ? { documentationPaths: scope.documentationPaths } : {}),
      folderPath: scope.folderPath,
      module: scope.module,
    },
    sourceConversationId,
  }
}

function collectPlanBullets(content: string) {
  const result = { acceptanceCriteria: [] as string[], checks: [] as string[] }
  let section: keyof typeof result | null = null
  for (const sourceLine of content.split('\n')) {
    const line = cleanMarkdown(sourceLine).trim()
    const heading = line.endsWith(':') ? line.slice(0, -1).toLowerCase() : ''
    if (heading === 'acceptance criteria') {
      section = 'acceptanceCriteria'
      continue
    }
    if (heading === 'checks') {
      section = 'checks'
      continue
    }
    if (heading) {
      section = null
      continue
    }
    if (section && line.startsWith('- ')) result[section].push(line.slice(2).trim().slice(0, 500))
  }
  return {
    acceptanceCriteria: result.acceptanceCriteria.slice(0, 20),
    checks: result.checks.slice(0, 20),
  }
}

function findLabeledValue(content: string, label: string): string | null {
  const match = content.match(new RegExp(`^\\s*(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*(.+)$`, 'im'))
  return match?.[1]?.trim() || null
}

function findLabeledSection(content: string, label: string): string | null {
  const match = content.match(
    new RegExp(`^\\s*(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*([\\s\\S]+)$`, 'im'),
  )
  return match?.[1]?.trim() || null
}

function findBullets(content: string, heading: string): string[] {
  const lines = content.split('\n')
  const start = lines.findIndex((line) =>
    new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?${heading}:?(?:\\*\\*)?\\s*$`, 'i').test(line),
  )
  if (start < 0) return []
  const items: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?[A-Z][A-Za-z ]+:?(?:\\*\\*)?\\s*$/.test(line)) break
    const item = line.match(/^\\s*[-*]\\s+(.+)$/)?.[1]
    if (item) items.push(cleanMarkdown(item).slice(0, 500))
  }
  return items.slice(0, 20)
}

function firstContentLine(content: string): string | null {
  return content
    .split('\n')
    .map((line) => cleanMarkdown(line).trim())
    .find(Boolean) ?? null
}

function cleanMarkdown(value: string): string {
  return value.replace(/[*_`#]/g, '').trim()
}
