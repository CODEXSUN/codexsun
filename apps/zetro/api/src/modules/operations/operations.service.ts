import { statfs } from 'node:fs/promises'
import { cpus, freemem, loadavg, totalmem } from 'node:os'
import type { CodexConnectionService, CodexWorktreeService } from '../codex-connection/index.js'
import type { SystemTaskService } from '../system-tasks/index.js'
import type { OperationsRepository } from './operations.repository.js'
import type { ConnectedAppMetric, OperationsSettings } from './operations.types.js'

export class OperationsService {
  public constructor(
    private readonly repository: OperationsRepository,
    private readonly systemTasks: SystemTaskService,
    private readonly codex: CodexConnectionService,
    private readonly worktrees: CodexWorktreeService,
    private readonly storageRoot: string,
    private readonly databaseDriver: 'mariadb' | 'sqlite',
  ) {}

  public async initialize(): Promise<void> {
    await this.repository.initialize()
    const settings = this.repository.getSettings()
    await this.repository.pruneMetrics(settings.metricRetentionDays)
    if (settings.autoSweepWorktrees) await this.worktrees.sweep(settings.worktreeRetentionDays)
  }

  public getSettings(): OperationsSettings {
    return this.repository.getSettings()
  }

  public async setSettings(settings: OperationsSettings): Promise<OperationsSettings> {
    await this.repository.setSettings(settings)
    return this.getSettings()
  }

  public async receiveMetric(
    metric: Omit<ConnectedAppMetric, 'receivedAt'>,
  ): Promise<ConnectedAppMetric> {
    const stored = { ...metric, receivedAt: new Date().toISOString() }
    await this.repository.addMetric(stored)
    await this.repository.pruneMetrics(this.repository.getSettings().metricRetentionDays)
    return stored
  }

  public async metrics() {
    const [disk, tasks, worktrees, codex, connectedApps] = await Promise.all([
      statfs(this.storageRoot),
      this.systemTasks.list(),
      this.worktrees.list(),
      this.codex.getStatus(),
      this.repository.latestMetrics(),
    ])
    const taskCounts = Object.fromEntries(
      ['blocked', 'completed', 'failed', 'pending', 'running', 'stopped'].map((status) => [
        status,
        tasks.filter((task) => task.status === status).length,
      ]),
    )
    return {
      api: {
        heapBytes: process.memoryUsage().heapUsed,
        residentBytes: process.memoryUsage().rss,
        uptimeSeconds: Math.round(process.uptime()),
      },
      codex: codex.state,
      connectedApps,
      database: this.databaseDriver,
      disk: {
        freeBytes: disk.bavail * disk.bsize,
        totalBytes: disk.blocks * disk.bsize,
      },
      generatedAt: new Date().toISOString(),
      host: {
        cpuCount: cpus().length,
        freeMemoryBytes: freemem(),
        loadAverage: loadavg(),
        totalMemoryBytes: totalmem(),
      },
      systemTasks: taskCounts,
      worktrees: {
        count: worktrees.length,
        dirty: worktrees.filter(({ dirty }) => dirty).length,
        sizeBytes: worktrees.reduce((total, worktree) => total + worktree.sizeBytes, 0),
      },
    }
  }

  public async diagnostics() {
    const [metrics, tasks, worktrees] = await Promise.all([
      this.metrics(),
      this.systemTasks.list(),
      this.worktrees.list(),
    ])
    return {
      generatedAt: new Date().toISOString(),
      metrics,
      recentSystemTasks: tasks
        .slice(0, 50)
        .map(({ input: _input, result: _result, ...task }) => task),
      settings: this.repository.getSettings(),
      worktrees,
    }
  }
}
