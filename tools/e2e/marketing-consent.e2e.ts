import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { sql } from "kysely";
import {
  ConsentService,
  lookupBrand,
  type MarketingContext,
  type ConsentDependencies
} from "../../apps/marketing/api/src/index.js";
import {
  migrateMailSuppressions,
  checkMailSuppression,
  recordMailSuppression
} from "../../apps/mail/api/src/index.js";
import {
  checkContactRestrictions,
  recordContactRestriction
} from "../../apps/crm/api/src/index.js";
import { contactIdsForEmailPolicy } from "../../apps/core/api/src/index.js";

export async function verifyConsentEligibility(
  app: FastifyInstance,
  context: () => Promise<MarketingContext>,
  databaseNames: string[],
  select: (tenant: number, company?: number, actor?: string) => void
) {
  select(0);
  const ctx = await context();
  for (let index = 0; index < 2; index++) {
    select(index);
    await migrateMailSuppressions((await context()).database);
    await migrateMailSuppressions((await context()).database);
  }
  select(0);
  const brandResponse = await app.inject({
    method: "POST",
    url: "/marketing/brands",
    payload: { name: "Consent test brand", timezone: "Asia/Kolkata" }
  });
  assert.equal(brandResponse.statusCode, 200, brandResponse.body);
  const brand = brandResponse.json().data;
  const scope = await context();
  let unavailable = false;
  let withdrawDuringCheck: (() => Promise<void>) | null = null;
  const dependencies: ConsentDependencies = {
    brand: lookupBrand,
    crm: async (c, recipient) => {
      if (unavailable) throw new Error("Simulated policy outage");
      if (withdrawDuringCheck) {
        const write = withdrawDuringCheck;
        withdrawDuringCheck = null;
        await write();
      }
      return checkContactRestrictions(
        c,
        recipient,
        await contactIdsForEmailPolicy(databaseNames[0]!, recipient)
      );
    },
    mail: checkMailSuppression
  };
  const service = new ConsentService({ ...scope, allowedBrands: [brand.uuid] }, dependencies);
  const base = {
    brandUuid: brand.uuid,
    recipient: "test@example.test",
    channel: "email" as const,
    purpose: "promotional" as const
  };
  const evidence = {
    ...base,
    action: "grant" as const,
    noticeVersion: "offers-v1",
    source: "disposable-test",
    evidence: "explicit-test-evidence",
    occurredAt: "2026-01-01T00:00:00Z",
    expiresAt: null,
    requestKey: "consent-retry-1"
  };
  const noGrant = await service.eligibility(base);
  assert.equal(noGrant.eligible, false);
  assert(noGrant.reasons.includes("consent_missing"));
  const grant = await service.append(evidence);
  assert.equal(
    Date.parse(grant.occurredAt),
    Date.parse(evidence.occurredAt),
    "Evidence UTC must survive the database driver timezone."
  );
  assert(Math.abs(Date.parse(grant.createdAt) - Date.now()) < 5000, "Audit time must remain UTC.");
  const nearExpiry = {
    ...evidence,
    recipient: "near-expiry@example.test",
    occurredAt: new Date(Date.now() - 600000).toISOString(),
    expiresAt: new Date(Date.now() - 1000).toISOString(),
    requestKey: "near-expiry-test"
  };
  const expiredEntry = await service.append(nearExpiry);
  assert.equal(Date.parse(expiredEntry.expiresAt!), Date.parse(nearExpiry.expiresAt));
  assert(
    (await service.eligibility({ ...base, recipient: nearExpiry.recipient })).reasons.includes(
      "consent_expired"
    ),
    "A driver timezone cannot extend consent expiry."
  );

  assert.equal((await service.append(evidence)).uuid, grant.uuid);
  await assert.rejects(service.append({ ...evidence, evidence: "different" }), /request key/);
  assert.equal(
    (await service.eligibility({ ...base, recipient: "TEST@example.test" })).eligible,
    true
  );
  await assert.rejects(service.eligibility({ ...base, purpose: "service" }));
  await assert.rejects(
    service.append({ ...evidence, requestKey: "bad-unknown", noticeVersion: "unknown" }),
    /known notice/
  );
  await assert.rejects(
    service.append({ ...evidence, requestKey: "future-time", occurredAt: "2099-01-01T00:00:00Z" }),
    /dates/
  );
  await assert.rejects(service.append({ ...evidence, requestKey: "forged-scope", companyId: 2 }));
  await recordContactRestriction(scope, {
    recipient: base.recipient,
    blocked: true,
    reason: "Customer request"
  });
  assert((await service.eligibility(base)).reasons.includes("crm:do_not_contact"));
  await recordContactRestriction(scope, {
    recipient: base.recipient,
    blocked: false,
    reason: "Restriction review complete"
  });
  assert.equal((await service.eligibility(base)).eligible, true);
  await service.append({
    ...evidence,
    action: "withdraw",
    occurredAt: "2026-02-01T00:00:00Z",
    requestKey: "withdraw-1"
  });
  assert((await service.eligibility(base)).reasons.includes("consent_withdrawn"));
  await assert.rejects(service.append({ ...evidence, requestKey: "stale-grant" }), /later than/);
  await service.append({
    ...evidence,
    occurredAt: "2026-03-01T00:00:00Z",
    requestKey: "consent-grant-2"
  });
  assert.equal((await service.eligibility(base)).eligible, true);
  await service.append({
    ...evidence,
    occurredAt: "2026-04-01T00:00:00Z",
    expiresAt: "2026-04-02T00:00:00Z",
    requestKey: "expired-grant"
  });
  assert((await service.eligibility(base)).reasons.includes("consent_expired"));
  await service.append({
    ...evidence,
    occurredAt: "2026-05-01T00:00:00Z",
    requestKey: "consent-grant-3"
  });
  unavailable = true;
  assert((await service.eligibility(base)).reasons.includes("crm_unavailable"));
  unavailable = false;
  withdrawDuringCheck = async () => {
    await service.append({
      ...evidence,
      action: "withdraw",
      occurredAt: "2026-06-01T00:00:00Z",
      requestKey: "raced-withdraw"
    });
  };
  assert((await service.eligibility(base)).reasons.includes("consent_changed"));
  await service.append({
    ...evidence,
    occurredAt: "2026-07-01T00:00:00Z",
    requestKey: "consent-grant-4"
  });
  await recordMailSuppression(scope, {
    recipient: base.recipient,
    reason: "complaint",
    evidence: "test-feedback"
  });
  assert((await service.eligibility(base)).reasons.includes("mail:complaint"));
  await service.append({
    ...evidence,
    occurredAt: "2026-08-01T00:00:00Z",
    requestKey: "grant-after-complaint"
  });
  assert.equal((await service.eligibility(base)).eligible, false);
  const inactive = new ConsentService(
    { ...scope, allowedBrands: [brand.uuid] },
    { ...dependencies, brand: async () => ({ status: "inactive" }) }
  );
  await assert.rejects(
    inactive.append({ ...evidence, requestKey: "inactive-grant" }),
    /active brand/
  );
  await inactive.append({
    ...evidence,
    action: "withdraw",
    requestKey: "inactive-withdraw",
    occurredAt: "2026-09-01T00:00:00Z"
  });
  assert((await inactive.eligibility(base)).reasons.includes("brand_inactive"));
  const bounce = { ...base, recipient: "bounce@example.test" };
  await service.append({ ...evidence, ...bounce, requestKey: "bounce-grant" });
  await recordMailSuppression(scope, {
    recipient: bounce.recipient,
    reason: "hard_bounce",
    evidence: "test-bounce"
  });
  assert((await service.eligibility(bounce)).reasons.includes("mail:hard_bounce"));
  const withoutMail = new ConsentService(
    { ...scope, allowedBrands: [brand.uuid] },
    {
      ...dependencies,
      mail: async () => {
        throw new Error("Unavailable");
      }
    }
  );
  assert((await withoutMail.eligibility(base)).reasons.includes("mail_unavailable"));
  const denied = new ConsentService(
    {
      ...scope,
      allowedBrands: [brand.uuid],
      authorize: async () => {
        throw new Error("Denied grant");
      }
    },
    dependencies
  );
  await assert.rejects(denied.append({ ...evidence, requestKey: "denied-grant" }), /Denied/);
  await assert.rejects(denied.eligibility(base), /Denied/);
  select(1);
  const other = new ConsentService(await context(), dependencies);
  assert.equal((await other.list("", "all", 50, 0)).length, 0);
  await assert.rejects(other.get(grant.uuid), /not found/);
  await assert.rejects(other.eligibility(base), /not found/);
  assert.equal((await checkMailSuppression(await context(), base.recipient)).allowed, true);
  select(0, 2);
  const company = new ConsentService(await context(), dependencies);
  assert.equal((await company.list("", "all", 50, 0)).length, 0);
  await assert.rejects(company.eligibility(base), /not found/);
  assert.equal((await checkMailSuppression(await context(), base.recipient)).allowed, true);
  select(0, 1, "other@example.test");
  await assert.rejects(
    new ConsentService(await context(), dependencies).get(grant.uuid),
    /not found/
  );
  select(0);
  // Multiple Core identities are checked conservatively; no identity is merged.
  await sql`INSERT INTO core_contacts(uuid,code,name,primary_email) VALUES('ccee7788','CONSENT-TEST','Policy test','legacy@example.test')`.execute(
    ctx.database
  );
  const contactId = Number(
    (
      await sql<{ id: number }>`SELECT id FROM core_contacts WHERE uuid='ccee7788'`.execute(
        ctx.database
      )
    ).rows[0]!.id
  );
  await sql`INSERT INTO contact_people(uuid,customer_contact_id,first_name,created_by,updated_by) VALUES('aabbcc99',${contactId},'Policy test','test','test')`.execute(
    ctx.database
  );
  const personId = Number(
    (
      await sql<{ id: number }>`SELECT id FROM contact_people WHERE uuid='aabbcc99'`.execute(
        ctx.database
      )
    ).rows[0]!.id
  );
  await sql`INSERT INTO contact_preferences(person_id,communication_permission,created_by,updated_by) VALUES(${personId},'do not contact','test','test')`.execute(
    ctx.database
  );
  await sql`INSERT INTO core_contacts(uuid,code,name,primary_email) VALUES('ccee7799','CONSENT-TEST-2','Another policy identity','legacy@example.test')`.execute(
    ctx.database
  );
  const ids = await contactIdsForEmailPolicy(databaseNames[0]!, "legacy@example.test");
  assert.equal(ids.length, 2);
  assert(ids.includes(contactId));
  assert.equal((await checkContactRestrictions(scope, "legacy@example.test", ids)).allowed, false);
  await service.append({
    ...evidence,
    recipient: "legacy@example.test",
    requestKey: "legacy-pref-grant"
  });
  assert(
    (await service.eligibility({ ...base, recipient: "legacy@example.test" })).reasons.includes(
      "crm:legacy_preference_requires_review"
    )
  );
  const httpGet = await app.inject({ method: "GET", url: "/marketing/consents/" + grant.uuid });
  assert.equal(httpGet.statusCode, 200, httpGet.body);
  const httpCheck = await app.inject({
    method: "POST",
    url: "/marketing/consents/eligibility",
    payload: base
  });
  assert.equal(httpCheck.statusCode, 200, httpCheck.body);
  assert.equal(httpCheck.json().data.eligible, false);
  const forged = await app.inject({
    method: "POST",
    url: "/marketing/consents",
    payload: { ...evidence, requestKey: "forged-http", tenantId: "forged" }
  });
  assert.equal(forged.statusCode, 400);
  select(1);
  assert.equal(
    (await app.inject({ method: "GET", url: "/marketing/consents/" + grant.uuid })).statusCode,
    404
  );
  select(0);
  assert.equal(
    Number(
      (
        await sql<{ count: number }>`SELECT COUNT(*) AS count FROM mail_suppressions`.execute(
          ctx.database
        )
      ).rows[0]!.count
    ),
    2
  );
}
