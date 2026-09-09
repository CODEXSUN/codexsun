import { hash, verify } from '@node-rs/argon2'
import type { IdentityPasswordHasher } from '../domain/identity.ports.js'

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
}
