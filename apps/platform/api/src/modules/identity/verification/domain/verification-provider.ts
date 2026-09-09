export interface IdentityVerificationProvider {
  readonly enabled: boolean
  sendEmailCode(address: string, code: string): Promise<void>
  sendMobileCode(number: string, code: string): Promise<void>
}

export class DisabledIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly enabled = false

  async sendEmailCode(): Promise<void> {}
  async sendMobileCode(): Promise<void> {}
}
