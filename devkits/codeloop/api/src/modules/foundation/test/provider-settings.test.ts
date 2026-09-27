import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { ProviderSettingsStore } from "../provider-settings-store.js";

const databasePath = resolve(process.cwd(), "../../../storage/runtime/codeloop-provider-settings-test.sqlite");

test("persists encrypted provider settings and isolated conversation bindings", () => {
  mkdirSync(dirname(databasePath), { recursive: true });
  if (existsSync(databasePath)) rmSync(databasePath, { force: true });
  const store = new ProviderSettingsStore(databasePath, "codeloop-test-secret-that-is-at-least-32-chars");
  store.initialize([{ providerId: "ollama", enabled: true, endpoint: "http://localhost:6411", model: "qwen3:4b" }]);
  store.replace("actor-1", [{ providerId: "ollama", enabled: true, endpoint: "http://localhost:6411", model: "qwen3:4b", apiKey: "local-secret-token" }]);
  const visibleProviders = store.list("actor-1").map((provider) => {
    const visible = { ...provider };
    delete visible.apiKey;
    return visible;
  });
  assert.deepEqual(visibleProviders, [{ apiKeyConfigured: true, apiKeyHint: "local-se…", enabled: true, endpoint: "http://localhost:6411", model: "qwen3:4b", providerId: "ollama", updatedAt: store.list("actor-1")[0]?.updatedAt }]);
  assert.equal(store.getSecrets("actor-1", ["ollama"])[0]?.apiKey, "local-secret-token");
  assert.deepEqual(store.replaceBindings("actor-1", "conversation-a", [{ providerId: "ollama", model: "qwen3:4b" }]).map(({ conversationId, providerId, model }) => ({ conversationId, model, providerId })), [{ conversationId: "conversation-a", model: "qwen3:4b", providerId: "ollama" }]);
  assert.deepEqual(store.listBindings("actor-1", "conversation-b"), []);
  store.close();
  const database = new DatabaseSync(databasePath);
  assert.equal(Number((database.prepare("SELECT COUNT(*) AS count FROM codeloop_migrations").get() as { count: number }).count), 1);
  assert.equal((database.prepare("SELECT api_key_ciphertext FROM codeloop_provider_settings WHERE owner_id = ?").get("actor-1") as { api_key_ciphertext: string }).api_key_ciphertext.includes("local-secret-token"), false);
  database.close();
  rmSync(databasePath, { force: true });
});
