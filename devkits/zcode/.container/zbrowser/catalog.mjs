import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { configuredPort } from './runtime-ports.mjs';

const FIRST_APP_PORT = 6140;
const LAST_APP_PORT = 6148;
const reservedPorts = JSON.parse(readFileSync(new URL('./preview-ports.json', import.meta.url), 'utf8'));

export function reservedPreviewPort(id, uiuxPort = 6133) {
  if (id === 'uiux') return uiuxPort;
  if (!Object.hasOwn(reservedPorts, id)) {
    throw new Error(`Reserve a Zbrowser port for ${id} in preview-ports.json and publish it in Compose before starting previews.`);
  }
  return reservedPorts[id];
}

export async function loadPreviewCatalog(
  root,
  uiuxPort = 6133,
  publicPorts = Array.from({ length: 9 }, (_, index) => FIRST_APP_PORT + index),
  zetro2PublicPort = 6155,
) {
  const registryModule = pathToFileURL(join(root, 'packages/app-cli/src/registry.mjs'));
  const { loadRegistry, applicationPath } = await import(registryModule.href);
  const rootPath = realpathSync(root);
  const applications = loadRegistry(rootPath).applications
    .filter((app) => app.owner.startsWith('apps/') || app.owner.startsWith('devkits/'))
    .sort((a, b) => groupOrder(a) - groupOrder(b) || a.id.localeCompare(b.id));

  if (!Number.isInteger(uiuxPort) || uiuxPort < 1 || uiuxPort > 65535 ||
      Object.values(reservedPorts).includes(uiuxPort)) {
    throw new Error('Zbrowser UIUX port is invalid or reserved for other previews.');
  }
  const publishedPorts = [...publicPorts, zetro2PublicPort];
  if (publicPorts.length !== 9 || new Set(publishedPorts).size !== 10 ||
      publishedPorts.some((port) => !Number.isInteger(port) || port < 1 || port > 65535 || port === uiuxPort)) {
    throw new Error('Zbrowser public preview ports must be unique and different from the UIUX port.');
  }

  const reservations = Object.values(reservedPorts);
  if (new Set(reservations).size !== reservations.length ||
      reservations.some((port) => !Number.isInteger(port) ||
        !((port >= FIRST_APP_PORT && port <= LAST_APP_PORT) || port === 6155))) {
    throw new Error('Reserved Zbrowser ports must be unique and within the published preview range.');
  }
  return applications.map((app) => {
    const web = app.hosts.find((host) => host.kind === 'web');
    const api = app.hosts.find((host) => host.kind === 'api');
    const port = web ? reservedPreviewPort(app.id, uiuxPort) : null;
    const directory = web ? verifyWorkspace(rootPath, applicationPath(rootPath, app), web) : null;
    return {
      id: app.id,
      label: app.label,
      group: app.owner.startsWith('apps/') ? 'apps' : 'devkits',
      hasApi: app.hosts.some((host) => host.kind === 'api'),
      apiPort: configuredPort(rootPath, app.owner, api),
      webPort: configuredPort(rootPath, app.owner, web),
      localUrlKey: app.mdi?.localUrlKey ?? null,
      workspace: web?.workspace ?? null,
      directory,
      port,
      publicPort: port === null ? null : app.id === 'uiux' ? uiuxPort :
        app.id === 'zetro2' ? zetro2PublicPort : publicPorts[port - FIRST_APP_PORT],
    };
  });
}

function groupOrder(app) {
  return app.owner.startsWith('apps/') ? 0 : 1;
}

function verifyWorkspace(root, owner, host) {
  const directory = realpathSync(join(owner, host.environmentDirectory));
  const outside = relative(root, directory);
  if (!outside || isAbsolute(outside) || outside === '..' || outside.startsWith(`..${sep}`)) {
    throw new Error(`Preview workspace is outside the repository: ${host.target}`);
  }
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  if (pkg.name !== host.workspace || typeof pkg.scripts?.dev !== 'string') {
    throw new Error(`Preview workspace is not a runnable registered web host: ${host.target}`);
  }
  return directory;
}
