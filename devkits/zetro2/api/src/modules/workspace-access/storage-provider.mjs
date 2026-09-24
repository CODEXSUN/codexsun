// Zetro2 Storage Provider
// Manages application storage under storage/apps/private/zetro2/ adhering to repository architecture rules

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export class ZetroStorageProvider {
  #repoRoot;
  #storageRoot;

  constructor(repoRoot = process.cwd(), storageSubdir = 'storage/apps/private/zetro2') {
    this.#repoRoot = resolve(repoRoot);
    this.#storageRoot = resolve(this.#repoRoot, storageSubdir);
    // Ensure initial storage directory exists
    mkdirSync(this.#storageRoot, { recursive: true });
  }

  get storageRoot() {
    return this.#storageRoot;
  }

  resolvePath(subpath = '') {
    const fullPath = resolve(this.#storageRoot, subpath);
    // Verify boundary invariant: must not escape storage root
    const rel = relative(this.#storageRoot, fullPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`Security Violation: Path "${subpath}" escapes Zetro2 storage root`);
    }
    return fullPath;
  }

  ensureDirectory(subpath = '') {
    const dir = this.resolvePath(subpath);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  exists(subpath) {
    return existsSync(this.resolvePath(subpath));
  }

  readFile(subpath, encoding = 'utf8') {
    return readFileSync(this.resolvePath(subpath), encoding);
  }

  writeFile(subpath, content, encoding = 'utf8') {
    const target = this.resolvePath(subpath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, encoding);
    return target;
  }

  getDatabasePath() {
    return this.resolvePath('database.sqlite');
  }

  getSessionCachePath() {
    return this.ensureDirectory('sessions');
  }

  getMemoryBankPath() {
    return this.ensureDirectory('memory-bank');
  }

  toJSON() {
    return {
      provider: 'ZetroStorageProvider',
      storageRoot: this.#storageRoot,
    };
  }
}

export function createStorageProvider(repoRoot = process.cwd(), storageSubdir = 'storage/apps/private/zetro2') {
  return new ZetroStorageProvider(repoRoot, storageSubdir);
}
