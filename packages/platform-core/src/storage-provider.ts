import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

export type StorageVisibility = "private" | "public";

export class StorageProvider {
  constructor(private readonly root: string) {}

  forModule(application: string, module: string): ModuleStorage {
    return new ModuleStorage(
      this.root,
      validateNamespace(application, "application"),
      validateNamespace(module, "module"),
    );
  }
}

export class ModuleStorage {
  constructor(
    private readonly root: string,
    private readonly application: string,
    private readonly module: string,
  ) {}

  async write(visibility: StorageVisibility, filename: string, contents: string | Uint8Array): Promise<void> {
    const target = this.pathFor(visibility, filename);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, contents);
  }

  async read(visibility: StorageVisibility, filename: string): Promise<Buffer> {
    return readFile(this.pathFor(visibility, filename));
  }

  pathFor(visibility: StorageVisibility, filename: string): string {
    if (visibility !== "private" && visibility !== "public") throw new Error("Storage visibility is invalid.");
    const namespace = resolve(this.root, visibility, this.application, this.module);
    const target = resolve(namespace, filename);
    const path = relative(namespace, target);
    if (path === "" || path === ".." || path.startsWith(`..${sep}`) || path.includes(`${sep}..${sep}`)) {
      throw new Error("Storage path leaves the module namespace.");
    }
    return target;
  }
}

function validateNamespace(value: string, label: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) throw new Error(`Storage ${label} must be lowercase kebab-case.`);
  return value;
}
