import { lookupBrand } from "../brand/index.js";
import { lookupCampaign } from "../campaign/index.js";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { sql } from "kysely";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { CaptureService } from "./capture.service.js";
import {
  SubmissionService,
  type SubmissionDependencies,
  type SubmissionInput
} from "../submission/index.js";

const bindingSchema = z.strictObject({
  tenantId: z.string().regex(/^[a-f0-9]{8}$/),
  companyId: z.number().int().positive(),
  actorEmail: z.email(),
  formUuid: z.string().regex(/^[a-f0-9]{8}$/),
  origin: z.url(),
  noticeVersion: z.string().max(40),
  revision: z.number().int().positive(),
  expiresAt: z.number()
});
export type CaptureBinding = z.infer<typeof bindingSchema>;
export type PublicCaptureDependencies = {
  secret: string;
  resolve(binding: CaptureBinding): Promise<MarketingContext>;
  verifyOrigin(context: MarketingContext, origin: string): Promise<void>;
  submissions: SubmissionDependencies;
};

export class PublicCaptureService {
  constructor(private readonly dependencies: PublicCaptureDependencies) {}
  private key() {
    return createHash("sha256")
      .update("codexsun.marketing.capture.v1:" + this.dependencies.secret)
      .digest();
  }
  private open(token: string) {
    try {
      const [nonce, tag, content] = token.split(".");
      if (!nonce || !tag || !content) throw new Error("Invalid binding");
      const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(nonce, "base64url"));
      decipher.setAAD(Buffer.from("codexsun.public.capture.v1"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      const value = bindingSchema.parse(
        JSON.parse(
          Buffer.concat([
            decipher.update(Buffer.from(content, "base64url")),
            decipher.final()
          ]).toString("utf8")
        )
      );
      if (value.expiresAt < Date.now()) throw new Error("Expired binding");
      return value;
    } catch {
      throw AppError.forbidden("The published capture binding is invalid or expired.");
    }
  }
  async publish(context: MarketingContext, uuid: string) {
    await context.authorize("marketing.capture.record.update");
    const form = await new CaptureService(context).get(uuid);
    if (form.status !== "active")
      throw AppError.conflict("Activate the form before publishing its binding.");
    if (
      (await lookupBrand(context, form.brandUuid)).status !== "active" ||
      (await lookupCampaign(context, form.campaignUuid)).status !== "active"
    )
      throw AppError.conflict("The capture source is inactive.");
    await this.dependencies.verifyOrigin(context, form.allowedOrigin);
    const binding: CaptureBinding = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      actorEmail: context.actorEmail,
      formUuid: uuid,
      origin: form.allowedOrigin,
      noticeVersion: form.noticeVersion,
      revision: form.revision,
      expiresAt: Date.now() + 30 * 86400000
    };
    const nonce = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", this.key(), nonce);
    cipher.setAAD(Buffer.from("codexsun.public.capture.v1"));
    const content = Buffer.concat([cipher.update(JSON.stringify(binding), "utf8"), cipher.final()]);
    const token = [
      nonce.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      content.toString("base64url")
    ].join(".");
    return {
      token,
      path: "/public/marketing/captures?token=" + token,
      expiresAt: new Date(binding.expiresAt).toISOString()
    };
  }
  private async source(token: string) {
    const binding = this.open(token),
      context = await this.dependencies.resolve(binding);
    if (
      context.tenantId !== binding.tenantId ||
      context.companyId !== binding.companyId ||
      context.actorEmail !== binding.actorEmail
    )
      throw AppError.forbidden("The capture source does not match its binding.");
    const form = await new CaptureService(context).get(binding.formUuid);
    if (
      form.status !== "active" ||
      form.allowedOrigin !== binding.origin ||
      form.noticeVersion !== binding.noticeVersion ||
      form.revision !== binding.revision
    )
      throw AppError.conflict("The published capture form changed. Publish a new binding.");
    const brand = await lookupBrand(context, form.brandUuid);
    const campaign = await lookupCampaign(context, form.campaignUuid);
    if (brand.status !== "active" || campaign.status !== "active")
      throw AppError.conflict("The capture source is inactive.");
    await this.dependencies.verifyOrigin(context, binding.origin);
    return { binding, context, form };
  }
  async definition(token: string) {
    const { form, binding } = await this.source(token);
    return {
      title: form.name,
      consentNotice: form.consentNotice,
      noticeVersion: form.noticeVersion,
      expiresAt: new Date(binding.expiresAt).toISOString()
    };
  }
  async submit(
    token: string,
    origin: string,
    address: string,
    input: Omit<SubmissionInput, "captureUuid">
  ) {
    const { binding, context } = await this.source(token);
    if (origin !== binding.origin)
      throw AppError.forbidden("This origin is not approved for the capture form.");
    await sql`DELETE FROM marketing_capture_limits WHERE created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 DAY) LIMIT 500`.execute(
      context.database
    );
    const rateKey = createHmac("sha256", this.dependencies.secret)
      .update(binding.formUuid + ":" + Math.floor(Date.now() / 3600000) + ":" + address)
      .digest("hex");
    await sql`INSERT INTO marketing_capture_limits(rate_key,hits,created_at) VALUES(${rateKey},1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE hits=hits+1`.execute(
      context.database
    );
    const hits =
      (
        await sql<{
          hits: number;
        }>`SELECT hits FROM marketing_capture_limits WHERE rate_key=${rateKey}`.execute(
          context.database
        )
      ).rows[0]?.hits ?? 100;
    if (hits > 10) throw AppError.conflict("Too many submissions. Please try again later.");
    const saved = await new SubmissionService(context, this.dependencies.submissions).accept({
      ...input,
      captureUuid: binding.formUuid
    });
    return { reference: saved.uuid, received: true };
  }
}
