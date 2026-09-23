import { createServer } from 'node:http';
import { loadPreviewCatalog } from './catalog.mjs';
import { PreviewError, PreviewRunner } from './runner.mjs';

const root = process.env.ZBROWSER_WORKSPACE ?? '/workspace/codexsun';
const uiuxPort = Number(process.env.ZBROWSER_UIUX_PORT ?? '6133');
const catalog = await loadPreviewCatalog(root, uiuxPort);
const runner = new PreviewRunner(root, catalog);

const server = createServer(async (request, response) => {
  try {
    const route = new URL(request.url, 'http://zbrowser').pathname;
    if (request.method === 'GET' && route === '/health') return send(response, 200, { healthy: true });
    if (request.method === 'GET' && route === '/targets') {
      return send(response, 200, { targets: await runner.statuses() });
    }

    const action = /^\/targets\/([a-z][a-z0-9-]*)\/(start|stop)$/u.exec(route);
    if (request.method !== 'POST' || !action) throw new PreviewError(404, 'Unknown Zbrowser action.');
    request.resume();
    if (action[2] === 'start') runner.start(action[1]);
    else runner.stop(action[1]);
    return send(response, 200, { targets: await runner.statuses() });
  } catch (error) {
    const status = error instanceof PreviewError ? error.status : 500;
    if (status === 500) console.error(error);
    send(response, status, { error: status === 500 ? 'Zbrowser request failed.' : error.message });
  }
});

server.listen(3001, '0.0.0.0', () => {
  console.log(`Zbrowser ready: ${catalog.length} registered apps and devkits`);
  runner.start('uiux');
});

process.on('SIGTERM', () => {
  runner.shutdown();
  server.close();
});

function send(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}
