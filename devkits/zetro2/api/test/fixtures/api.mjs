// In-process HTTP API fixture for Zetro2 integration testing
import { once } from 'node:events';
import { createApp } from '../../src/app.mjs';

export async function createTestApiFixture(appFactory = createApp) {
  const server = appFactory().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;

  async function request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${origin}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    let json = null;
    try {
      json = await response.json();
    } catch {
      // not json
    }

    return {
      status: response.status,
      headers: response.headers,
      body: json,
      raw: response,
    };
  }

  return {
    server,
    port,
    origin,
    get: (path, headers) => request(path, { method: 'GET', headers }),
    post: (path, body, headers) => request(path, { method: 'POST', body, headers }),
    put: (path, body, headers) => request(path, { method: 'PUT', body, headers }),
    delete: (path, headers) => request(path, { method: 'DELETE', headers }),
    async close() {
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
