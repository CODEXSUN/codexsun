import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { Database } from '../../../database.js'
import type { IdentityRepository } from '../domain/identity.ports.js'
import type {
  IdentityCredential,
  IdentitySession,
  StoredIdentityUser,
} from '../domain/identity.types.js'

export class MariaDbIdentityRepository implements IdentityRepository {
  constructor(private readonly database: Database) {}

  async createSession(session: IdentitySession): Promise<void> {
    await this.database
      .insertInto('identity_sessions')
      .values({
        created_at: session.createdAt,
        expires_at: session.expiresAt,
        id: session.id,
        portal: session.portal,
        revoked_at: null,
        token_hash: session.tokenHash,
        user_id: session.userId,
      })
      .execute()
  }

  async createUser(user: StoredIdentityUser, credential: IdentityCredential): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      const now = new Date()
      await transaction
        .insertInto('identity_users')
        .values({
          created_at: now,
          display_name: user.displayName,
          email: user.email,
          id: user.id,
          portal: user.portal,
          status: user.status,
          updated_at: now,
        })
        .execute()
      await transaction
        .insertInto('identity_credentials')
        .values({ password_hash: credential.passwordHash, updated_at: now, user_id: user.id })
        .execute()
    })
  }

  async findCredential(userId: string): Promise<IdentityCredential | undefined> {
    const row = await this.database
      .selectFrom('identity_credentials')
      .select(['password_hash', 'user_id'])
      .where('user_id', '=', userId)
      .executeTakeFirst()
    return row ? { passwordHash: row.password_hash, userId: row.user_id } : undefined
  }

  async findSession(
    tokenHash: string,
    portal: IdentityPortal,
  ): Promise<IdentitySession | undefined> {
    const row = await this.database
      .selectFrom('identity_sessions')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('portal', '=', portal)
      .where('revoked_at', 'is', null)
      .executeTakeFirst()
    return row
      ? {
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          id: row.id,
          portal: row.portal as IdentityPortal,
          tokenHash: row.token_hash,
          userId: row.user_id,
        }
      : undefined
  }

  findUserByEmail(email: string): Promise<StoredIdentityUser | undefined> {
    return this.findUser('email', email)
  }

  findUserById(id: string): Promise<StoredIdentityUser | undefined> {
    return this.findUser('id', id)
  }

  async listPermissions(userId: string): Promise<readonly string[]> {
    const rows = await this.database
      .selectFrom('identity_user_roles as users')
      .innerJoin('identity_role_permissions as roles', 'roles.role_id', 'users.role_id')
      .innerJoin('identity_permissions as permissions', 'permissions.id', 'roles.permission_id')
      .select('permissions.name')
      .where('users.user_id', '=', userId)
      .execute()
    return rows.map(({ name }) => name)
  }

  async revokeSession(tokenHash: string, portal: IdentityPortal): Promise<void> {
    await this.database
      .updateTable('identity_sessions')
      .set({ revoked_at: new Date() })
      .where('token_hash', '=', tokenHash)
      .where('portal', '=', portal)
      .execute()
  }

  async updateSessionExpiry(id: string, expiresAt: Date): Promise<void> {
    await this.database
      .updateTable('identity_sessions')
      .set({ expires_at: expiresAt })
      .where('id', '=', id)
      .where('revoked_at', 'is', null)
      .execute()
  }

  private async findUser(field: 'email' | 'id', value: string) {
    const row = await this.database
      .selectFrom('identity_users')
      .select(['display_name', 'email', 'id', 'portal', 'status'])
      .where(field, '=', value)
      .executeTakeFirst()
    return row
      ? {
          displayName: row.display_name,
          email: row.email,
          id: row.id,
          portal: row.portal as IdentityPortal,
          status: row.status as 'active' | 'disabled',
        }
      : undefined
  }
}
