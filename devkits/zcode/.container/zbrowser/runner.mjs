import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const MAX_RUNNING = 3;

export class PreviewRunner {
  constructor(root, catalog) {
    this.root = root;
    this.catalog = catalog;
    this.processes = new Map();
    this.failures = new Map();
  }

  start(id) {
    const target = this.catalog.find((item) => item.id === id);
    if (!target) throw new PreviewError(404, 'Unknown registered application.');
    if (!target.workspace) throw new PreviewError(409, 'This devkit has no web preview.');
    if (this.processes.has(id)) return;
    if (this.processes.size >= MAX_RUNNING) {
      throw new PreviewError(409, `At most ${MAX_RUNNING} previews can run at once.`);
    }

    const vite = join(this.root, 'node_modules', 'vite', 'bin', 'vite.js');
    if (!existsSync(vite)) throw new PreviewError(503, 'Workspace dependencies are not installed.');
    this.failures.delete(id);
    const child = spawn(process.execPath, [vite, '--host', '0.0.0.0', '--port', String(target.port)], {
      cwd: target.directory,
      env: previewEnvironment(this.catalog, target),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.processes.set(id, child);
    child.stdout.on('data', (chunk) => process.stdout.write(`[${id}] ${chunk}`));
    child.stderr.on('data', (chunk) => process.stderr.write(`[${id}] ${chunk}`));
    child.once('error', (error) => this.recordExit(id, child, error.message));
    child.once('exit', (code, signal) => this.recordExit(id, child, `Exited (${signal ?? code ?? 'unknown'}).`));
  }

  stop(id) {
    const target = this.catalog.find((item) => item.id === id);
    if (!target) throw new PreviewError(404, 'Unknown registered application.');
    const child = this.processes.get(id);
    if (!child) return;
    this.processes.delete(id);
    this.failures.delete(id);
    child.kill('SIGTERM');
  }

  async statuses() {
    return Promise.all(this.catalog.map(async (target) => {
      const child = this.processes.get(target.id);
      let state = target.workspace ? 'stopped' : 'unavailable';
      if (child) state = await isReady(target.port) ? 'ready' : 'starting';
      else if (this.failures.has(target.id)) state = 'error';
      return {
        id: target.id,
        label: target.label,
        group: target.group,
        hasApi: target.hasApi,
        port: target.publicPort ?? target.port,
        state,
        error: this.failures.get(target.id) ?? null,
      };
    }));
  }

  shutdown() {
    for (const child of this.processes.values()) child.kill('SIGTERM');
    this.processes.clear();
  }

  recordExit(id, child, reason) {
    if (this.processes.get(id) !== child) return;
    this.processes.delete(id);
    this.failures.set(id, reason);
  }
}

export class PreviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function previewEnvironment(catalog, target) {
  const env = {
    ...process.env,
    PLATFORM_HOST: '0.0.0.0',
    WEB_HOST: '0.0.0.0',
    WEB_PORT: String(target.port),
    PLATFORM_WEB_PORT: '6101',
    VITE_PLATFORM_WEB_URL: '6101',
    VITE_CXFORGE_WEB_URL: '6401',
    VITE_ZETRO_API_URL: 'http://127.0.0.1:6130',
  };
  env[`${target.id.toUpperCase().replaceAll('-', '_')}_WEB_PORT`] = String(target.port);
  for (const item of catalog) {
    if (item.localUrlKey && item.port) env[item.localUrlKey] = String(item.port);
  }
  return env;
}

async function isReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}
