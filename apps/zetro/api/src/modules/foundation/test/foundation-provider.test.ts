import assert from "node:assert/strict";
import test from "node:test";
import { ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "@codexsun/platform-core";
import { ZetroFoundationProvider } from "../provider.js";

test("registers the Zetro foundation through the shared framework", () => {
  const engine = new ProviderEngine();
  engine.register(new PlatformProvider());
  engine.register(new ZetroFoundationProvider());

  engine.start();
  assert.equal(engine.require<{ name: string }>("zetro.foundation").name, "Zetro Foundation");
  engine.stop();
});
