export interface AutomationScriptGroup {
  label: string
  scripts: string[]
}

const groups = [
  { label: 'Build', pattern: /^build(?::|$)/u },
  { label: 'Verify', pattern: /^(check|lint|typecheck)(:|$)/u },
  { label: 'Test', pattern: /^test(?::|$)/u },
  { label: 'Maintenance', pattern: /^clean(?::|$)/u },
  { label: 'Release', pattern: /^release(?::|$)/u },
] as const

export function groupAutomationScripts(scripts: string[]): AutomationScriptGroup[] {
  return groups
    .map(({ label, pattern }) => ({
      label,
      scripts: scripts.filter((script) => pattern.test(script)),
    }))
    .filter(({ scripts: matches }) => matches.length > 0)
}
