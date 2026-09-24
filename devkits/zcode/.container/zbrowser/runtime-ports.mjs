import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

function environment(path) {
  return existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {};
}

export function configuredPort(root, owner, host) {
  if (!host) return null;
  const directory = join(root, owner, host.environmentDirectory);
  const localPath = join(directory, '.app.env');
  const local = environment(existsSync(localPath) ? localPath : `${localPath}.example`);
  const shared = environment(join(root, '.env'));
  const value = local[host.envKey] ?? shared[host.envKey] ?? host.defaultPort;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}
