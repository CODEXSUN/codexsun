import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises'
import { createServer, createConnection } from 'node:net'
import { join } from 'node:path'
import { z } from 'zod'

export const sandboxStatusSchema = z.strictObject({
  state: z.enum([
    'unverified',
    'setting-up',
    'setup-ready',
    'verifying',
    'verified',
    'blocked',
    'unsupported',
  ]),
  message: z.string(),
  allowLocalNetwork: z.boolean(),
  checkedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  checks: z.array(z.strictObject({ name: z.string(), passed: z.boolean() })),
})
export type SandboxStatus = z.infer<typeof sandboxStatusSchema>
export type SandboxRequest = (method: string, params: unknown, timeout?: number) => Promise<unknown>
export type SandboxAgentProbe = (cwd: string, roots: string[], encoded: string) => Promise<string>

export function workspaceSandboxPolicy(writableRoots: readonly string[]) {
  return {
    type: 'workspaceWrite',
    writableRoots,
    networkAccess: false,
    excludeTmpdirEnvVar: true,
    excludeSlashTmp: true,
  }
}

/** Setup is not proof. Only both execution paths can grant a short-lived readiness result. */
export class CodexSandbox {
  private status: SandboxStatus = {
    state: 'unverified',
    allowLocalNetwork: false,
    message: 'Run sandbox setup and verification before project execution.',
    checkedAt: null,
    expiresAt: null,
    checks: [],
  }
  private setupTimer?: NodeJS.Timeout
  private generation = 0

  public constructor(
    private readonly request: SandboxRequest,
    private readonly agentProbe: SandboxAgentProbe,
    private readonly fixtureRoot: string,
    private readonly platform = process.platform,
  ) {}

  public read(): SandboxStatus {
    if (this.status.expiresAt && Date.parse(this.status.expiresAt) <= Date.now()) this.invalidate()
    return structuredClone(this.status)
  }

  public assertReady(): void {
    if (this.read().state !== 'verified')
      throw new Error(
        'Project execution is blocked. Open Settings > Codex connection and verify the sandbox.',
      )
  }

  public invalidate(): void {
    this.generation++
    clearTimeout(this.setupTimer)
    this.status = {
      state: 'unverified',
      allowLocalNetwork: false,
      message: 'Sandbox evidence expired or the provider restarted. Verify again.',
      checkedAt: null,
      expiresAt: null,
      checks: [],
    }
  }

  public async setup(): Promise<SandboxStatus> {
    this.requireIdle()
    this.invalidate()
    const generation = this.generation
    if (this.platform !== 'win32') {
      this.status = {
        ...this.status,
        state: 'unsupported',
        message: 'This setup verifies native Windows only. No unverified fallback is enabled.',
      }
      return this.read()
    }
    this.status = {
      ...this.status,
      state: 'setting-up',
      message: 'Approve the official Windows sandbox setup if Windows requests permission.',
    }
    this.setupTimer = setTimeout(
      () => this.block('Windows setup timed out. Check the Windows approval prompt and retry.'),
      120_000,
    )
    this.setupTimer.unref()
    try {
      z.object({ started: z.literal(true) }).parse(
        await this.request('windowsSandbox/setupStart', { mode: 'elevated' }),
      )
    } catch {
      if (generation === this.generation)
        this.block(
          'Windows sandbox setup could not start. Check provider compatibility and Windows policy.',
        )
    }
    return this.read()
  }

  public notification(method: string, params: unknown): void {
    if (method !== 'windowsSandbox/setupCompleted' || this.status.state !== 'setting-up') return
    const event = z.object({ mode: z.literal('elevated'), success: z.boolean() }).safeParse(params)
    if (!event.success) return
    clearTimeout(this.setupTimer)
    if (!event.data.success)
      return this.block(
        'Windows denied sandbox setup. Review UAC, sandbox-user logon rights, and firewall policy.',
      )
    this.status = {
      ...this.status,
      state: 'setup-ready',
      message: 'Setup completed. Verify actual file and network enforcement next.',
    }
  }

  public verify(allowLocalNetwork = false): SandboxStatus {
    this.requireIdle()
    if (this.platform !== 'win32')
      throw new Error(
        'Native Windows verification is required. This platform has no verified adapter.',
      )
    const generation = ++this.generation
    this.status = {
      state: 'verifying',
      allowLocalNetwork,
      message: allowLocalNetwork
        ? 'Localhost is permitted. Testing file boundaries and public-network blocking on both execution paths.'
        : 'Testing disposable files and a local network canary through both execution paths.',
      checkedAt: null,
      expiresAt: null,
      checks: [],
    }
    void this.runVerification(generation, allowLocalNetwork).catch((error: unknown) => {
      if (generation === this.generation)
        this.block(
          error instanceof Error && /CreateProcessWithLogonW failed: 267\b/.test(error.message)
            ? 'Sandbox command could not start: Windows error 267 (invalid working directory). Check the resolved sandbox storage path. Project execution remains blocked.'
            : 'Verification could not complete. Project execution remains blocked. Inspect provider setup and retry.',
        )
    })
    return this.read()
  }

  private async runVerification(generation: number, allowLocalNetwork: boolean): Promise<void> {
    await mkdir(this.fixtureRoot, { recursive: true })
    // Resolve Windows package redirection before crossing into the sandbox user process.
    const fixture = await realpath(await mkdtemp(join(this.fixtureRoot, 'probe-')))
    const allowed = join(fixture, 'allowed')
    const docs = join(fixture, 'docs')
    const denied = join(fixture, 'sibling')
    await Promise.all([allowed, docs, denied].map((path) => mkdir(path)))
    const sentinel = join(denied, 'sentinel.txt')
    const nonce = randomUUID()
    await writeFile(sentinel, nonce)
    let connections = 0
    const server = createServer((socket) => {
      connections++
      socket.destroy()
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    try {
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Canary address unavailable')
      const networkHost = allowLocalNetwork ? '1.1.1.1' : '127.0.0.1'
      const networkPort = allowLocalNetwork ? 443 : address.port
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection(networkPort, networkHost)
        socket.once('connect', () => {
          socket.destroy()
          resolve()
        })
        socket.once('error', reject)
        socket.setTimeout(3000, () => {
          socket.destroy()
          reject(new Error('Canary baseline timed out'))
        })
      })
      for (const path of ['command', 'agent'] as const) {
        if (generation !== this.generation) return
        const before = connections
        const code = sandboxProbeCode(
          allowed,
          docs,
          sentinel,
          nonce,
          networkPort,
          path,
          networkHost,
        )
        const encoded = Buffer.from(code).toString('base64')
        const output =
          path === 'command'
            ? z.object({ exitCode: z.literal(0), stdout: z.string() }).parse(
                await this.request(
                  'command/exec',
                  {
                    command: [
                      process.execPath,
                      '-e',
                      `eval(Buffer.from('${encoded}','base64').toString())`,
                    ],
                    cwd: allowed,
                    sandboxPolicy: workspaceSandboxPolicy([allowed, docs]),
                    timeoutMs: 20_000,
                  },
                  90_000,
                ),
              ).stdout
            : await this.agentProbe(allowed, [allowed, docs], encoded)
        const evidence = z
          .object({
            nonce: z.literal(nonce),
            allowed: z.boolean(),
            docs: z.boolean(),
            denied: z.boolean(),
            networkDenied: z.boolean(),
          })
          .safeParse(parseProbeOutput(output))
        const checks = [
          {
            name: `${path}: approved folder writes`,
            passed:
              evidence.data?.allowed === true &&
              (await readFile(join(allowed, `${path}.txt`), 'utf8').catch(() => '')) === nonce,
          },
          {
            name: `${path}: approved documentation writes`,
            passed:
              evidence.data?.docs === true &&
              (await readFile(join(docs, `${path}.txt`), 'utf8').catch(() => '')) === nonce,
          },
          {
            name: `${path}: sibling write denied`,
            passed:
              evidence.data?.denied === true &&
              (await readFile(sentinel, 'utf8').catch(() => '')) === nonce,
          },
          {
            name: `${path}: ${allowLocalNetwork ? 'public-network' : 'network'} denied`,
            passed: evidence.data?.networkDenied === true && connections === before,
          },
        ]
        if (generation !== this.generation) return
        this.status.checks.push(...checks)
        if (checks.some((check) => !check.passed))
          return this.block(
            `${path} enforcement failed. No project execution is permitted. Disposable evidence was retained.`,
          )
      }
      if (generation === this.generation)
        this.status = {
          ...this.status,
          state: 'verified',
          message: `Both sampled execution paths passed. ${allowLocalNetwork ? 'Localhost is permitted; public-network blocking was sampled. ' : ''}Project turns may run within confirmed scope.`,
          checkedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }

  private requireIdle(): void {
    if (['setting-up', 'verifying'].includes(this.status.state))
      throw new Error('Sandbox setup or verification is already running.')
  }

  private block(message: string): void {
    clearTimeout(this.setupTimer)
    this.status = {
      ...this.status,
      state: 'blocked',
      message,
      checkedAt: new Date().toISOString(),
      expiresAt: null,
    }
  }
}

function parseProbeOutput(output: string): unknown {
  if (output.length > 4096) return null
  try {
    return JSON.parse(output.trim())
  } catch {
    return null
  }
}

export function sandboxProbeCode(
  allowed: string,
  docs: string,
  sentinel: string,
  nonce: string,
  port: number,
  phase: string,
  networkHost = '127.0.0.1',
): string {
  return `const fs=require('node:fs'),net=require('node:net');const result={nonce:${JSON.stringify(nonce)}};for(const [key,path] of ${JSON.stringify(
    [
      ['allowed', join(allowed, `${phase}.txt`)],
      ['docs', join(docs, `${phase}.txt`)],
    ],
  )}){try{fs.writeFileSync(path,result.nonce);result[key]=true}catch{result[key]=false}}try{fs.writeFileSync(${JSON.stringify(sentinel)},'unexpected-write');result.denied=false}catch(e){result.denied=['EACCES','EPERM'].includes(e.code)}const socket=net.createConnection({host:${JSON.stringify(networkHost)},port:${port}});let finished=false;const finish=(denied)=>{if(finished)return;finished=true;socket.destroy();result.networkDenied=denied;console.log(JSON.stringify(result))};socket.setTimeout(3000,()=>finish(true));socket.once('connect',()=>finish(false));socket.once('error',e=>finish(['EACCES','EPERM'].includes(e.code)));`
}
