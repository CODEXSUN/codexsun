import { createServer } from 'node:http';

// Bootstrap health only. Authenticated application routes belong to later phases.
export function createApp() {
  return createServer((request, response) => {
    const health = request.method === 'GET' && request.url === '/api/v1/zetro2/health';
    response.writeHead(health ? 200 : 404, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(JSON.stringify(health
      ? { application: 'zetro2', status: 'ok', stage: 'development-bootstrap' }
      : { error: 'Not found' }));
  });
}
