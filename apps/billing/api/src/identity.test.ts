import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { LocalIdentityStore, readLocalIdentityConfiguration } from "@codexsun/platform-core";

test("initializes Billing identity and authenticates an application actor", async () => {
  const password = randomUUID();
  const configuration = readLocalIdentityConfiguration(
    {
      APP_MODE: "development",
      ADMIN_LOGIN: `admin-${randomUUID()}@example.test`,
      ADMIN_NAME: "Billing Test Administrator",
      ADMIN_PASSWORD: randomUUID(),
      ADMIN_USERNAME: `admin-${randomUUID()}`,
      IDENTITY_LOGIN_LOCKOUT_SECONDS: "900",
      IDENTITY_LOGIN_MAX_FAILURES: "5",
      IDENTITY_LOGIN_WINDOW_SECONDS: "900",
      IDENTITY_PASSWORD_RESET_TOKEN_TTL_SECONDS: "900",
      PLATFORM_JWT_SECRET: `${randomUUID()}${randomUUID()}`,
      SUPER_ADMIN_LOGIN: `super-${randomUUID()}@example.test`,
      SUPER_ADMIN_NAME: "Billing Test Super Administrator",
      SUPER_ADMIN_PASSWORD: randomUUID(),
      USER_LOGIN: `billing-${randomUUID()}@example.test`,
      USER_NAME: "Billing Test User",
      USER_PASSWORD: password,
    },
    { applicationId: "billing", databasePath: ":memory:" },
  );
  const identity = new LocalIdentityStore(configuration);
  await identity.initialize();

  const browserSessionId = randomUUID();
  const login = await identity.login(configuration.seeds[2]?.login ?? "", password, browserSessionId, "user");

  assert.ok(login);
  assert.deepEqual(login.actor.roles, ["user"]);
  assert.equal(identity.authenticate(`Bearer ${login.token}`, browserSessionId)?.id, login.actor.id);
  assert.equal(identity.logout(`Bearer ${login.token}`, browserSessionId), true);
  assert.equal(identity.authenticate(`Bearer ${login.token}`, browserSessionId), undefined);

  identity.close();
});
