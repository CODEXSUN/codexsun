import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";
import { signAuthToken } from "./jwt.js";
import { writeDevelopmentSessionCookie } from "./development-session-cookie.js";
import { authCookieName, encryptSessionCookie } from "./session-cookie.js";

test("development auto-login reuses one cookie and retires only obsolete matching sessions", () => {
  const before = { mode: env.NODE_ENV, enabled: env.DEV_AUTO_TENANT_LOGIN };
  env.NODE_ENV = "development";
  env.DEV_AUTO_TENANT_LOGIN = "1";
  try {
    const cookies = new Map<string, string>();
    const reply = {
      setCookie(name: string, value: string) {
        cookies.set(name, value);
        return this;
      },
      clearCookie(name: string) {
        cookies.delete(name);
        return this;
      }
    } as unknown as FastifyReply;
    const token = () =>
      signAuthToken({
        email: "default@example.test",
        userId: "default-user",
        userType: "tenant",
        tenantUuid: "default-tenant",
        loginHost: "127.0.0.1"
      });
    const stale = authCookieName("1".repeat(32));
    const invalid = authCookieName("2".repeat(32));
    const otherTenant = authCookieName("3".repeat(32));
    const sa = authCookieName("4".repeat(32));
    cookies.set(stale, encryptSessionCookie(token()));
    cookies.set(invalid, encryptSessionCookie("expired-or-invalid-token"));
    cookies.set(
      otherTenant,
      encryptSessionCookie(
        signAuthToken({
          email: "default@example.test",
          userId: "default-user",
          userType: "tenant",
          tenantUuid: "other-tenant",
          loginHost: "127.0.0.1"
        })
      )
    );
    cookies.set(
      sa,
      encryptSessionCookie(
        signAuthToken({
          email: "admin@example.test",
          userId: "admin-user",
          userType: "super_admin",
          loginHost: "127.0.0.1"
        })
      )
    );
    const request = () => ({ cookies: Object.fromEntries(cookies) }) as FastifyRequest;
    const firstSlot = writeDevelopmentSessionCookie(reply, request(), token());
    assert.ok(firstSlot);
    assert.equal(cookies.has(stale), false);
    assert.equal(cookies.has(invalid), false);
    assert.equal(cookies.has(otherTenant), true);
    assert.equal(cookies.has(sa), true);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      assert.equal(writeDevelopmentSessionCookie(reply, request(), token()), firstSlot);
    }
    assert.equal(cookies.size, 3);
  } finally {
    env.NODE_ENV = before.mode;
    env.DEV_AUTO_TENANT_LOGIN = before.enabled;
  }
});

test("development cookie handling fails closed outside enabled development mode", () => {
  const before = { mode: env.NODE_ENV, enabled: env.DEV_AUTO_TENANT_LOGIN };
  try {
    for (const [mode, enabled] of [
      ["production", "1"],
      ["development", "0"]
    ] as const) {
      env.NODE_ENV = mode;
      env.DEV_AUTO_TENANT_LOGIN = enabled;
      assert.throws(
        () => writeDevelopmentSessionCookie({} as FastifyReply, {} as FastifyRequest, ""),
        /Development login is disabled/u
      );
    }
  } finally {
    env.NODE_ENV = before.mode;
    env.DEV_AUTO_TENANT_LOGIN = before.enabled;
  }
});
