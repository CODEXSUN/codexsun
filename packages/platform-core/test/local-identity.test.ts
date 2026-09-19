import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import {
  authorize,
  IdentityLoginRateLimitError,
  LocalIdentityStore,
  registerIdentityManagementRoutes,
  readPlatformJwtClaims,
  type LocalIdentityConfiguration,
} from "../src/index.js";

test("keeps each app and browser session isolated, then revokes logout server-side", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-test-"));
  const configuration = createConfiguration(join(directory, "qcafe.sqlite"));
  const identity = new LocalIdentityStore(configuration);
  const browserSessionId = randomUUID();

  try {
    await identity.initialize();
    const login = await identity.login("superadmin@example.test", "development-password", browserSessionId, "super-admin");
    assert.ok(login);

    const claims = readPlatformJwtClaims(configuration, login.token);
    assert.equal(claims?.applicationId, "qcafe");
    assert.equal(claims?.sessionId, login.session.id);
    assert.ok(identity.authenticate(`Bearer ${login.token}`, browserSessionId));
    assert.equal(identity.authenticate(`Bearer ${login.token}`, randomUUID()), undefined);
    assert.deepEqual(authorize(login.actor, { permissions: ["users.write"] }), {
      allowed: true,
      missingPermissions: [],
    });

    assert.equal(await identity.login("superadmin", "development-password", browserSessionId, "admin"), undefined);
    const replacementLogin = await identity.login("admin", "development-password", browserSessionId, "admin");
    assert.ok(replacementLogin);
    assert.ok(await identity.login("user", "development-password", randomUUID(), "user"));
    assert.equal(await identity.login("admin", "development-password", randomUUID(), "user"), undefined);
    assert.equal(identity.authenticate(`Bearer ${login.token}`, browserSessionId), undefined);
    assert.equal(identity.logout(`Bearer ${replacementLogin.token}`, browserSessionId), true);
    assert.equal(identity.authenticate(`Bearer ${replacementLogin.token}`, browserSessionId), undefined);
  } finally {
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});

test("does not create an identity database during production startup", () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-test-"));
  const configuration = { ...createConfiguration(join(directory, "production.sqlite")), appMode: "production" as const };

  try {
    assert.throws(() => new LocalIdentityStore(configuration), /Run migrations before production start/u);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("allows an explicit migration before production startup", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-test-"));
  const databasePath = join(directory, "production.sqlite");
  const development = new LocalIdentityStore(createConfiguration(databasePath));

  try {
    development.migrate();
    development.close();
    const production = new LocalIdentityStore({ ...createConfiguration(databasePath), appMode: "production" });
    try {
      await production.initialize();
    } finally {
      production.close();
    }
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("persists login limits, reset-token hashes, and safe identity audit events", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-test-"));
  const databasePath = join(directory, "identity.sqlite");
  const identity = new LocalIdentityStore(createConfiguration(databasePath));

  try {
    await identity.initialize();
    const browserSessionId = randomUUID();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      assert.equal(await identity.login("admin", "wrong-password", browserSessionId), undefined);
    }
    await assert.rejects(identity.login("admin", "wrong-password", browserSessionId), IdentityLoginRateLimitError);

    const request = await identity.requestPasswordReset("admin@example.test");
    assert.ok(request);
    assert.equal(await identity.resetPassword(request.token, "updated-password"), true);
    assert.ok(await identity.login("admin", "updated-password", randomUUID()));
    assert.equal(await identity.resetPassword(request.token, "another-password"), false);

    const database = new DatabaseSync(databasePath);
    const actions = database.prepare("SELECT action, outcome FROM identity_audit_events ORDER BY occurred_at").all() as { action: string; outcome: string }[];
    const tokens = database.prepare("SELECT token_hash FROM identity_password_reset_tokens").all() as { token_hash: string }[];
    database.close();
    assert.ok(actions.some((event) => event.action === "identity.login.rate-limited" && event.outcome === "failure"));
    assert.ok(actions.some((event) => event.action === "identity.password-reset.completed" && event.outcome === "success"));
    assert.equal(tokens.some((item) => item.token_hash === request.token), false);
  } finally {
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});

test("creates, updates, and assigns local RBAC records", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-rbac-test-"));
  const identity = new LocalIdentityStore(createConfiguration(join(directory, "identity.sqlite")));

  try {
    await identity.initialize();
    identity.createPermission("orders.read");
    identity.createRole("manager");
    identity.replaceRolePermissions("manager", ["orders.read"]);
    const user = await identity.createManagedUser({
      login: "manager@example.test",
      name: "Manager",
      password: "development-password",
      state: "active",
      username: "manager",
    });
    identity.replaceUserRoles(user.id, ["manager"]);

    assert.deepEqual(identity.listPermissions(), ["*", "admin.desk.read", "desk.read", "orders.read"]);
    assert.ok(identity.listRoles().includes("manager"));
    assert.deepEqual(identity.listUserRoleAssignments().filter((assignment) => assignment.userId === user.id), [{ roleId: "manager", userId: user.id }]);
    assert.deepEqual(identity.listRolePermissionAssignments().filter((assignment) => assignment.roleId === "manager"), [{ permissionId: "orders.read", roleId: "manager" }]);

    const updated = await identity.updateUser(user.id, { login: user.login, name: "Disabled manager", state: "disabled", username: user.username });
    assert.equal(updated?.state, "disabled");
    assert.equal(await identity.login("manager", "development-password", randomUUID(), "user"), undefined);
  } finally {
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});

test("manages RBAC through protected HTTP list and CRUD routes", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../dist"), "identity-rbac-http-test-"));
  const identity = new LocalIdentityStore(createConfiguration(join(directory, "identity.sqlite")));
  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  try {
    await identity.initialize();
    registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/qcafe" });
    const browserSessionId = randomUUID();
    const login = await identity.login("superadmin", "development-password", browserSessionId, "super-admin");
    assert.ok(login);
    const headers = { authorization: `Bearer ${login.token}`, "x-codexsun-browser-session": browserSessionId };
    const permission = `orders.read-${randomUUID().slice(0, 8)}`;
    const role = `manager-${randomUUID().slice(0, 8)}`;
    const userName = `manager-${randomUUID().slice(0, 8)}`;
    const createPermission = await app.inject({ body: { id: permission }, headers, method: "POST", url: "/api/v1/qcafe/identity/permissions" });
    assert.equal(createPermission.statusCode, 201);
    const createRole = await app.inject({ body: { id: role }, headers, method: "POST", url: "/api/v1/qcafe/identity/roles" });
    assert.equal(createRole.statusCode, 201);
    const createUser = await app.inject({ body: { login: `${userName}@example.test`, name: "Random manager", password: "development-password", state: "active", username: userName }, headers, method: "POST", url: "/api/v1/qcafe/identity/users" });
    assert.equal(createUser.statusCode, 201);
    const user = createUser.json() as { id: string };
    assert.equal((await app.inject({ body: { ids: [role] }, headers, method: "PUT", url: `/api/v1/qcafe/identity/user-roles/${user.id}` })).statusCode, 204);
    assert.equal((await app.inject({ body: { ids: [permission] }, headers, method: "PUT", url: `/api/v1/qcafe/identity/role-permissions/${role}` })).statusCode, 204);
    const users = await app.inject({ headers, method: "GET", url: "/api/v1/qcafe/identity/users" });
    assert.equal(users.statusCode, 200);
    assert.ok((users.json() as { username: string; roles: string[] }[]).some((item) => item.username === userName && item.roles.includes(role)));
    const denied = await app.inject({ method: "GET", url: "/api/v1/qcafe/identity/users" });
    assert.equal(denied.statusCode, 403);
  } finally {
    await app.close();
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});

function createConfiguration(databasePath: string): LocalIdentityConfiguration {
  return {
    appMode: "development",
    applicationId: "qcafe",
    autoLogin: false,
    databasePath,
    exposeDevelopmentResetToken: false,
    loginLockoutSeconds: 60,
    loginMaxFailures: 3,
    loginWindowSeconds: 60,
    passwordResetTokenTtlSeconds: 60,
    refreshSeeds: false,
    secret: "platform-jwt-test-secret-platform-jwt-test",
    seeds: [
      {
        login: "superadmin@example.test",
        name: "Super admin",
        password: "development-password",
        role: "super-admin",
        username: "superadmin",
      },
      {
        login: "admin@example.test",
        name: "Admin",
        password: "development-password",
        role: "admin",
        username: "admin",
      },
      {
        login: "user@example.test",
        name: "User",
        password: "development-password",
        role: "user",
        username: "user",
      },
    ],
  };
}
