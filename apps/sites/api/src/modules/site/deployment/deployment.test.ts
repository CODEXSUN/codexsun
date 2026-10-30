import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { DeploymentService } from "./deployment.service.js";
import { DeploymentRepository } from "./deployment.repository.js";
import { registerDeploymentRoutes } from "./deployment.routes.js";
import { AppError } from "@codexsun/framework/errors";
import type { DeploymentRow, DeploymentSnapshot } from "./deployment.types.js";
test("publish delivery keeps one version per saved revision and retains the last live version", async () => {
  const old = { ...process.env };
  Object.assign(process.env, {
    CODEXSUN_SITES_TIRUPURCONNECT_TENANT_ID: "test-tenant",
    CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID: "e303865e",
    CODEXSUN_SITES_PUBLISH_SECRET: "test-secret"
  });
  const rows: DeploymentRow[] = [];
  let exports = 0;
  let queues = 0;
  const repository = {
    revision: async (siteId: number, revision: number) =>
      rows.find((row) => row.site_id === siteId && row.page_revision === revision),
    create: async (siteId: number, revision: number, snapshot: DeploymentSnapshot) => {
      const row = {
        id: 1,
        uuid: "12345678",
        site_id: siteId,
        page_revision: revision,
        sequence: snapshot.sequence,
        checksum: snapshot.checksum,
        snapshot_json: "{}",
        status: "queued",
        actor: "editor",
        attempts: 0,
        error_message: "",
        created_at: "now",
        updated_at: "now",
        deployed_at: null
      } as DeploymentRow;
      rows.push(row);
      return row;
    },
    list: async () => rows,
    lastLive: async () => rows.find((row) => row.status === "live"),
    mark: async (uuid: string, status: DeploymentRow["status"], error: string) => {
      Object.assign(
        rows.find((row) => row.uuid === uuid)!,
        { status, error_message: error }
      );
    }
  };
  const scope = {
    siteId: 1,
    siteUuid: "e303865e",
    siteSlug: "tirupurconnect",
    domain: "tirupurconnect.com",
    tenantId: "test-tenant",
    actor: "editor"
  };
  try {
    const service = new DeploymentService(repository as unknown as DeploymentRepository, scope, {
      enqueue: async () => {
        queues++;
      }
    });
    const create = async () => {
      exports++;
      return { sequence: 4, checksum: "hash" } as DeploymentSnapshot;
    };
    await service.schedule(7, create, "request-1");
    await service.schedule(7, create, "request-1");
    assert.equal(exports, 1);
    assert.equal(rows.length, 1);
    assert.equal(queues, 2);
    rows[0]!.status = "live";
    await service.schedule(7, create, "request-2");
    assert.equal(queues, 2);
    assert.equal((await service.state()).lastLive?.version, 4);
    const denied = new DeploymentService(
      repository as unknown as DeploymentRepository,
      { ...scope, tenantId: "other" },
      {
        enqueue: async () => {
          throw Error("must not queue");
        }
      }
    );
    await denied.schedule(8, create, "request-3");
    assert.equal(exports, 1);
    assert.equal((await denied.state()).enabled, false);
  } finally {
    for (const key of [
      "CODEXSUN_SITES_TIRUPURCONNECT_TENANT_ID",
      "CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID",
      "CODEXSUN_SITES_PUBLISH_SECRET"
    ]) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  }
});
test("deployment administration checks permissions before reads or retries", async () => {
  const app = Fastify();
  registerDeploymentRoutes(app, async () => {
    throw AppError.forbidden("Denied");
  });
  for (const [method, url] of [
    ["GET", "/sites/e303865e/deployment"],
    ["POST", "/sites/e303865e/deployment/12345678/retry"]
  ] as const) {
    const response = await app.inject({
      method,
      url,
      ...(method === "POST" ? { payload: {} } : {})
    });
    assert.equal(response.statusCode, 403);
  }
  await app.close();
});
