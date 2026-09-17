import assert from "node:assert/strict";
import test from "node:test";

test("keeps the mobile host free of desktop-native imports", async () => {
  const source = await import("node:fs/promises").then((filesystem) =>
    filesystem.readFile(new URL("../app.tsx", import.meta.url), "utf8"),
  );
  assert.match(source, /@codexsun\/contracts/u);
  assert.doesNotMatch(source, /@tauri-apps|desktop-runtime|node:/u);
});
