// Authenticated Upstream Gateway for Editor and Dev Previews
// Guards private upstream editor (ZVcode) and preview (Zbrowser/dev-server) entry points,
// enforcing server-resolved workspace membership, role headers, and read-only flags.

import http from 'node:http';

export class UpstreamGateway {
  #guard;
  #service;
  #editorUpstreamUrl;
  #previewUpstreamUrl;

  constructor({
    guard,
    service,
    editorUpstreamUrl = 'http://127.0.0.1:6305',
    previewUpstreamUrl = 'http://127.0.0.1:6155',
  }) {
    this.#guard = guard;
    this.#service = service;
    this.#editorUpstreamUrl = editorUpstreamUrl;
    this.#previewUpstreamUrl = previewUpstreamUrl;
  }

  get editorUpstreamUrl() {
    return this.#editorUpstreamUrl;
  }

  get previewUpstreamUrl() {
    return this.#previewUpstreamUrl;
  }

  // Extract token from Authorization header or URL query parameter (?token=...)
  extractToken(req, url) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const queryToken = url.searchParams.get('token');
    if (queryToken) {
      return queryToken.trim();
    }
    return null;
  }

  // Handle authenticated editor gateway request: /api/v1/zetro2/gateways/editor/:workspaceId/*
  async handleEditorRequest(req, res, { workspaceId, subPath = '/' }) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const token = this.extractToken(req, url);

    if (!token) {
      this.#sendJson(res, 401, { error: 'Authentication required for editor entry point' });
      return;
    }

    // Server-enforce workspace membership and workspace.read
    const auth = await this.#guard.authorizeRequest(token, {
      workspaceId,
      requiredCapability: 'workspace.read',
    });

    const isReadOnly = auth.role === 'Viewer' || auth.role === 'Reviewer';

    // Forward to private editor upstream
    await this.#proxyRequest(req, res, {
      upstreamBaseUrl: this.#editorUpstreamUrl,
      targetPath: subPath,
      injectedHeaders: {
        'x-zetro2-actor-id': auth.actorId,
        'x-zetro2-workspace-id': auth.workspaceId,
        'x-zetro2-role': auth.role,
        'x-zetro2-readonly': isReadOnly ? 'true' : 'false',
      },
    });
  }

  // Handle authenticated preview gateway request: /api/v1/zetro2/gateways/preview/:workspaceId/*
  async handlePreviewRequest(req, res, { workspaceId, subPath = '/' }) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const token = this.extractToken(req, url);

    if (!token) {
      this.#sendJson(res, 401, { error: 'Authentication required for preview entry point' });
      return;
    }

    // Server-enforce workspace membership and workspace.read
    const auth = await this.#guard.authorizeRequest(token, {
      workspaceId,
      requiredCapability: 'workspace.read',
    });

    // Forward to private preview upstream
    await this.#proxyRequest(req, res, {
      upstreamBaseUrl: this.#previewUpstreamUrl,
      targetPath: subPath,
      injectedHeaders: {
        'x-zetro2-actor-id': auth.actorId,
        'x-zetro2-workspace-id': auth.workspaceId,
        'x-zetro2-role': auth.role,
      },
    });
  }

  // Forward HTTP request to private upstream server
  async #proxyRequest(req, res, { upstreamBaseUrl, targetPath, injectedHeaders }) {
    try {
      const upstreamUrl = new URL(targetPath, upstreamBaseUrl);
      const originalUrl = new URL(req.url, 'http://127.0.0.1');

      // Forward search params except the auth token
      originalUrl.searchParams.forEach((val, key) => {
        if (key !== 'token') {
          upstreamUrl.searchParams.set(key, val);
        }
      });

      // Filter headers, strip untrusted client identity headers, and inject server verified headers
      const forwardedHeaders = { ...req.headers };
      delete forwardedHeaders['x-zetro2-actor-id'];
      delete forwardedHeaders['x-zetro2-workspace-id'];
      delete forwardedHeaders['x-zetro2-role'];
      delete forwardedHeaders['x-zetro2-readonly'];
      delete forwardedHeaders['host'];

      Object.assign(forwardedHeaders, injectedHeaders);

      const proxyReq = http.request(
        upstreamUrl,
        {
          method: req.method,
          headers: forwardedHeaders,
        },
        (upstreamRes) => {
          res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
          upstreamRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        this.#sendJson(res, 502, {
          error: 'Bad Gateway: Upstream service unavailable',
          details: err.message,
        });
      });

      req.pipe(proxyReq);
    } catch (err) {
      this.#sendJson(res, 500, {
        error: 'Internal Gateway Error',
        details: err.message,
      });
    }
  }

  #sendJson(res, statusCode, data) {
    if (res.headersSent) return;
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(JSON.stringify(data));
  }
}

export function createUpstreamGateway(options) {
  return new UpstreamGateway(options);
}
