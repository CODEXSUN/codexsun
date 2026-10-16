import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  authCookieName,
  clearAllSessionCookies,
  clearSelectedSessionCookie,
  decryptSessionCookie,
  encryptSessionCookie,
  readEncryptedSessionCookie,
  writeEncryptedSessionCookie
} from "./session-cookie.js";

test("legacy session cleanup expires every former shared cookie", () => {
  const cleared: string[] = [];
  const reply = {
    clearCookie(name: string) {
      cleared.push(name);
      return this;
    }
  } as unknown as FastifyReply;

  clearAllSessionCookies(reply);

  assert.deepEqual(cleared, [
    "codexsun_session",
    "codexsun_session_admin",
    "codexsun_session_sa",
    "codexsun_session_tenant",
    "__Host-codexsun_session"
  ]);
});

test("each fresh login cookie is unique and preserves only its new session token", () => {
  const first = encryptSessionCookie("first-session-token");
  const fresh = encryptSessionCookie("fresh-session-token");

  assert.notEqual(fresh, first);
  assert.equal(decryptSessionCookie(first), "first-session-token");
  assert.equal(decryptSessionCookie(fresh), "fresh-session-token");
});

test("parallel tabs select separate encrypted cookies and clear only their own slot", () => {
  const cookies = new Map<string, string>();
  const cleared: string[] = [];
  const reply = {
    clearCookie(name: string) {
      cleared.push(name);
      cookies.delete(name);
      return this;
    },
    setCookie(name: string, value: string) {
      cookies.set(name, value);
      return this;
    }
  } as unknown as FastifyReply;

  const saSlot = writeEncryptedSessionCookie(reply, "sa-token");
  const tenantSlot = writeEncryptedSessionCookie(reply, "tenant-token");
  assert.ok(saSlot);
  assert.ok(tenantSlot);
  assert.notEqual(saSlot, tenantSlot);

  function request(slot: string): FastifyRequest {
    return {
      cookies: Object.fromEntries(cookies),
      headers: { "x-codexsun-session-slot": slot }
    } as unknown as FastifyRequest;
  }

  assert.equal(readEncryptedSessionCookie(request(saSlot)), "sa-token");
  assert.equal(readEncryptedSessionCookie(request(tenantSlot)), "tenant-token");
  clearSelectedSessionCookie(reply, request(tenantSlot));
  assert.deepEqual(cleared, [authCookieName(tenantSlot)]);
  assert.equal(readEncryptedSessionCookie(request(saSlot)), "sa-token");
  assert.equal(readEncryptedSessionCookie(request(tenantSlot)), "");
  assert.equal(readEncryptedSessionCookie(request("invalid-slot")), "");
});

test("session cookie resolves from query parameter when slot header is absent", () => {
  const reply = {
    setCookie(name: string, value: string) {
      cookies.set(name, value);
      return this;
    }
  } as unknown as FastifyReply;
  const cookies = new Map<string, string>();
  const slot = writeEncryptedSessionCookie(reply, "ws-token");
  assert.ok(slot);

  const requestWithQuery = {
    cookies: Object.fromEntries(cookies),
    headers: {},
    query: { sessionSlot: slot },
    url: `/chat/realtime?companyId=1&sessionSlot=${slot}`
  } as unknown as FastifyRequest;

  assert.equal(readEncryptedSessionCookie(requestWithQuery), "ws-token");
});

test("session cookie falls back to single slotted cookie when header and query slot are absent", () => {
  const reply = {
    setCookie(name: string, value: string) {
      cookies.set(name, value);
      return this;
    }
  } as unknown as FastifyReply;
  const cookies = new Map<string, string>();
  const slot = writeEncryptedSessionCookie(reply, "single-token");
  assert.ok(slot);

  const requestWithoutSlot = {
    cookies: Object.fromEntries(cookies),
    headers: {},
    url: "/chat/realtime?companyId=1"
  } as unknown as FastifyRequest;

  assert.equal(readEncryptedSessionCookie(requestWithoutSlot), "single-token");
});

