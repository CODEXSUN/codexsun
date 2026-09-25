// Workspace Access HTTP Request Router
// Routes incoming requests for authentication, session verification, workspace selection,
// server-resolved membership authorization, authorized event subscriptions,
// private upstream gateways (editor & dev preview), action approvals,
// and run cancellation hooks.

import { createWorkspaceAuthorizationGuard } from './authorization-guard.mjs';
import { createEventSubscriptionHub } from './event-subscription-hub.mjs';
import { createUpstreamGateway } from './upstream-gateway.mjs';
import { createApprovalBindingManager } from './approval-binding-manager.mjs';
import { createRunCancellationCoordinator } from './run-cancellation-coordinator.mjs';

let defaultGuard = null;
let defaultHub = null;
let defaultGateway = null;
let defaultApprovalManager = null;
let defaultCancellationCoordinator = null;

export async function handleWorkspaceAccessRequest(service, req, res, options = {}) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = url.pathname;
  const method = req.method;

  const guard =
    options.guard ||
    (defaultGuard && defaultGuard.service === service
      ? defaultGuard
      : (defaultGuard = createWorkspaceAuthorizationGuard({ service })));

  const subscriptionHub =
    options.subscriptionHub ||
    defaultHub ||
    (defaultHub = createEventSubscriptionHub({ guard }));

  const gateway =
    options.gateway ||
    (defaultGateway && defaultGateway.service === service
      ? defaultGateway
      : (defaultGateway = createUpstreamGateway({
          guard,
          service,
          editorUpstreamUrl: options.editorUpstreamUrl,
          previewUpstreamUrl: options.previewUpstreamUrl,
        })));

  const approvalManager =
    options.approvalManager ||
    (defaultApprovalManager && defaultApprovalManager.store === service.store
      ? defaultApprovalManager
      : (defaultApprovalManager = createApprovalBindingManager({
          store: service.store,
          clock: service.clock,
        })));

  const cancellationCoordinator =
    options.cancellationCoordinator ||
    (defaultCancellationCoordinator &&
    defaultCancellationCoordinator.store === service.store
      ? defaultCancellationCoordinator
      : (defaultCancellationCoordinator = createRunCancellationCoordinator({
          store: service.store,
        })));

  // Extract Bearer token if present
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // Helper to read JSON body
  const readJsonBody = async () => {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        if (!data) return resolve({});
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Invalid JSON payload'));
        }
      });
      req.on('error', reject);
    });
  };

  const sendJson = (statusCode, payload) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(JSON.stringify(payload));
  };

  try {
    // 1. POST /api/v1/zetro2/auth/login
    if (method === 'POST' && pathname === '/api/v1/zetro2/auth/login') {
      const body = await readJsonBody();
      const result = await service.login(body);
      return sendJson(200, result);
    }

    // 2. POST /api/v1/zetro2/auth/logout
    if (method === 'POST' && pathname === '/api/v1/zetro2/auth/logout') {
      const body = await readJsonBody();
      let sessionId = body.sessionId;
      let actorId = body.actorId;

      if (!sessionId && token) {
        try {
          const auth = await service.authenticateToken(token);
          sessionId = auth.session.id;
          actorId = auth.actor.id;
        } catch (_) {
          // Token may already be invalid
        }
      }

      const result = await service.logout({ sessionId, actorId });
      subscriptionHub.revokeSubscriptionsForSession(sessionId);
      await cancellationCoordinator.cancelRunsForSession(sessionId, {
        reason: 'session_logout',
        cancelledBy: actorId || 'user',
      });
      return sendJson(200, result);
    }

    // 3. GET /api/v1/zetro2/auth/me
    if (method === 'GET' && pathname === '/api/v1/zetro2/auth/me') {
      if (!token) {
        return sendJson(401, { error: 'Authentication required' });
      }
      const auth = await service.authenticateToken(token);
      return sendJson(200, auth);
    }

    // 4. POST /api/v1/zetro2/auth/select-workspace
    if (method === 'POST' && pathname === '/api/v1/zetro2/auth/select-workspace') {
      if (!token) {
        return sendJson(401, { error: 'Authentication required' });
      }
      const auth = await service.authenticateToken(token);
      const body = await readJsonBody();
      const result = await service.selectWorkspace({
        actorId: auth.actor.id,
        currentSessionId: auth.session.id,
        targetWorkspaceId: body.workspaceId,
        ttlSeconds: body.ttlSeconds,
      });
      return sendJson(200, result);
    }

    // 5. GET /api/v1/zetro2/workspaces
    if (method === 'GET' && pathname === '/api/v1/zetro2/workspaces') {
      if (!token) {
        return sendJson(401, { error: 'Authentication required' });
      }
      const auth = await service.authenticateToken(token);
      const workspaces = await service.listUserWorkspaces(auth.actor.id);
      return sendJson(200, { workspaces });
    }

    // 6. POST /api/v1/zetro2/workspaces
    if (method === 'POST' && pathname === '/api/v1/zetro2/workspaces') {
      if (!token) {
        return sendJson(401, { error: 'Authentication required' });
      }
      const auth = await service.authenticateToken(token);
      const body = await readJsonBody();
      const result = await service.createWorkspace({
        actorId: auth.actor.id,
        slug: body.slug,
        name: body.name,
        description: body.description,
        rootPath: body.rootPath,
      });
      return sendJson(201, result);
    }

    // 7. /api/v1/zetro2/workspaces/:workspaceId/members
    const membersListMatch = pathname.match(/^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/members$/);
    if (membersListMatch) {
      const workspaceId = membersListMatch[1];
      if (method === 'GET') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.read',
        });
        const members = await service.listMembers({ actorId: auth.actorId, workspaceId });
        return sendJson(200, { members });
      }

      if (method === 'POST') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'membership.manage',
        });
        const body = await readJsonBody();
        const member = await service.addMember({
          actorId: auth.actorId,
          workspaceId,
          targetUserId: body.userId,
          role: body.role,
        });
        return sendJson(201, { member });
      }
    }

    // 8. /api/v1/zetro2/workspaces/:workspaceId/members/:userId
    const singleMemberMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/members\/([^/]+)$/
    );
    if (singleMemberMatch) {
      const workspaceId = singleMemberMatch[1];
      const targetUserId = singleMemberMatch[2];

      if (method === 'PUT') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'membership.manage',
        });
        const body = await readJsonBody();
        const updated = await service.updateMemberRole({
          actorId: auth.actorId,
          workspaceId,
          targetUserId,
          newRole: body.role,
        });
        return sendJson(200, { member: updated });
      }

      if (method === 'DELETE') {
        const auth = await service.authenticateToken(token);
        const result = await service.removeMember({
          actorId: auth.actor.id,
          workspaceId,
          targetUserId,
        });
        await cancellationCoordinator.cancelRunsForActor(targetUserId, {
          workspaceId,
          reason: 'membership_removed',
          cancelledBy: auth.actor.id,
        });
        return sendJson(200, result);
      }
    }

    // 9. /api/v1/zetro2/workspaces/:workspaceId/resources/:resourceKey
    const resourceMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/resources\/([^/]+)$/
    );
    if (resourceMatch) {
      const workspaceId = resourceMatch[1];
      const resourceKey = resourceMatch[2];

      if (method === 'GET') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.read',
        });
        return sendJson(200, {
          resourceKey,
          workspaceId,
          role: auth.role,
          data: { status: 'available', accessedBy: auth.actorId },
        });
      }

      if (method === 'POST' || method === 'PUT') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.write',
        });
        const body = await readJsonBody();
        return sendJson(200, {
          resourceKey,
          workspaceId,
          writtenBy: auth.actorId,
          payload: body,
        });
      }
    }

    // 10. /api/v1/zetro2/workspaces/:workspaceId/events
    const eventsMatch = pathname.match(/^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/events$/);
    if (eventsMatch) {
      const workspaceId = eventsMatch[1];
      const channel = `workspace:${workspaceId}:events`;

      if (method === 'GET') {
        const auth = await guard.authorizeSubscription(token, channel);

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        res.write(
          `data: ${JSON.stringify({ event: 'connected', channel, actorId: auth.actorId })}\n\n`
        );

        const sub = await subscriptionHub.subscribe({
          token,
          channel,
          listener: (evt) => {
            res.write(`data: ${JSON.stringify(evt)}\n\n`);
          },
        });

        req.on('close', () => {
          sub.unsubscribe();
        });

        return;
      }

      if (method === 'POST') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.write',
        });
        const body = await readJsonBody();
        const delivered = subscriptionHub.publish(channel, {
          ...body,
          publishedBy: auth.actorId,
          timestamp: Date.now(),
        });
        return sendJson(200, { published: true, channel, delivered });
      }
    }

    // 11. /api/v1/zetro2/gateways/editor/:workspaceId(/*)?
    const editorGatewayMatch = pathname.match(
      /^\/api\/v1\/zetro2\/gateways\/editor\/([^/]+)(\/.*)?$/
    );
    if (editorGatewayMatch) {
      const workspaceId = editorGatewayMatch[1];
      const subPath = editorGatewayMatch[2] || '/';
      await gateway.handleEditorRequest(req, res, { workspaceId, subPath });
      return;
    }

    // 12. /api/v1/zetro2/gateways/preview/:workspaceId(/*)?
    const previewGatewayMatch = pathname.match(
      /^\/api\/v1\/zetro2\/gateways\/preview\/([^/]+)(\/.*)?$/
    );
    if (previewGatewayMatch) {
      const workspaceId = previewGatewayMatch[1];
      const subPath = previewGatewayMatch[2] || '/';
      await gateway.handlePreviewRequest(req, res, { workspaceId, subPath });
      return;
    }

    // 13. /api/v1/zetro2/workspaces/:workspaceId/approvals
    const approvalsListMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/approvals$/
    );
    if (approvalsListMatch) {
      const workspaceId = approvalsListMatch[1];

      if (method === 'GET') {
        await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.read',
        });
        const approvals = await service.store.repository.listApprovalsByWorkspace(workspaceId);
        return sendJson(200, { approvals });
      }

      if (method === 'POST') {
        const auth = await guard.authorizeRequest(token, {
          workspaceId,
          requiredCapability: 'workspace.write',
        });
        const body = await readJsonBody();
        const approval = await approvalManager.requestApproval({
          workspaceId,
          actorId: auth.actorId,
          action: body.action,
          targetResource: body.targetResource,
          content: body.content,
          contentDigest: body.contentDigest,
          ttlSeconds: body.ttlSeconds,
        });
        return sendJson(201, { approval });
      }
    }

    // 14. /api/v1/zetro2/workspaces/:workspaceId/approvals/:approvalId/decision
    const approvalDecisionMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/approvals\/([^/]+)\/decision$/
    );
    if (approvalDecisionMatch && method === 'POST') {
      const workspaceId = approvalDecisionMatch[1];
      const approvalId = approvalDecisionMatch[2];

      const auth = await guard.authorizeRequest(token, {
        workspaceId,
        requiredCapability: 'change.approve',
      });
      const body = await readJsonBody();
      const updated = await approvalManager.decideApproval({
        approvalId,
        approverId: auth.actorId,
        decision: body.decision,
        rejectionReason: body.rejectionReason,
      });
      return sendJson(200, { approval: updated });
    }

    // 15. /api/v1/zetro2/workspaces/:workspaceId/approvals/:approvalId/verify
    const approvalVerifyMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/approvals\/([^/]+)\/verify$/
    );
    if (approvalVerifyMatch && method === 'POST') {
      const workspaceId = approvalVerifyMatch[1];
      const approvalId = approvalVerifyMatch[2];

      const auth = await guard.authorizeRequest(token, { workspaceId });
      const body = await readJsonBody();
      const result = await approvalManager.verifyAndConsumeApproval({
        approvalId,
        actorId: auth.actorId,
        workspaceId,
        action: body.action,
        targetResource: body.targetResource,
        content: body.content,
        contentDigest: body.contentDigest,
      });
      return sendJson(200, result);
    }

    // 16. /api/v1/zetro2/workspaces/:workspaceId/runs
    const runsListMatch = pathname.match(/^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/runs$/);
    if (runsListMatch && method === 'GET') {
      const workspaceId = runsListMatch[1];
      await guard.authorizeRequest(token, {
        workspaceId,
        requiredCapability: 'workspace.read',
      });
      const runs = cancellationCoordinator.listActiveRuns({ workspaceId });
      return sendJson(200, { runs });
    }

    // 17. /api/v1/zetro2/workspaces/:workspaceId/runs/:runId/cancel
    const runCancelMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/runs\/([^/]+)\/cancel$/
    );
    if (runCancelMatch && method === 'POST') {
      const workspaceId = runCancelMatch[1];
      const runId = runCancelMatch[2];
      const auth = await guard.authorizeRequest(token, {
        workspaceId,
        requiredCapability: 'workspace.write',
      });
      const body = await readJsonBody();
      const result = await cancellationCoordinator.cancelRun(runId, {
        reason: body.reason || 'user_cancelled',
        cancelledBy: auth.actorId,
      });
      return sendJson(200, result);
    }

    // 18. /api/v1/zetro2/workspaces/:workspaceId/audit-logs
    const auditLogsMatch = pathname.match(
      /^\/api\/v1\/zetro2\/workspaces\/([^/]+)\/audit-logs$/
    );
    if (auditLogsMatch && method === 'GET') {
      const workspaceId = auditLogsMatch[1];
      await guard.authorizeRequest(token, {
        workspaceId,
        requiredCapability: 'workspace.admin',
      });
      const actorId = url.searchParams.get('actorId') || undefined;
      const action = url.searchParams.get('action') || undefined;
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const auditLogs = await service.store.repository.listAuditLogs({
        workspaceId,
        actorId,
        action,
        limit,
      });
      return sendJson(200, { auditLogs });
    }

    // If route didn't match any of the above, return null to let downstream handlers proceed
    return null;
  } catch (error) {
    const status = error.statusCode || 400;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (
      status === 401 ||
      msg.includes('Authentication required') ||
      msg.includes('expired') ||
      msg.includes('revoked') ||
      msg.includes('token')
    ) {
      return sendJson(401, { error: msg });
    }
    if (
      status === 403 ||
      msg.includes('Forbidden') ||
      msg.includes('lacks required capability') ||
      msg.includes('lacks capability') ||
      msg.includes('does not hold membership') ||
      msg.includes('cannot manage') ||
      msg.includes('cannot assign') ||
      msg.includes('Cross-workspace') ||
      msg.includes('Actor substitution')
    ) {
      return sendJson(403, { error: msg });
    }
    if (status === 404 || msg.includes('not found') || msg.includes('does not exist')) {
      return sendJson(404, { error: msg });
    }
    return sendJson(status, { error: msg });
  }
}
