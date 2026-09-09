import { randomUUID } from 'node:crypto'
import type {
  DeploymentEvidence,
  DeploymentRecord,
  DeploymentRecordCreate,
  DeploymentRecordList,
} from '@codexsun/orship-contracts'
import { DeploymentRecordStore } from '../infrastructure/deployment-record.store.js'
import { LocalDeploymentInspector } from '../infrastructure/local-deployment.inspector.js'
import type { OrchestrationTargetCatalog } from '../domain/orchestration.ports.js'

export class DeploymentEvidenceService {
  constructor(
    private readonly targets: OrchestrationTargetCatalog,
    private readonly inspector: LocalDeploymentInspector,
    private readonly records: DeploymentRecordStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getEvidence(): Promise<DeploymentEvidence> {
    return this.inspector.inspect(await this.platformServiceIds())
  }

  async listRecords(): Promise<DeploymentRecordList> {
    const records = await this.records.list()
    return {
      records: [...records].sort((left, right) => right.startedAt.localeCompare(left.startedAt)),
    }
  }

  async createRecord(input: DeploymentRecordCreate): Promise<DeploymentRecord> {
    const evidence = await this.getEvidence()
    const command = evidence.commands.find((candidate) => candidate.action === input.action)
    if (!command) throw new Error(`Unsupported deployment action: ${input.action}`)
    const timestamp = this.now().toISOString()
    const status = normalizeStatus(input.status, input.exitCode)
    const record: DeploymentRecord = {
      action: input.action,
      applicationId: 'platform',
      artifactFiles: [...command.requiredFiles, ...command.expectedFiles],
      command: command.command,
      completedAt: status === 'awaiting-verification' ? null : timestamp,
      exitCode: input.exitCode,
      id: randomUUID(),
      output: redactOutput(input.output),
      profile: evidence.profile,
      repository: evidence.repository,
      serviceIds: evidence.serviceIds,
      startedAt: timestamp,
      status,
      targetId: evidence.targetId,
    }
    await this.records.append(record)
    return record
  }

  private async platformServiceIds(): Promise<string[]> {
    const targets = await this.targets.list()
    return targets.filter(({ applicationId }) => applicationId === 'platform').map(({ id }) => id)
  }
}

function normalizeStatus(
  status: DeploymentRecordCreate['status'],
  exitCode: number | null,
): DeploymentRecord['status'] {
  if (
    status === 'prepared' ||
    status === 'command-copied' ||
    status === 'awaiting-verification' ||
    status === 'failed'
  ) {
    return status
  }
  return exitCode === 0 && status === 'verified' ? 'verified' : 'failed'
}

function redactOutput(output: string): string {
  return output
    .replace(
      /(authorization|token|password|secret|api[_-]?key)\s*[=:]\s*[^\s]+/giu,
      '$1=[REDACTED]',
    )
    .replace(/(mysql|postgres(?:ql)?):\/\/[^\s]+/giu, '$1://[REDACTED]')
    .replace(/-----BEGIN[\s\S]*?PRIVATE KEY-----/gu, '[REDACTED PRIVATE KEY]')
}
