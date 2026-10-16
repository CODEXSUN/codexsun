import { existsSync, lstatSync, mkdirSync, realpathSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { platform } from "node:os";

export function prepareMobileOutput(root, app) {
  const appRoot = join(root, "apps", app, "mobile");
  const output = join(root, "dist", "apps", app, "mobile");
  const cache = join(root, "dist", ".cache", "mobile", app);
  for (const [source, target] of [
    [join(appRoot, "build"), output],
    [join(appRoot, ".dart_tool"), join(cache, "dart-tool")],
    [join(appRoot, "android", ".gradle"), join(cache, "android-gradle")]
  ]) {
    mkdirSync(target, { recursive: true });
    if (!existsSync(source))
      symlinkSync(target, source, platform() === "win32" ? "junction" : "dir");
    if (!lstatSync(source).isSymbolicLink() || realpathSync(source) !== realpathSync(target))
      throw new Error(`Generated path must point into root dist: ${source}`);
  }
  const temporary = join(root, "dist", ".tmp", "mobile", app);
  mkdirSync(temporary, { recursive: true });
  return {
    PUB_CACHE: join(root, "dist", ".cache", "pub"),
    GRADLE_USER_HOME: join(root, "dist", ".cache", "gradle"),
    TEMP: temporary,
    TMP: temporary,
    TMPDIR: temporary
  };
}
