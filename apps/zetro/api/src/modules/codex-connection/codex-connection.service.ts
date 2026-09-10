import type { ZetroEnvironment } from '../../config.js'
import type { CodexAppServerClient } from './codex-app-server.client.js'
import type { CodexConnectionStatus, CodexDeviceCode } from './codex-connection.types.js'

export class CodexConnectionService {
  public getSandboxStatus() {
    return this.client.sandbox.read()
  }
  public setupSandbox() {
    return this.client.setupSandbox()
  }
  public verifySandbox(allowLocalNetwork = false) {
    return this.client.verifySandbox(allowLocalNetwork)
  }
  public constructor(
    private readonly client: CodexAppServerClient,
    private readonly environment: ZetroEnvironment,
  ) {}

  public async getStatus(): Promise<CodexConnectionStatus> {
    if (this.environment.ZETRO_CODEX_API_KEY) {
      return { mode: 'api_key', state: 'connected' }
    }

    try {
      return await this.client.readAccount(false)
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Codex App Server is unavailable.',
        mode: 'none',
        state: 'error',
      }
    }
  }

  public startDeviceLogin(): Promise<CodexDeviceCode> {
    return this.client.startDeviceLogin()
  }

  public confirmDeviceLogin(loginId: string, userCode: string): Promise<CodexConnectionStatus> {
    return this.client.confirmLogin(loginId, userCode)
  }

  public disconnect(): Promise<CodexConnectionStatus> {
    if (this.environment.ZETRO_CODEX_API_KEY) {
      return Promise.resolve({
        message: 'Remove ZETRO_CODEX_API_KEY from the root .env file to disconnect this mode.',
        mode: 'api_key',
        state: 'connected',
      })
    }

    return this.client.logout()
  }
}
