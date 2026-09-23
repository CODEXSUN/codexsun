import assert from "node:assert/strict";
import test from "node:test";

test("keeps the desktop runtime contract free of native file or shell capabilities", async () => {
  const source = await import("node:fs/promises").then((filesystem) =>
    filesystem.readFile(new URL("../desktop-runtime.ts", import.meta.url), "utf8"),
  );
  assert.match(source, /desktop_runtime/u);
  assert.doesNotMatch(source, /fs|shell|command/iu);
});
