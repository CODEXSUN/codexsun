export interface CommandStep {
  argv: string[];
  directory: string;
  timeoutSeconds: number;
}

export interface CommandRequest {
  requestId: string;
  title: string;
  steps: CommandStep[];
  previewCommand?: string;
}

export interface WorkspaceSetupRequest {
  repository?: {name: string; repository: string; gitConnectionId?: string; defaultBranch: string};
  environment?: Record<string, string>;
  preset?: 'zuno';
  requestId: string;
  title: string;
  directory: string;
  databaseDriver?: 'sqlite' | 'mariadb' | 'none';
  sqlitePath?: string;
  approved: boolean;
  install: CommandStep;
  migrationStatus?: CommandStep;
  migrate?: CommandStep;
  migrationVerify?: CommandStep;
  previewCommand: string;
}

export interface CommandTask {
  id: string;
  status: string;
  report: string;
  revision: number;
  previewUrl?: string;
  tools: CommandRequest & {
    results?: { output: string; exitCode: number; truncated: boolean }[];
  };
}

/** Use on Zuno's server. Do not expose the worker key to browser clients. */
export class CXForgeCommands {
  private readonly origin: string;
  private readonly key: string;

  constructor(origin: string, key: string) {
    this.origin = origin;
    this.key = key;
  }

  submit(input: CommandRequest): Promise<CommandTask> {
    return this.request('/commands', input);
  }

  setup(input: WorkspaceSetupRequest): Promise<CommandTask> {
    return this.request('/workspace/setup', input);
  }

  async configureEnvironment(directory: string, values: Record<string, string>, overwrite = false): Promise<void> {
    const response = await fetch(`${this.origin}/api/v1/cxforge/control/workspace/environment`, {
      method: 'PUT', headers: {'X-CXForge-Client-Key': this.key, 'Content-Type': 'application/json'},
      body: JSON.stringify({directory, values, overwrite}), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error((await response.json()).error ?? 'Environment update failed');
  }

  get(id: string): Promise<CommandTask> {
    return this.request(`/commands/${encodeURIComponent(id)}`);
  }

  cancel(id: string): Promise<CommandTask> {
    return this.request(`/tasks/${encodeURIComponent(id)}/cancel`, {});
  }

  private async request(path: string, body?: unknown): Promise<CommandTask> {
    const response = await fetch(`${this.origin}/api/v1/cxforge/control${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'X-CXForge-Client-Key': this.key, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? `CXForge HTTP ${response.status}`);
    if (typeof result.id !== 'string' || typeof result.status !== 'string') {
      throw new Error('Invalid CXForge response');
    }
    return result as CommandTask;
  }
}
