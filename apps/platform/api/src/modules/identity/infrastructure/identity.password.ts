import { hash, verify } from '@node-rs/argon2'
import type { IdentityPasswordHasher } from '../domain/identity.ports.js'

const unknownCredentialHash =
  '$argon2id$v=19$m=19456,t=2,p=1$f3lf22EVcZtraQxWJ4NncQ$okrjdhDcl7HErUqMNUmPSw3igQUTymj3n+DnLeRX3Q4'

export class ArgonIdentityPasswordHasher implements IdentityPasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 19_456,
      outputLen: 32,
      parallelism: 1,
      timeCost: 2,
    })
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password)
  }

  async verifyUnknown(password: string): Promise<void> {
    await verify(unknownCredentialHash, password)
  }
}
