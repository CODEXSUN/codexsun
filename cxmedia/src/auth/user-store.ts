import type { CxmediaConfig } from "../config/env.js"
import { readJsonFile, writeJsonFile } from "../persistence/json-file.js"

import type { StoredUser, UserRole } from "./contracts.js"
import { hashPassword } from "./password.js"

type UserStoreFile = {
  users: StoredUser[]
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sortUsers(users: StoredUser[]) {
  return [...users].sort((left, right) => left.email.localeCompare(right.email))
}

function toStoredUser(input: {
  email: string
  name: string
  role: UserRole
  passwordHash: string
  active: boolean
  createdAt?: string
  lastLoginAt?: string | null
}) {
  const timestamp = new Date().toISOString()

  return {
    active: input.active,
    createdAt: input.createdAt ?? timestamp,
    email: normalizeEmail(input.email),
    lastLoginAt: input.lastLoginAt ?? null,
    name: input.name.trim() || input.email.trim(),
    passwordHash: input.passwordHash,
    role: input.role,
    updatedAt: timestamp,
  } satisfies StoredUser
}

export class UserStore {
  constructor(private readonly config: CxmediaConfig) {}

  async initialize() {
    const state = await this.readState()

    if (state.users.length === 0) {
      await this.seedBootstrapAdmin()
      return
    }

    const bootstrapEmail = this.config.auth.bootstrapAdminEmail

    if (!bootstrapEmail) {
      return
    }

    const existingAdmin = state.users.find((user) => user.email === bootstrapEmail)

    if (!existingAdmin) {
      await this.seedBootstrapAdmin(state.users)
      return
    }

    if (!this.config.auth.bootstrapAdminPassword && !this.config.auth.bootstrapAdminPasswordHash) {
      return
    }

    await this.updateUser(bootstrapEmail, {
      active: true,
      name: this.config.auth.bootstrapAdminName || existingAdmin.name,
      password: this.config.auth.bootstrapAdminPassword ?? undefined,
      passwordHash: this.config.auth.bootstrapAdminPasswordHash ?? undefined,
      role: "admin",
    })
  }

  async listUsers() {
    const state = await this.readState()
    return sortUsers(state.users)
  }

  async getUserByEmail(email: string) {
    const state = await this.readState()
    return state.users.find((user) => user.email === normalizeEmail(email)) ?? null
  }

  async createUser(input: {
    email: string
    name: string
    role: UserRole
    password?: string
    passwordHash?: string
  }) {
    const email = normalizeEmail(input.email)
    const state = await this.readState()

    if (state.users.some((user) => user.email === email)) {
      throw new Error("A user with that email already exists.")
    }

    const passwordHash = this.resolvePasswordHash(input.password, input.passwordHash)
    const nextUser = toStoredUser({
      active: true,
      email,
      name: input.name,
      passwordHash,
      role: input.role,
    })

    await this.writeState({
      users: [...state.users, nextUser],
    })

    return nextUser
  }

  async upsertUser(input: {
    email: string
    previousEmail?: string | null
    name: string
    role: UserRole
    password?: string
    passwordHash?: string
    active: boolean
  }) {
    const email = normalizeEmail(input.email)
    const previousEmail = input.previousEmail ? normalizeEmail(input.previousEmail) : null
    const state = await this.readState()
    const existing =
      state.users.find((user) => user.email === email) ??
      (previousEmail ? state.users.find((user) => user.email === previousEmail) : null)

    if (existing) {
      const conflictingUser = state.users.find(
        (user) => user.email === email && user.email !== existing.email
      )

      if (conflictingUser) {
        throw new Error("A user with that email already exists.")
      }

      const nextUser = {
        ...existing,
        active: input.active,
        email,
        name: input.name.trim() || existing.name,
        passwordHash: this.resolvePasswordHash(input.password, input.passwordHash),
        role: input.role,
        updatedAt: new Date().toISOString(),
      } satisfies StoredUser

      const nextUsers = state.users
        .filter((user) => user.email !== existing.email)
        .concat(nextUser)

      this.assertHasActiveAdmin(nextUsers)
      await this.writeState({ users: nextUsers })
      return nextUser
    }

    return this.createUser({
      email,
      name: input.name,
      password: input.password,
      passwordHash: input.passwordHash,
      role: input.role,
    }).then(async (createdUser) => {
      if (createdUser.active === input.active) {
        return createdUser
      }

      return this.updateUser(createdUser.email, {
        active: input.active,
      })
    })
  }

  async updateUser(
    email: string,
    updates: {
      name?: string
      role?: UserRole
      password?: string
      passwordHash?: string
      active?: boolean
    }
  ) {
    const normalizedEmail = normalizeEmail(email)
    const state = await this.readState()
    const existing = state.users.find((user) => user.email === normalizedEmail)

    if (!existing) {
      throw new Error("User not found.")
    }

    const nextUser = {
      ...existing,
      active: updates.active ?? existing.active,
      name: updates.name?.trim() || existing.name,
      passwordHash:
        updates.password || updates.passwordHash
          ? this.resolvePasswordHash(updates.password, updates.passwordHash)
          : existing.passwordHash,
      role: updates.role ?? existing.role,
      updatedAt: new Date().toISOString(),
    } satisfies StoredUser

    const nextUsers = state.users.map((user) => (user.email === normalizedEmail ? nextUser : user))
    this.assertHasActiveAdmin(nextUsers)
    await this.writeState({ users: nextUsers })

    return nextUser
  }

  async recordLogin(email: string) {
    const normalizedEmail = normalizeEmail(email)
    const state = await this.readState()
    const nextUsers = state.users.map((user) =>
      user.email === normalizedEmail
        ? {
            ...user,
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : user
    )

    await this.writeState({ users: nextUsers })
  }

  async deleteUserByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email)
    const state = await this.readState()

    if (!state.users.some((user) => user.email === normalizedEmail)) {
      return false
    }

    const nextUsers = state.users.filter((user) => user.email !== normalizedEmail)
    this.assertHasActiveAdmin(nextUsers)
    await this.writeState({ users: nextUsers })
    return true
  }

  private async seedBootstrapAdmin(existingUsers: StoredUser[] = []) {
    const email = this.config.auth.bootstrapAdminEmail
    const name = this.config.auth.bootstrapAdminName

    if (!email) {
      throw new Error("CXMEDIA_ADMIN_EMAIL is required when no cxmedia users exist yet.")
    }

    const passwordHash = this.resolvePasswordHash(
      this.config.auth.bootstrapAdminPassword,
      this.config.auth.bootstrapAdminPasswordHash
    )
    const nextUser = toStoredUser({
      active: true,
      email,
      name,
      passwordHash,
      role: "admin",
    })

    await this.writeState({
      users: [...existingUsers.filter((user) => user.email !== nextUser.email), nextUser],
    })
  }

  private resolvePasswordHash(password?: string | null, passwordHash?: string | null) {
    if (passwordHash?.trim()) {
      return passwordHash.trim()
    }

    if (password?.trim()) {
      return hashPassword(password.trim())
    }

    throw new Error("A password or password hash is required.")
  }

  private assertHasActiveAdmin(users: StoredUser[]) {
    if (!users.some((user) => user.active && user.role === "admin")) {
      throw new Error("At least one active admin user is required.")
    }
  }

  private async readState() {
    return readJsonFile<UserStoreFile>(this.config.auth.usersFilePath, {
      users: [],
    })
  }

  private async writeState(state: UserStoreFile) {
    this.assertHasActiveAdmin(state.users)
    await writeJsonFile(this.config.auth.usersFilePath, {
      users: sortUsers(state.users),
    })
  }
}
