import { AppError } from "@codexsun/framework/errors";
import { createHash } from "node:crypto";
import type { PublicationRepository } from "./publication.repository.js";
import type { PublicationOwner } from "./publication.types.js";
import { deliveryPayloadSchema } from "./publication.schema.js";
import { publicationChecksum } from "./publication.integrity.js";
export class PublicationService {
  constructor(
    private readonly repository: PublicationRepository,
    private readonly site: PublicationOwner,
    private readonly tenantId: string
  ) {}
  async export(content: unknown, blogs: unknown, actor: string) {
    if (this.site.status !== "active")
      throw AppError.conflict("Activate the site before exporting.");
    if (!content) throw AppError.conflict("Publish the website before preparing a deployment.");
    const payload = deliveryPayloadSchema.parse({
      schemaVersion: 1,
      siteKey: createHash("sha256").update(`${this.tenantId}:${this.site.uuid}`).digest("hex"),
      siteUuid: this.site.uuid,
      siteSlug: this.site.slug,
      content,
      blogs
    });
    return this.repository.create(this.site.id, payload, publicationChecksum(payload), actor);
  }
}
