export type CodexConnectionMode = 'api_key' | 'chatgpt' | 'none'
export type CodexConnectionState = 'connected' | 'disconnected' | 'error' | 'pending'

export interface CodexConnection {
  email?: string
  message?: string
  mode: CodexConnectionMode
  planType?: string
  state: CodexConnectionState
}

export interface CodexDeviceCode {
  loginId: string
  userCode: string
  verificationUrl: string
}
