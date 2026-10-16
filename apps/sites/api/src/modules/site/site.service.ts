import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { SiteRepository } from "./site.repository.js";
import type { CmsSite, SiteCreatePayload, SiteUpdatePayload } from "./site.types.js";

export class SiteService {
  constructor(private readonly repository: SiteRepository) {}

  async list(): Promise<CmsSite[]> {
    return this.repository.list();
  }

  async show(uuid: string): Promise<CmsSite> {
    const site = await this.repository.findByUuid(uuid);
    if (!site) throw AppError.notFound("Client portfolio site was not found.");
    return site;
  }

  async create(input: SiteCreatePayload): Promise<CmsSite> {
    const payload = normalize(input);
    const existingSlug = await this.repository.findBySlug(payload.slug);
    if (existingSlug) {
      throw AppError.conflict("Portfolio site slug is already registered.");
    }

    const existingDomain = await this.repository.findByDomain(payload.primaryDomain);
    if (existingDomain) {
      throw AppError.conflict("Primary domain is already registered to another portfolio.");
    }

    const uuid = randomBytes(4).toString("hex");
    return this.repository.create({ ...payload, uuid });
  }

  async update(uuid: string, input: SiteUpdatePayload): Promise<CmsSite> {
    const current = await this.show(uuid);
    const payload = normalize(input);

    const sameSlug = await this.repository.findBySlug(payload.slug);
    if (sameSlug && sameSlug.uuid !== current.uuid) {
      throw AppError.conflict("Portfolio site slug is already in use.");
    }

    const sameDomain = await this.repository.findByDomain(payload.primaryDomain);
    if (sameDomain && sameDomain.uuid !== current.uuid) {
      throw AppError.conflict("Primary domain is already in use.");
    }

    const updated = await this.repository.update(uuid, payload);
    if (!updated) throw AppError.notFound("Portfolio site was not found.");
    return updated;
  }

  async suspend(uuid: string): Promise<CmsSite> {
    await this.show(uuid);
    const updated = await this.repository.setStatus(uuid, "suspended");
    if (!updated) throw AppError.notFound("Portfolio site was not found.");
    return updated;
  }

  async restore(uuid: string): Promise<CmsSite> {
    await this.show(uuid);
    const updated = await this.repository.setStatus(uuid, "active");
    if (!updated) throw AppError.notFound("Portfolio site was not found.");
    return updated;
  }

  async delete(uuid: string): Promise<{ deleted: boolean; uuid: string }> {
    const site = await this.show(uuid);
    if (site.status === "active") {
      throw AppError.conflict("Active portfolio sites cannot be deleted. Suspend the site first.");
    }
    await this.repository.delete(uuid);
    return { deleted: true, uuid };
  }
}

function normalize<T extends SiteCreatePayload | SiteUpdatePayload>(payload: T): T {
  return {
    ...payload,
    description: (payload.description ?? "").trim(),
    name: payload.name.trim(),
    port: payload.port ? Number(payload.port) : 0,
    primaryDomain: payload.primaryDomain.trim().toLowerCase().replace(/^https?:\/\//u, "").replace(/\/$/u, ""),
    slug: payload.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/gu, "-"),
    themeKey: payload.themeKey.trim() || "cms-default"
  };
}
