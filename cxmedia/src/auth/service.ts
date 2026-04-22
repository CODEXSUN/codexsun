import type { IncomingHttpHeaders } from "node:http"

import type { UserRole } from "./contracts.js"
import type { CxmediaConfig } from "../config/env.js"

import { signJwt, verifyJwt } from "./jwt.js"
import type { AuthenticatedUser } from "./contracts.js"
import { verifyPassword } from "./password.js"
import { UserStore } from "./user-store.js"

export class AuthService {
  constructor(
    private readonly config: CxmediaConfig,
    private readonly userStore: UserStore
  ) {}

  async initialize() {
    await this.userStore.initialize()
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.userStore.getUserByEmail(normalizedEmail)

    if (!user?.active) {
      throw new Error("Invalid email or password.")
    }

    if (
      !verifyPassword(password, {
        plainTextPassword: null,
        passwordHash: user.passwordHash,
      })
    ) {
      throw new Error("Invalid email or password.")
    }

    const accessToken = signJwt(
      {
        active: user.active,
        email: normalizedEmail,
        name: user.name,
        role: user.role,
      },
      {
        secret: this.config.auth.jwtSecret,
        subject: normalizedEmail,
        expiresInSeconds: this.config.auth.jwtExpiresInSeconds,
      }
    )

    const session = {
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds: this.config.auth.jwtExpiresInSeconds,
      user: {
        active: user.active,
        email: normalizedEmail,
        name: user.name,
        role: user.role,
      },
    }

    await this.userStore.recordLogin(normalizedEmail)

    return session
  }

  async createTrustedSession(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.userStore.getUserByEmail(normalizedEmail)

    if (!user?.active) {
      throw new Error("Invalid trusted user.")
    }

    const accessToken = signJwt(
      {
        active: user.active,
        email: normalizedEmail,
        name: user.name,
        role: user.role,
      },
      {
        secret: this.config.auth.jwtSecret,
        subject: normalizedEmail,
        expiresInSeconds: this.config.auth.jwtExpiresInSeconds,
      }
    )

    const session = {
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds: this.config.auth.jwtExpiresInSeconds,
      user: {
        active: user.active,
        email: normalizedEmail,
        name: user.name,
        role: user.role,
      },
    }

    await this.userStore.recordLogin(normalizedEmail)

    return session
  }

  getAuthenticatedUser(headers: IncomingHttpHeaders): AuthenticatedUser {
    const authorization = headers.authorization
    const value = Array.isArray(authorization) ? authorization[0] : authorization

    if (!value) {
      throw new Error("Authorization bearer token is required.")
    }

    const [scheme, token] = value.split(" ")

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new Error("Authorization bearer token is required.")
    }

    const payload = verifyJwt<AuthenticatedUser>(
      token.trim(),
      this.config.auth.jwtSecret
    )

    if (!payload.email || !payload.name || !payload.active) {
      throw new Error("Invalid authenticated user.")
    }

    return {
      active: true,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
  }

  requireRole(user: AuthenticatedUser, minimumRole: UserRole) {
    const rank: Record<UserRole, number> = {
      admin: 3,
      editor: 2,
      viewer: 1,
    }

    if (rank[user.role] < rank[minimumRole]) {
      throw new Error("You do not have permission for that action.")
    }
  }
}
