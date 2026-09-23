import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const FIRST_APP_PORT = 6140;
const LAST_APP_PORT = 6148;

export async function loadPreviewCatalog(root, uiuxPort = 6133) {
  const registryModule = pathToFileURL(join(root, 'packages/app-cli/src/registry.mjs'));
  const { loadRegistry, applicationPath } = await import(registryModule.href);
  const rootPath = realpathSync(root);
  const applications = loadRegistry(rootPath).applications
    .filter((app) => app.owner.startsWith('apps/') || app.owner.startsWith('devkits/'))
    .sort((a, b) => groupOrder(a) - groupOrder(b) || a.id.localeCompare(b.id));

  if (!Number.isInteger(uiuxPort) || uiuxPort < 1 || uiuxPort > 65535 ||
      (uiuxPort >= FIRST_APP_PORT && uiuxPort <= LAST_APP_PORT)) {
    throw new Error('Zbrowser UIUX port is invalid or reserved for other previews.');
  }

  let nextPort = FIRST_APP_PORT;
  return applications.map((app) => {
    const web = app.hosts.find((host) => host.kind === 'web');
    const port = web ? (app.id === 'uiux' ? uiuxPort : nextPort++) : null;
    if (nextPort > LAST_APP_PORT + 1) throw new Error('Zbrowser preview port capacity exceeded.');
    const directory = web ? verifyWorkspace(rootPath, applicationPath(rootPath, app), web) : null;
    return {
      id: app.id,
      label: app.label,
      group: app.owner.startsWith('apps/') ? 'apps' : 'devkits',
      hasApi: app.hosts.some((host) => host.kind === 'api'),
      localUrlKey: app.mdi?.localUrlKey ?? null,
      workspace: web?.workspace ?? null,
      directory,
      port,
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
