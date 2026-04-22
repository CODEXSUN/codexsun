import assert from "node:assert/strict"
import { pbkdf2Sync, scryptSync } from "node:crypto"
import test from "node:test"

import { AuthService } from "../src/auth/service.js"
import { UserStore } from "../src/auth/user-store.js"

import { createTestConfig } from "./test-fixtures.js"

test("auth service logs in the bootstrap admin and authenticates bearer tokens", async () => {
  const config = createTestConfig()
  const authService = new AuthService(config, new UserStore(config))
  await authService.initialize()

  const session = await authService.login(" ADMIN@example.com ", "Password@123")

  assert.equal(session.tokenType, "Bearer")
  assert.equal(session.user.email, "admin@example.com")
  assert.equal(session.user.role, "admin")
  assert.equal(session.user.name, "Primary Admin")

  const authenticated = authService.getAuthenticatedUser({
    authorization: `Bearer ${session.accessToken}`,
  })

  assert.deepEqual(authenticated, {
    active: true,
    email: "admin@example.com",
    name: "Primary Admin",
    role: "admin",
  })
})

test("auth service supports pbkdf2 password hashes", async () => {
  const salt = "test-salt"
  const hash = pbkdf2Sync("Password@123", salt, 120000, 32, "sha256").toString("hex")
  const config = createTestConfig(
    {
      auth: {
        bootstrapAdminPassword: null,
        bootstrapAdminPasswordHash: `pbkdf2$120000$${salt}$${hash}`,
      },
    }
  )
  const authService = new AuthService(
    config,
    new UserStore(config)
  )
  await authService.initialize()

  const session = await authService.login("admin@example.com", "Password@123")

  assert.equal(session.user.email, "admin@example.com")
})

test("auth service supports cxapp scrypt password hashes", async () => {
  const salt = "test-scrypt-salt"
  const hash = scryptSync("Password@123", salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  }).toString("base64url")
  const config = createTestConfig({
    auth: {
      bootstrapAdminPassword: null,
      bootstrapAdminPasswordHash: `scrypt$16384$8$1$${salt}$${hash}`,
    },
  })
  const authService = new AuthService(config, new UserStore(config))
  await authService.initialize()

  const session = await authService.login("admin@example.com", "Password@123")

  assert.equal(session.user.email, "admin@example.com")
})

test("auth service supports multiple standalone users with role checks", async () => {
  const config = createTestConfig()
  const userStore = new UserStore(config)
  const authService = new AuthService(config, userStore)
  await authService.initialize()
  await userStore.createUser({
    email: "editor@example.com",
    name: "Editor",
    password: "Editor@123",
    role: "editor",
  })

  const session = await authService.login("editor@example.com", "Editor@123")

  assert.equal(session.user.role, "editor")
  assert.throws(() => authService.requireRole(session.user, "admin"), {
    message: "You do not have permission for that action.",
  })
})

test("auth service creates trusted sessions for synced users", async () => {
  const config = createTestConfig()
  const userStore = new UserStore(config)
  const authService = new AuthService(config, userStore)
  await authService.initialize()
  await userStore.createUser({
    email: "viewer@example.com",
    name: "Viewer",
    passwordHash:
      "scrypt$16384$8$1$test-salt$MOWJPyfT7PS4P2BWxMPR2fqvLTa5LTa8sdR8ZfFlH+q1PajPHfH+1gPW+0Pwh6nOfK+vMH6OWh4k4jBQ45mx6Q",
    role: "viewer",
  })

  const session = await authService.createTrustedSession("viewer@example.com")

  assert.equal(session.user.email, "viewer@example.com")
  assert.equal(session.user.role, "viewer")
})

test("auth service rejects invalid credentials and malformed authorization headers", async () => {
  const config = createTestConfig()
  const authService = new AuthService(config, new UserStore(config))
  await authService.initialize()

  await assert.rejects(() => authService.login("other@example.com", "Password@123"), {
    message: "Invalid email or password.",
  })
  await assert.rejects(() => authService.login("admin@example.com", "wrong-password"), {
    message: "Invalid email or password.",
  })
  assert.throws(() => authService.getAuthenticatedUser({}), {
    message: "Authorization bearer token is required.",
  })
  assert.throws(
    () =>
      authService.getAuthenticatedUser({
        authorization: "Token abc123",
      }),
    {
      message: "Authorization bearer token is required.",
    }
  )
})
