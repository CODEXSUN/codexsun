import { createServer } from 'node:http';
import { handleWorkspaceAccessRequest } from './modules/workspace-access/index.mjs';

export function createApp(options = {}) {
  const accessService = options.accessService || null;

  return createServer(async (request, response) => {
    // 1. Health check
    if (request.method === 'GET' && request.url === '/api/v1/zetro2/health') {
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return response.end(
        JSON.stringify({
          application: 'zetro2',
          status: 'ok',
          stage: 'development-bootstrap',
        })
      );
    }

    // 2. Workspace access & auth routes (if accessService configured)
    if (accessService && request.url?.startsWith('/api/v1/zetro2/')) {
      const handled = await handleWorkspaceAccessRequest(
        accessService,
        request,
        response,
        options
      );
      if (handled !== null) {
        return;
      }
    }

    // 3. Fallback for unfinished application routes
    response.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(JSON.stringify({ error: 'Not found' }));
  });
}
