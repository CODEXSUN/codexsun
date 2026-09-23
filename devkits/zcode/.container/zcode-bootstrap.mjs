import { randomBytes } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export async function bootstrapWorkspace(root) {
  const workspace = realpathSync(root);
  const { loadRegistry, applicationPath } = await import(
    pathToFileURL(join(workspace, 'packages/app-cli/src/registry.mjs')).href
  );
  const templates = [join(workspace, '.env.example')];
  for (const app of loadRegistry(workspace).applications) {
    const owner = applicationPath(workspace, app);
    for (const host of app.hosts) {
      const template = join(owner, host.environmentDirectory, '.app.env.example');
      if (existsSync(template)) templates.push(template);
    }
  }
  return bootstrapFiles(workspace, [...new Set(templates)]);
}

export function bootstrapFiles(root, templates) {
  const workspace = realpathSync(root);
  const created = [];
  const skipped = [];
  const rootEnv = join(workspace, '.env');
  const rootTemplate = join(workspace, '.env.example');
  const ordered = [...templates].sort((a, b) => Number(b === rootTemplate) - Number(a === rootTemplate));
  const sharedKeys = readExistingSharedKeys(workspace, ordered);

  for (const template of ordered) {
    const destination = template.slice(0, -'.example'.length);
    assertInside(workspace, template);
    assertInside(workspace, dirname(destination));
    if (!template.endsWith('.env.example') || !lstatSync(template).isFile()) {
      throw new Error(`Invalid environment template: ${template}`);
    }
    const existing = lstatSync(destination, { throwIfNoEntry: false });
    if (existing) {
      if (!existing.isFile()) throw new Error(`Invalid environment file: ${destination}`);
      skipped.push(relative(workspace, destination));
      continue;
    }

    const rootSecret = existsSync(rootEnv) ? readValue(readFileSync(rootEnv, 'utf8'), 'PLATFORM_JWT_SECRET') : '';
    const content = prepareEnvironment(readFileSync(template, 'utf8'), template === rootTemplate, rootSecret, sharedKeys);
    try {
      writeFileSync(destination, content, { flag: 'wx', mode: 0o600 });
      created.push(relative(workspace, destination));
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (!lstatSync(destination).isFile()) throw new Error(`Invalid environment file: ${destination}`);
      skipped.push(relative(workspace, destination));
    }
  }
  return { created, skipped };
}

function readExistingSharedKeys(workspace, templates) {
  const shared = new Map();
  for (const template of templates) {
    const destination = template.slice(0, -'.example'.length);
    assertInside(workspace, template);
    assertInside(workspace, dirname(destination));
    const existing = lstatSync(destination, { throwIfNoEntry: false });
    if (!existing) continue;
    if (!existing.isFile()) throw new Error(`Invalid environment file: ${destination}`);
    const values = new Map(readFileSync(destination, 'utf8').split(/\r?\n/u)
      .map((line) => /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line))
      .filter(Boolean).map(([, key, value]) => [key, value]));
    for (const line of readFileSync(template, 'utf8').split(/\r?\n/u)) {
      const match = /^([A-Z][A-Z0-9_]*_KEY)=(.*)$/u.exec(line);
      if (!match || !isPlaceholder(match[2])) continue;
      const value = values.get(match[1]);
      if (!value || isPlaceholder(value)) continue;
      const prior = shared.get(match[2]);
      if (prior && prior !== value) throw new Error(`Conflicting existing shared key: ${match[1]}`);
      shared.set(match[2], value);
    }
  }
  return shared;
}

function prepareEnvironment(template, isRoot, rootSecret, sharedKeys) {
  const secret = rootSecret && !isPlaceholder(rootSecret) ? rootSecret : randomSecret();
  const lines = template.split(/\r?\n/u).map((line) => {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line);
    if (!match) return line;
    const [, key, value] = match;
    if (key === 'PLATFORM_JWT_SECRET') return `${key}=${secret}`;
    if (key.endsWith('_KEY') && isPlaceholder(value)) {
      if (!sharedKeys.has(value)) sharedKeys.set(value, randomSecret());
      return `${key}=${sharedKeys.get(value)}`;
    }
    if (key.endsWith('_API_REFERENCE_TOKEN') && isPlaceholder(value)) return `${key}=${randomSecret()}`;
    if (key.endsWith('_PASSWORD') && isPlaceholder(value) && !key.startsWith('DB_') && !key.startsWith('MARIADB_')) {
      return `${key}=${randomSecret()}`;
    }
    if (isRoot && key === 'DB_DRIVER') return 'DB_DRIVER=sqlite';
    if (isRoot && (key.startsWith('DB_') || key.startsWith('MARIADB_')) && isPlaceholder(value)) {
      return `${key}=`;
    }
    return line;
  });
  return lines.join('\n');
}

function readValue(content, key) {
  return content.split(/\r?\n/u).find((line) => line.startsWith(`${key}=`))?.slice(key.length + 1) ?? '';
}

function isPlaceholder(value) {
  return /^(change[-_]|replace-with-)/u.test(value);
}

function randomSecret() {
  return randomBytes(32).toString('hex');
}

function assertInside(root, path) {
  const resolved = realpathSync(path);
  const outside = relative(root, resolved);
  if (isAbsolute(outside) || outside === '..' || outside.startsWith(`..${sep}`)) {
    throw new Error(`Environment path is outside the workspace: ${path}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const workspace = process.argv[2];
  if (!workspace) throw new Error('Pass the workspace directory to Zcode bootstrap.');
  const result = await bootstrapWorkspace(workspace);
  console.log(`Zcode environment ready: ${result.created.length} created, ${result.skipped.length} preserved.`);
}
