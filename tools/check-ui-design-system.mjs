import { auditSharedUi, formatSharedUiAudit } from './shared-ui-audit.mjs'

try {
  const report = await auditSharedUi({ app: option('--app') })
  const output =
    option('--format') === 'json' ? JSON.stringify(report, null, 2) : formatSharedUiAudit(report)
  console.log(output)
  if (!report.passed) process.exitCode = 1
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Shared UI audit failed.')
  process.exitCode = 1
}

function option(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
