import { AppError } from "@codexsun/framework/errors";
import { z } from "zod";
import type { MarketingContext } from "../../context.js";
import { ConsentRepository } from "./consent.repository.js";
import type { ConsentDependencies, EligibilityResult } from "./consent.types.js";
export const eligibilityInputSchema = z.strictObject({
  brandUuid: z.string().regex(/^[a-f0-9]{8}$/),
  recipient: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  channel: z.literal("email"),
  purpose: z.literal("promotional")
});
export const consentInputSchema = eligibilityInputSchema.extend({
  action: z.enum(["grant", "withdraw"]),
  noticeVersion: z.string().trim().min(1).max(80),
  evidence: z.string().trim().min(1).max(500),
  source: z.string().trim().min(1).max(160),
  occurredAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().nullable(),
  requestKey: z.string().trim().min(8).max(80)
});
export class ConsentService {
  private readonly repository: ConsentRepository;
  constructor(
    private readonly context: MarketingContext,
    private readonly dependencies: ConsentDependencies
  ) {
    this.repository = new ConsentRepository(context);
  }
  async list(search: string, action: string, limit: number, offset: number) {
    await this.context.authorize("marketing.consent.record.view");
    return this.repository.list(search, action, limit, offset);
  }
  async count(search: string, action: string) {
    await this.context.authorize("marketing.consent.record.view");
    return { total: await this.repository.count(search, action) };
  }
  async get(uuid: string) {
    await this.context.authorize("marketing.consent.record.view");
    const row = await this.repository.get(uuid);
    if (!row) throw AppError.notFound("Consent evidence was not found.");
    return row;
  }
  async append(value: unknown) {
    await this.context.authorize("marketing.consent.record.create");
    await this.context.authorize("marketing.consent.record.view");
    const input = consentInputSchema.parse(value);
    const brand = await this.dependencies.brand(this.context, input.brandUuid);
    if (brand.status !== "active" && input.action === "grant")
      throw AppError.validation("Select an active brand.");
    if (input.action === "grant" && input.noticeVersion.toLowerCase() === "unknown")
      throw AppError.validation("A promotional grant requires a known notice version.");
    const occurred = Date.parse(input.occurredAt),
      expires = input.expiresAt ? Date.parse(input.expiresAt) : null;
    if (occurred > Date.now() || (expires !== null && expires <= occurred))
      throw AppError.validation("Consent evidence dates are invalid.");
    return this.get(await this.repository.append(input));
  }
  async eligibility(value: unknown): Promise<EligibilityResult> {
    await this.context.authorize("marketing.consent.record.view");
    const input = eligibilityInputSchema.parse(value);
    const brand = await this.dependencies.brand(this.context, input.brandUuid);
    const reasons: string[] = [];
    if (brand.status !== "active") reasons.push("brand_inactive");
    let latest = null;
    try {
      latest = await this.repository.latest(input);
    } catch {
      reasons.push("consent_unavailable");
    }
    if (!latest) reasons.push("consent_missing");
    else if (latest.action !== "grant") reasons.push("consent_withdrawn");
    else if (latest.expiresAt && Date.parse(latest.expiresAt) <= Date.now())
      reasons.push("consent_expired");
    for (const owner of ["crm", "mail"] as const) {
      try {
        const decision = await this.dependencies[owner](this.context, input.recipient);
        if (decision.allowed !== true) reasons.push(owner + ":" + decision.reason);
      } catch {
        reasons.push(owner + "_unavailable");
      }
    }
    try {
      const current = await this.repository.latest(input);
      if (current?.uuid !== latest?.uuid) reasons.push("consent_changed");
      if (
        current?.expiresAt &&
        Date.parse(current.expiresAt) <= Date.now() &&
        !reasons.includes("consent_expired")
      )
        reasons.push("consent_expired");
      if (
        (await this.dependencies.brand(this.context, input.brandUuid)).status !== "active" &&
        !reasons.includes("brand_inactive")
      )
        reasons.push("brand_inactive");
    } catch {
      reasons.push("consent_unavailable");
    }
    await this.context.authorize("marketing.consent.record.view");
    return {
      eligible: reasons.length === 0,
      checkedAt: new Date().toISOString(),
      consentUuid: latest?.uuid ?? null,
      reasons
    };
  }
}
