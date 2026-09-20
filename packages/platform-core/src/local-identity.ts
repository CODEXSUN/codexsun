import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { actorSchema, identitySessionSchema, type Actor, type IdentitySession } from "./identity-contracts.js";
import { createPlatformJwtToken, type PlatformJwtConfiguration } from "./platform-jwt.js";
import {
  hashIdentityPassword,
  readPlatformJwtClaims,
  type IdentityLoginResponse,
  verifyIdentityPassword,
} from "./identity-security.js";

const identityMigrationDefinitions = [
  { id: "identity.001", definition: "identity users, roles, permissions, and sessions" },
  { id: "identity.002", definition: "identity username and state compatibility" },
  { id: "identity.003", definition: "identity password reset, login limit, and audit records" },
  { id: "identity.004", definition: "identity browser session isolation" },
  { id: "identity.005", definition: "identity migration recorder checksums and serial positions" },
] as const;

export type IdentitySeed = {
  readonly login: string;
  readonly name: string;
  readonly password: string;
  readonly role: IdentityPortal;
  readonly username: string;
};

export type IdentityPortal = "admin" | "super-admin" | "user";

export type LocalIdentityConfiguration = PlatformJwtConfiguration & {
  readonly applicationId: string;
  readonly appMode: "development" | "production";
  readonly autoLogin: boolean;
  readonly autoLoginDesk: IdentityPortal;
  readonly databasePath: string;
  readonly exposeDevelopmentResetToken: boolean;
  readonly loginLockoutSeconds: number;
  readonly loginMaxFailures: number;
  readonly loginWindowSeconds: number;
  readonly passwordResetTokenTtlSeconds: number;
  readonly refreshSeeds: boolean;
  readonly seeds: readonly IdentitySeed[];
};

export type LocalIdentityLogin = IdentityLoginResponse;

export type PasswordResetRequest = {
  readonly expiresAt: string;
  readonly token: string;
};

export type IdentityUserState = "active" | "disabled";

export type ManagedIdentityUser = {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly protected: boolean;
  readonly roles: readonly string[];
  readonly state: IdentityUserState;
  readonly username: string;
};

export type IdentityUserUpsert = {
  readonly login: string;
  readonly name: string;
  readonly password?: string;
  readonly state: IdentityUserState;
  readonly username: string;
};

export type IdentityRoleAssignment = {
  readonly roleId: string;
  readonly userId: string;
};

export type IdentityPermissionAssignment = {
  readonly permissionId: string;
  readonly roleId: string;
};

export class IdentityLoginRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many sign-in attempts.");
  }
}

export class LocalIdentityStore {
  private readonly database: DatabaseSync;

  constructor(private readonly config: LocalIdentityConfiguration) {
    if (config.appMode === "production" && !existsSync(config.databasePath)) {
      throw new Error(`Identity database is missing for ${config.applicationId}. Run migrations before production start.`);
    }
    if (config.appMode === "development") mkdirSync(dirname(config.databasePath), { recursive: true });
    this.database = new DatabaseSync(config.databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }

  async initialize(): Promise<void> {
    if (this.config.appMode === "production") {
      this.assertProductionSchema();
      return;
    }

    this.migrate();
    await this.seedDevelopmentIdentities();
  }

  migrate(): void {
    this.applyDevelopmentMigrations();
  }

  async login(identifier: string, password: string, browserSessionId: string, portal?: IdentityPortal): Promise<LocalIdentityLogin | undefined> {
    const retryAfterSeconds = this.retryAfterLoginLimit(identifier, browserSessionId);
    if (retryAfterSeconds) {
      this.recordAuditEvent("identity.login.rate-limited", "failure");
      throw new IdentityLoginRateLimitError(retryAfterSeconds);
    }
    const user = this.findUserByIdentifier(identifier);
    if (!user || user.state !== "active" || !(await verifyIdentityPassword(password, user.password_hash))) {
      this.recordLoginFailure(identifier, browserSessionId);
      this.recordAuditEvent("identity.login.failed", "failure", user?.id);
      return undefined;
    }
    const actor = this.toActor(user.id);
    if (portal && !this.matchesPortal(actor, portal)) {
      this.recordAuditEvent("identity.login.portal-denied", "failure", user.id, user.id);
      return undefined;
    }

    this.clearLoginFailures(identifier, browserSessionId);
    const session = this.createSession(user.id, browserSessionId);
    const token = createPlatformJwtToken(this.config, {
      applicationId: this.config.applicationId,
      expiresInSeconds: 900,
      sessionId: session.id,
      subject: actor.id,
    });
    const response = {
      actor: { ...actor, permissions: [...actor.permissions], roles: [...actor.roles] },
      session: { expiresAt: session.expiresAt, id: session.id },
      token,
    };
    this.recordAuditEvent("identity.login.succeeded", "success", user.id, user.id);
    return response;
  }

  authenticate(authorization: string | undefined, browserSessionId: string | readonly string[] | undefined): Actor | undefined {
    const claims = this.readSessionClaims(authorization, browserSessionId);
    if (!claims) return undefined;
    const sessionId = claims.sessionId;
    const browserId = typeof browserSessionId === "string" ? browserSessionId : undefined;
    if (!sessionId || !browserId) return undefined;
    const session = this.database
      .prepare(
        "SELECT id, actor_id, expires_at, issued_at, state FROM identity_sessions WHERE id = ? AND app_id = ? AND browser_session_id = ?",
      )
      .get(sessionId, this.config.applicationId, browserId) as SessionRow | undefined;
    if (!session || session.actor_id !== claims.subject || session.state !== "active" || !this.isUserActive(session.actor_id)) return undefined;
    if (Date.parse(session.expires_at) <= Date.now()) return undefined;
    return this.toActor(session.actor_id);
  }

  logout(authorization: string | undefined, browserSessionId: string | readonly string[] | undefined): boolean {
    const claims = this.readSessionClaims(authorization, browserSessionId);
    if (!claims) return false;
    const sessionId = claims.sessionId;
    const browserId = typeof browserSessionId === "string" ? browserSessionId : undefined;
    if (!sessionId || !browserId) return false;
    const result = this.database
      .prepare(
        "UPDATE identity_sessions SET state = 'revoked', revoked_at = ? WHERE id = ? AND actor_id = ? AND app_id = ? AND browser_session_id = ? AND state = 'active'",
      )
      .run(new Date().toISOString(), sessionId, claims.subject, this.config.applicationId, browserId);
    const didLogout = Number(result.changes) === 1;
    this.recordAuditEvent(didLogout ? "identity.logout.succeeded" : "identity.logout.failed", didLogout ? "success" : "failure", claims.subject, claims.subject);
    return didLogout;
  }

  async requestPasswordReset(identifier: string): Promise<PasswordResetRequest | undefined> {
    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      this.recordAuditEvent("identity.password-reset.requested", "success");
      return undefined;
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.passwordResetTokenTtlSeconds * 1_000).toISOString();
    this.database
      .prepare("UPDATE identity_password_reset_tokens SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL")
      .run(new Date().toISOString(), user.id);
    this.database
      .prepare("INSERT INTO identity_password_reset_tokens (id, user_id, token_hash, requested_at, expires_at, consumed_at) VALUES (?, ?, ?, ?, ?, NULL)")
      .run(randomUUID(), user.id, this.tokenHash(token), new Date().toISOString(), expiresAt);
    this.recordAuditEvent("identity.password-reset.requested", "success", user.id, user.id);
    return { expiresAt, token };
  }

  async resetPassword(token: string, password: string): Promise<boolean> {
    const tokenHash = this.tokenHash(token);
    const reset = this.database
      .prepare("SELECT id, user_id FROM identity_password_reset_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?")
      .get(tokenHash, new Date().toISOString()) as PasswordResetRow | undefined;
    if (!reset) {
      this.recordAuditEvent("identity.password-reset.failed", "failure");
      return false;
    }
    const now = new Date().toISOString();
    const passwordHash = await hashIdentityPassword(password);
    this.database.prepare("UPDATE identity_users SET password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, now, reset.user_id);
    this.database.prepare("UPDATE identity_password_reset_tokens SET consumed_at = ? WHERE id = ?").run(now, reset.id);
    this.database.prepare("UPDATE identity_sessions SET state = 'revoked', revoked_at = ? WHERE actor_id = ? AND state = 'active'").run(now, reset.user_id);
    this.clearLoginFailuresForUser(reset.user_id);
    this.recordAuditEvent("identity.password-reset.completed", "success", reset.user_id, reset.user_id);
    return true;
  }

  async autoLogin(browserSessionId: string, requestedDesk?: string | readonly string[]): Promise<LocalIdentityLogin | undefined> {
    if (this.config.appMode !== "development") return undefined;
    if (requestedDesk !== undefined && (Array.isArray(requestedDesk) || requestedDesk !== this.config.autoLoginDesk)) return undefined;
    const seed = this.config.seeds.find((item) => item.role === this.config.autoLoginDesk);
    return seed ? this.login(seed.login, seed.password, browserSessionId) : undefined;
  }

  close(): void {
    this.database.close();
  }

  listUsers(): readonly ManagedIdentityUser[] {
    const users = this.database
      .prepare("SELECT id, login, name, state, username FROM identity_users ORDER BY lower(name), id")
      .all() as ManagedUserRow[];
    return users.map((user) => ({
      id: user.id,
      login: user.login,
      name: user.name,
      protected: this.isProtectedIdentity(user.id),
      roles: this.roleIdsForUser(user.id),
      state: user.state,
      username: user.username,
    }));
  }

  listRoles(): readonly string[] {
    return (this.database.prepare("SELECT id FROM identity_roles ORDER BY id").all() as { id: string }[]).map((row) => row.id);
  }

  listPermissions(): readonly string[] {
    return (this.database.prepare("SELECT id FROM identity_permissions ORDER BY id").all() as { id: string }[]).map((row) => row.id);
  }

  listUserRoleAssignments(): readonly IdentityRoleAssignment[] {
    return this.database
      .prepare("SELECT role_id, user_id FROM identity_user_roles ORDER BY user_id, role_id")
      .all()
      .map((row) => ({ roleId: (row as { role_id: string }).role_id, userId: (row as { user_id: string }).user_id }));
  }

  listRolePermissionAssignments(): readonly IdentityPermissionAssignment[] {
    return this.database
      .prepare("SELECT permission_id, role_id FROM identity_role_permissions ORDER BY role_id, permission_id")
      .all()
      .map((row) => ({ permissionId: (row as { permission_id: string }).permission_id, roleId: (row as { role_id: string }).role_id }));
  }

  async createManagedUser(input: IdentityUserUpsert): Promise<ManagedIdentityUser> {
    this.assertUniqueUserIdentifiers(input.login, input.username);
    const now = new Date().toISOString();
    const id = randomUUID();
    const passwordHash = await hashIdentityPassword(input.password ?? randomBytes(32).toString("base64url"));
    if (this.tableHasColumn("identity_users", "role")) {
      this.database
        .prepare("INSERT INTO identity_users (id, name, login, username, password_hash, state, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?)")
        .run(id, input.name, input.login, input.username, passwordHash, input.state, now, now);
    } else {
      this.database
        .prepare("INSERT INTO identity_users (id, name, login, username, password_hash, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, input.name, input.login, input.username, passwordHash, input.state, now, now);
    }
    this.recordAuditEvent("identity.user.created", "success", undefined, id);
    return this.managedUser(id);
  }

  async updateUser(id: string, input: IdentityUserUpsert): Promise<ManagedIdentityUser | undefined> {
    const existing = this.userRow(id);
    if (!existing) return undefined;
    this.assertUniqueUserIdentifiers(input.login, input.username, id);
    const now = new Date().toISOString();
    const passwordHash = input.password ? await hashIdentityPassword(input.password) : existing.password_hash;
    this.database
      .prepare("UPDATE identity_users SET name = ?, login = ?, username = ?, password_hash = ?, state = ?, updated_at = ? WHERE id = ?")
      .run(input.name, input.login, input.username, passwordHash, input.state, now, id);
    if (input.state === "disabled") {
      this.database.prepare("UPDATE identity_sessions SET state = 'revoked', revoked_at = ? WHERE actor_id = ? AND state = 'active'").run(now, id);
    }
    this.recordAuditEvent("identity.user.updated", "success", undefined, id);
    return this.managedUser(id);
  }

  forceDeleteManagedUser(id: string): boolean {
    if (!this.userRow(id)) return false;
    if (this.isProtectedIdentity(id)) throw new Error("Default identity users cannot be deleted.");
    this.database.exec("BEGIN");
    try {
      this.database.prepare("DELETE FROM identity_sessions WHERE actor_id = ?").run(id);
      this.database.prepare("DELETE FROM identity_password_reset_tokens WHERE user_id = ?").run(id);
      this.database.prepare("DELETE FROM identity_user_roles WHERE user_id = ?").run(id);
      this.database.prepare("DELETE FROM identity_audit_events WHERE actor_id = ?").run(id);
      this.database.prepare("DELETE FROM identity_users WHERE id = ?").run(id);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    this.recordAuditEvent("identity.user.force-deleted", "success", undefined, id);
    return true;
  }

  createRole(id: string): string {
    this.database.prepare("INSERT INTO identity_roles (id, created_at) VALUES (?, ?)").run(id, new Date().toISOString());
    this.recordAuditEvent("identity.role.created", "success", undefined, id);
    return id;
  }

  createPermission(id: string): string {
    this.database.prepare("INSERT INTO identity_permissions (id, created_at) VALUES (?, ?)").run(id, new Date().toISOString());
    this.recordAuditEvent("identity.permission.created", "success", undefined, id);
    return id;
  }

  replaceUserRoles(userId: string, roleIds: readonly string[]): void {
    if (!this.userRow(userId)) throw new Error("Identity user does not exist.");
    this.assertRolesExist(roleIds);
    this.database.exec("BEGIN");
    try {
      this.database.prepare("DELETE FROM identity_user_roles WHERE user_id = ?").run(userId);
      const insert = this.database.prepare("INSERT INTO identity_user_roles (user_id, role_id) VALUES (?, ?)");
      for (const roleId of new Set(roleIds)) insert.run(userId, roleId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    this.recordAuditEvent("identity.user-roles.updated", "success", undefined, userId);
  }

  replaceRolePermissions(roleId: string, permissionIds: readonly string[]): void {
    if (!this.database.prepare("SELECT 1 FROM identity_roles WHERE id = ?").get(roleId)) throw new Error("Identity role does not exist.");
    this.assertPermissionsExist(permissionIds);
    this.database.exec("BEGIN");
    try {
      this.database.prepare("DELETE FROM identity_role_permissions WHERE role_id = ?").run(roleId);
      const insert = this.database.prepare("INSERT INTO identity_role_permissions (role_id, permission_id) VALUES (?, ?)");
      for (const permissionId of new Set(permissionIds)) insert.run(roleId, permissionId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    this.recordAuditEvent("identity.role-permissions.updated", "success", undefined, roleId);
  }

  private applyDevelopmentMigrations(): void {
    if (this.tableExists("identity_sessions") && !this.tableHasColumn("identity_sessions", "browser_session_id")) {
      this.database.exec("DROP TABLE identity_sessions;");
    }
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS identity_migration_state (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL,
        checksum TEXT NOT NULL DEFAULT '',
        sequence INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS identity_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        login TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'disabled')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS identity_roles (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS identity_permissions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS identity_role_permissions (
        role_id TEXT NOT NULL REFERENCES identity_roles(id),
        permission_id TEXT NOT NULL REFERENCES identity_permissions(id),
        PRIMARY KEY (role_id, permission_id)
      );
      CREATE TABLE IF NOT EXISTS identity_user_roles (
        user_id TEXT NOT NULL REFERENCES identity_users(id),
        role_id TEXT NOT NULL REFERENCES identity_roles(id),
        PRIMARY KEY (user_id, role_id)
      );
      CREATE TABLE IF NOT EXISTS identity_sessions (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL REFERENCES identity_users(id),
        app_id TEXT NOT NULL,
        browser_session_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('active', 'revoked')),
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT
      );
      CREATE INDEX IF NOT EXISTS identity_sessions_active_idx
        ON identity_sessions (id, actor_id, app_id, browser_session_id, state);
      CREATE TABLE IF NOT EXISTS identity_login_limits (
        key TEXT PRIMARY KEY,
        failure_count INTEGER NOT NULL,
        window_started_at TEXT NOT NULL,
        blocked_until TEXT,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS identity_password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES identity_users(id),
        token_hash TEXT NOT NULL UNIQUE,
        requested_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        consumed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS identity_password_reset_tokens_active_idx
        ON identity_password_reset_tokens (user_id, expires_at, consumed_at);
      CREATE TABLE IF NOT EXISTS identity_audit_events (
        id TEXT PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        actor_id TEXT REFERENCES identity_users(id),
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure')),
        correlation_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS identity_audit_events_occurred_idx
        ON identity_audit_events (occurred_at DESC);
    `);
    this.addUsernameToExistingUsers();
    this.addStateToExistingUsers();
    this.ensureMigrationRecorderColumns();
    for (const [sequence, migration] of identityMigrationDefinitions.entries()) this.recordMigration(migration.id, migration.definition, sequence);
  }

  private assertProductionSchema(): void {
    const requiredTables = [
      "identity_migration_state",
      "identity_permissions",
      "identity_audit_events",
      "identity_login_limits",
      "identity_password_reset_tokens",
      "identity_role_permissions",
      "identity_roles",
      "identity_sessions",
      "identity_user_roles",
      "identity_users",
    ];
    const tables = new Set(
      (this.database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
        (row) => row.name,
      ),
    );
    const missing = requiredTables.filter((table) => !tables.has(table));
    if (missing.length) throw new Error(`Identity schema is incomplete for ${this.config.applicationId}: ${missing.join(", ")}.`);
    const requiredSessionColumns = ["actor_id", "app_id", "browser_session_id", "expires_at", "id", "issued_at", "state"];
    const missingColumns = requiredSessionColumns.filter((column) => !this.tableHasColumn("identity_sessions", column));
    if (missingColumns.length) {
      throw new Error(`Identity session schema is incomplete for ${this.config.applicationId}: ${missingColumns.join(", ")}.`);
    }
    const requiredUserColumns = ["username", "state"];
    const missingUserColumns = requiredUserColumns.filter((column) => !this.tableHasColumn("identity_users", column));
    if (missingUserColumns.length) {
      throw new Error(`Identity user schema is incomplete for ${this.config.applicationId}: ${missingUserColumns.join(", ")}.`);
    }
    const missingRecorderColumns = ["checksum", "sequence"].filter((column) => !this.tableHasColumn("identity_migration_state", column));
    if (missingRecorderColumns.length) {
      throw new Error(`Identity migration recorder is incomplete for ${this.config.applicationId}: ${missingRecorderColumns.join(", ")}.`);
    }
    const records = this.database.prepare("SELECT id, checksum, sequence FROM identity_migration_state ORDER BY sequence, id").all() as { id: string; checksum: string; sequence: number }[];
    if (records.length !== identityMigrationDefinitions.length) {
      throw new Error(`Identity migration history is incomplete for ${this.config.applicationId}.`);
    }
    for (const [sequence, migration] of identityMigrationDefinitions.entries()) {
      const record = records[sequence];
      if (!record || record.id !== migration.id || record.sequence !== sequence || record.checksum !== migrationChecksum(migration.definition)) {
        throw new Error(`Identity migration checksum or order changed for ${this.config.applicationId} at ${migration.id}.`);
      }
    }
  }

  private async seedDevelopmentIdentities(): Promise<void> {
    this.seedRole("super-admin", ["*"]);
    this.seedRole("admin", ["desk.read", "admin.desk.read"]);
    this.seedRole("user", ["desk.read"]);
    for (const seed of this.config.seeds) await this.seedUser(seed);
  }

  private seedRole(roleId: string, permissions: readonly string[]): void {
    const now = new Date().toISOString();
    this.database.prepare("INSERT OR IGNORE INTO identity_roles (id, created_at) VALUES (?, ?)").run(roleId, now);
    for (const permission of permissions) {
      this.database.prepare("INSERT OR IGNORE INTO identity_permissions (id, created_at) VALUES (?, ?)").run(permission, now);
      this.database.prepare("INSERT OR IGNORE INTO identity_role_permissions (role_id, permission_id) VALUES (?, ?)").run(roleId, permission);
    }
  }

  private async seedUser(seed: IdentitySeed): Promise<void> {
    const existing = this.findUserByLogin(seed.login);
    const now = new Date().toISOString();
    if (!existing || this.config.refreshSeeds) {
      const passwordHash = await hashIdentityPassword(seed.password);
      if (existing) {
        this.database.prepare("UPDATE identity_users SET name = ?, password_hash = ?, state = 'active', username = ?, updated_at = ? WHERE id = ?").run(seed.name, passwordHash, seed.username, now, existing.id);
      } else {
        this.createUser(seed, passwordHash, now);
      }
    }

    const user = this.findUserByLogin(seed.login);
    if (!user) throw new Error(`Could not seed identity user ${seed.login}.`);
    this.database.prepare("DELETE FROM identity_user_roles WHERE user_id = ?").run(user.id);
    this.database.prepare("INSERT INTO identity_user_roles (user_id, role_id) VALUES (?, ?)").run(user.id, seed.role);
  }

  private createSession(actorId: string, browserSessionId: string): IdentitySession {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 900_000);
    this.database
      .prepare("UPDATE identity_sessions SET state = 'revoked', revoked_at = ? WHERE app_id = ? AND browser_session_id = ? AND state = 'active'")
      .run(issuedAt.toISOString(), this.config.applicationId, browserSessionId);
    const session = identitySessionSchema.parse({
      actorId,
      expiresAt: expiresAt.toISOString(),
      id: randomUUID(),
      issuedAt: issuedAt.toISOString(),
      state: "active",
    });
    this.database
      .prepare("INSERT INTO identity_sessions (id, actor_id, app_id, browser_session_id, state, issued_at, expires_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)")
      .run(session.id, session.actorId, this.config.applicationId, browserSessionId, session.state, session.issuedAt, session.expiresAt);
    return session;
  }

  private readSessionClaims(authorization: string | undefined, browserSessionId: string | readonly string[] | undefined) {
    if (typeof browserSessionId !== "string" || !browserSessionId.trim()) return undefined;
    const token = /^Bearer ([^\s]+)$/u.exec(authorization ?? "")?.[1];
    const claims = token ? readPlatformJwtClaims(this.config, token) : undefined;
    if (!claims?.sessionId || claims.applicationId !== this.config.applicationId) return undefined;
    return claims;
  }

  private findUserByIdentifier(identifier: string): UserRow | undefined {
    return this.database
      .prepare("SELECT id, name, login, username, password_hash, state FROM identity_users WHERE lower(login) = lower(?) OR lower(username) = lower(?)")
      .get(identifier, identifier) as UserRow | undefined;
  }

  private findUserByLogin(login: string): UserRow | undefined {
    return this.database.prepare("SELECT id, name, login, username, password_hash, state FROM identity_users WHERE lower(login) = lower(?)").get(login) as UserRow | undefined;
  }

  private createUser(seed: IdentitySeed, passwordHash: string, now: string): void {
    if (this.tableHasColumn("identity_users", "role")) {
      this.database
        .prepare("INSERT INTO identity_users (id, name, login, username, password_hash, state, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)")
        .run(randomUUID(), seed.name, seed.login, seed.username, passwordHash, seed.role, now, now);
      return;
    }
    this.database
      .prepare("INSERT INTO identity_users (id, name, login, username, password_hash, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)")
      .run(randomUUID(), seed.name, seed.login, seed.username, passwordHash, now, now);
  }

  private retryAfterLoginLimit(identifier: string, browserSessionId: string): number | undefined {
    const now = Date.now();
    const blockedUntil = [this.loginLimit(this.identifierLimitKey(identifier)), this.loginLimit(this.browserLimitKey(browserSessionId))]
      .map((limit) => limit?.blocked_until)
      .filter((value): value is string => Boolean(value))
      .map((value) => Date.parse(value))
      .filter((value) => value > now)
      .sort((left, right) => right - left)[0];
    return blockedUntil ? Math.ceil((blockedUntil - now) / 1_000) : undefined;
  }

  private recordLoginFailure(identifier: string, browserSessionId: string): void {
    this.recordLimitFailure(this.identifierLimitKey(identifier));
    this.recordLimitFailure(this.browserLimitKey(browserSessionId));
  }

  private clearLoginFailures(identifier: string, browserSessionId: string): void {
    this.database.prepare("DELETE FROM identity_login_limits WHERE key IN (?, ?)").run(this.identifierLimitKey(identifier), this.browserLimitKey(browserSessionId));
  }

  private clearLoginFailuresForUser(userId: string): void {
    const user = this.database.prepare("SELECT login, username FROM identity_users WHERE id = ?").get(userId) as Pick<UserRow, "login" | "username"> | undefined;
    if (!user) return;
    this.database.prepare("DELETE FROM identity_login_limits WHERE key IN (?, ?)").run(this.identifierLimitKey(user.login), this.identifierLimitKey(user.username));
  }

  private recordLimitFailure(key: string): void {
    const now = new Date();
    const existing = this.loginLimit(key);
    const windowStartedAt = existing ? Date.parse(existing.window_started_at) : 0;
    const isCurrentWindow = windowStartedAt > now.getTime() - this.config.loginWindowSeconds * 1_000;
    const failureCount = isCurrentWindow ? (existing?.failure_count ?? 0) + 1 : 1;
    const blockedUntil = failureCount >= this.config.loginMaxFailures
      ? new Date(now.getTime() + this.config.loginLockoutSeconds * 1_000).toISOString()
      : null;
    this.database
      .prepare("INSERT INTO identity_login_limits (key, failure_count, window_started_at, blocked_until, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET failure_count = excluded.failure_count, window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until, updated_at = excluded.updated_at")
      .run(key, failureCount, isCurrentWindow && existing ? existing.window_started_at : now.toISOString(), blockedUntil, now.toISOString());
  }

  private loginLimit(key: string): LoginLimitRow | undefined {
    return this.database
      .prepare("SELECT key, failure_count, window_started_at, blocked_until FROM identity_login_limits WHERE key = ?")
      .get(key) as LoginLimitRow | undefined;
  }

  private identifierLimitKey(identifier: string): string {
    return `identifier:${this.secretDigest(identifier.trim().toLowerCase())}`;
  }

  private browserLimitKey(browserSessionId: string): string {
    return `browser:${this.secretDigest(browserSessionId)}`;
  }

  private tokenHash(token: string): string {
    return this.secretDigest(`reset:${token}`);
  }

  private secretDigest(value: string): string {
    return createHmac("sha256", this.config.secret).update(value).digest("base64url");
  }

  private recordAuditEvent(action: string, outcome: "success" | "failure", actorId?: string, targetId?: string): void {
    this.database
      .prepare("INSERT INTO identity_audit_events (id, occurred_at, actor_id, action, target_type, target_id, outcome, correlation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), new Date().toISOString(), actorId ?? null, action, "identity-user", targetId ?? null, outcome, randomUUID());
  }

  private matchesPortal(actor: Actor, portal: IdentityPortal): boolean {
    if (portal === "super-admin") return actor.roles.includes("super-admin");
    if (portal === "admin") return actor.roles.includes("admin");
    return !actor.roles.includes("admin") && !actor.roles.includes("super-admin");
  }

  private tableExists(table: string): boolean {
    return Boolean(this.database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
  }

  private addUsernameToExistingUsers(): void {
    if (!this.tableHasColumn("identity_users", "username")) {
      this.database.exec("ALTER TABLE identity_users ADD COLUMN username TEXT;");
      this.database.exec("UPDATE identity_users SET username = lower(CASE WHEN instr(login, '@') > 1 THEN substr(login, 1, instr(login, '@') - 1) ELSE login END) WHERE username IS NULL OR trim(username) = ''; ");
    }
    this.database.exec("CREATE UNIQUE INDEX IF NOT EXISTS identity_users_username_idx ON identity_users (lower(username));");
  }

  private addStateToExistingUsers(): void {
    if (!this.tableHasColumn("identity_users", "state")) {
      this.database.exec("ALTER TABLE identity_users ADD COLUMN state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'disabled'));");
    }
  }

  private managedUser(id: string): ManagedIdentityUser {
    const user = this.userRow(id);
    if (!user) throw new Error("Identity user does not exist.");
    return {
      id: user.id,
      login: user.login,
      name: user.name,
      protected: this.isProtectedIdentity(id),
      roles: this.roleIdsForUser(id),
      state: user.state,
      username: user.username,
    };
  }

  private userRow(id: string): ManagedUserRow | undefined {
    return this.database
      .prepare("SELECT id, login, name, password_hash, state, username FROM identity_users WHERE id = ?")
      .get(id) as ManagedUserRow | undefined;
  }

  private roleIdsForUser(userId: string): readonly string[] {
    return (this.database.prepare("SELECT role_id FROM identity_user_roles WHERE user_id = ? ORDER BY role_id").all(userId) as { role_id: string }[]).map((row) => row.role_id);
  }

  private assertUniqueUserIdentifiers(login: string, username: string, excludedUserId?: string): void {
    const duplicate = this.database
      .prepare("SELECT id FROM identity_users WHERE (lower(login) = lower(?) OR lower(username) = lower(?)) AND id <> coalesce(?, '')")
      .get(login, username, excludedUserId ?? null) as { id: string } | undefined;
    if (duplicate) throw new Error("Login or username is already in use.");
  }

  private assertRolesExist(roleIds: readonly string[]): void {
    const unique = [...new Set(roleIds)];
    for (const roleId of unique) {
      if (!this.database.prepare("SELECT 1 FROM identity_roles WHERE id = ?").get(roleId)) throw new Error(`Identity role does not exist: ${roleId}.`);
    }
  }

  private assertPermissionsExist(permissionIds: readonly string[]): void {
    const unique = [...new Set(permissionIds)];
    for (const permissionId of unique) {
      if (!this.database.prepare("SELECT 1 FROM identity_permissions WHERE id = ?").get(permissionId)) throw new Error(`Identity permission does not exist: ${permissionId}.`);
    }
  }

  private isUserActive(userId: string): boolean {
    return Boolean(this.database.prepare("SELECT 1 FROM identity_users WHERE id = ? AND state = 'active'").get(userId));
  }

  private isProtectedIdentity(userId: string): boolean {
    return this.roleIdsForUser(userId).some((roleId) => roleId === "admin" || roleId === "super-admin");
  }

  private tableHasColumn(table: string, column: string): boolean {
    const columns = this.database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    return columns.some((item) => item.name === column);
  }

  private toActor(userId: string): Actor {
    const user = this.database.prepare("SELECT id FROM identity_users WHERE id = ? AND state = 'active'").get(userId) as { id: string } | undefined;
    if (!user) throw new Error(`Identity user ${userId} does not exist.`);
    const roles = this.database.prepare("SELECT role_id FROM identity_user_roles WHERE user_id = ? ORDER BY role_id").all(userId) as { role_id: string }[];
    const permissions = this.database.prepare("SELECT DISTINCT rp.permission_id FROM identity_role_permissions rp JOIN identity_user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ? ORDER BY rp.permission_id").all(userId) as { permission_id: string }[];
    return actorSchema.parse({ id: user.id, kind: "user", permissions: permissions.map((row) => row.permission_id), roles: roles.map((row) => row.role_id) });
  }

  private ensureMigrationRecorderColumns(): void {
    if (!this.tableHasColumn("identity_migration_state", "checksum")) this.database.exec("ALTER TABLE identity_migration_state ADD COLUMN checksum TEXT NOT NULL DEFAULT '';");
    if (!this.tableHasColumn("identity_migration_state", "sequence")) this.database.exec("ALTER TABLE identity_migration_state ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0;");
  }

  private recordMigration(id: string, definition: string, sequence: number): void {
    const checksum = migrationChecksum(definition);
    this.database.prepare("INSERT OR IGNORE INTO identity_migration_state (id, applied_at, checksum, sequence) VALUES (?, ?, ?, ?)").run(id, new Date().toISOString(), checksum, sequence);
    this.database.prepare("UPDATE identity_migration_state SET checksum = ?, sequence = ? WHERE id = ? AND (checksum = '' OR checksum IS NULL)").run(checksum, sequence, id);
  }
}

function migrationChecksum(definition: string): string {
  return createHash("sha256").update(definition, "utf8").digest("hex");
}

type SessionRow = {
  readonly actor_id: string;
  readonly expires_at: string;
  readonly id: string;
  readonly issued_at: string;
  readonly state: "active" | "revoked";
};

type LoginLimitRow = {
  readonly blocked_until: string | null;
  readonly failure_count: number;
  readonly key: string;
  readonly window_started_at: string;
};

type PasswordResetRow = {
  readonly id: string;
  readonly user_id: string;
};

type UserRow = {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly password_hash: string;
  readonly state: IdentityUserState;
  readonly username: string;
};

type ManagedUserRow = UserRow & {
  readonly name: string;
};
