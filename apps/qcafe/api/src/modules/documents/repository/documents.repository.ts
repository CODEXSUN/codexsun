import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  CreateDocument,
  CreatePrinterProfile,
  CreatePrinterRoute,
  DocumentsScope,
} from "../contracts/documents.contract.js";
import type { QcafeDocumentsDatabase } from "../persistence/documents.database.js";

export class DocumentsRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeDocumentsDatabase>;
  }

  location(scope: DocumentsScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  document(id: string) {
    return this.tables().selectFrom("qcafe_documents").selectAll().where("id", "=", id).executeTakeFirst();
  }

  printerProfile(id: string) {
    return this.tables().selectFrom("qcafe_printer_profiles").selectAll().where("id", "=", id).executeTakeFirst();
  }

  printJob(id: string) {
    return this.tables().selectFrom("qcafe_print_jobs").selectAll().where("id", "=", id).executeTakeFirst();
  }

  jobByIdempotencyKey(locationId: string, key: string) {
    return this.tables()
      .selectFrom("qcafe_print_jobs")
      .selectAll()
      .where("location_id", "=", locationId)
      .where("idempotency_key", "=", key)
      .executeTakeFirst();
  }

  async routeFor(locationId: string, documentKind: string) {
    return this.tables()
      .selectFrom("qcafe_printer_routes")
      .selectAll()
      .where("location_id", "=", locationId)
      .where("document_kind", "=", documentKind)
      .where("active", "=", 1)
      .orderBy("priority", "desc")
      .executeTakeFirst();
  }

  async fallbackRoute(locationId: string, documentKind: string) {
    const routes = await this.tables()
      .selectFrom("qcafe_printer_routes")
      .selectAll()
      .where("location_id", "=", locationId)
      .where("document_kind", "=", documentKind)
      .where("active", "=", 1)
      .orderBy("priority", "desc")
      .execute();
    return routes.find((route) => route.fallback_profile_id !== null);
  }

  async workspace(scope: DocumentsScope) {
    const db = this.tables();
    const documents = await db
      .selectFrom("qcafe_documents")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    const documentIds = documents.map((document) => document.id);
    const printerProfiles = await db
      .selectFrom("qcafe_printer_profiles")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("code")
      .execute();
    const printerRoutes = await db
      .selectFrom("qcafe_printer_routes")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .orderBy("priority", "desc")
      .execute();
    const jobs = documentIds.length
      ? await db.selectFrom("qcafe_print_jobs").selectAll().where("document_id", "in", documentIds).execute()
      : [];
    const jobIds = jobs.map((job) => job.id);
    const previews = jobIds.length
      ? await db.selectFrom("qcafe_print_previews").selectAll().where("job_id", "in", jobIds).execute()
      : [];
    const consents = await db
      .selectFrom("qcafe_delivery_consents")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("customer_ref")
      .execute();
    const deliveries = await db
      .selectFrom("qcafe_deliveries")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    return {
      attempts: jobIds.length
        ? await db
            .selectFrom("qcafe_print_attempts")
            .selectAll()
            .where("job_id", "in", jobIds)
            .orderBy("attempt_number")
            .execute()
        : [],
      consents,
      deliveries,
      dispatches: jobIds.length
        ? await db.selectFrom("qcafe_print_dispatches").selectAll().where("job_id", "in", jobIds).execute()
        : [],
      documents,
      jobs,
      previews,
      printerProfiles,
      printerRoutes,
    };
  }

  async createDocument(input: CreateDocument, actor: string, now: string) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_documents")
      .values({
        business_id: input.businessId,
        checksum: input.checksum ?? null,
        created_at: now,
        created_by: actor,
        id,
        kind: input.kind,
        location_id: input.locationId,
        status: "draft",
        storage_object_ref: input.storageObjectRef ?? null,
        title: input.title,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async renderDocument(id: string, now: string) {
    await this.tables()
      .updateTable("qcafe_documents")
      .set({ status: "rendered", updated_at: now })
      .where("id", "=", id)
      .where("status", "=", "draft")
      .execute();
  }

  async createPrinterProfile(input: CreatePrinterProfile, now: string) {
    const existing = await this.tables()
      .selectFrom("qcafe_printer_profiles")
      .select("id")
      .where("location_id", "=", input.locationId)
      .where("code", "=", input.code)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_printer_profiles")
      .values({
        active: 1,
        business_id: input.businessId,
        code: input.code,
        config_ref: input.configRef ?? null,
        created_at: now,
        id,
        kind: input.kind,
        location_id: input.locationId,
        name: input.name,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async createPrinterRoute(input: CreatePrinterRoute, now: string) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_printer_routes")
      .values({
        active: 1,
        created_at: now,
        document_kind: input.documentKind,
        fallback_profile_id: input.fallbackProfileId ?? null,
        id,
        location_id: input.locationId,
        printer_profile_id: input.printerProfileId,
        priority: input.priority,
      })
      .execute();
    return id;
  }

  async queueJob(
    scope: DocumentsScope,
    documentId: string,
    printerProfileId: string,
    routeRef: string | undefined,
    preview: boolean,
    idempotencyKey: string | undefined,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeDocumentsDatabase>;
      const jobId = randomUUID();
      await db
        .insertInto("qcafe_print_jobs")
        .values({
          attempt_count: preview ? 0 : 1,
          business_id: scope.businessId,
          created_at: now,
          created_by: actor,
          document_id: documentId,
          id: jobId,
          idempotency_key: idempotencyKey ?? null,
          location_id: scope.locationId,
          printer_profile_id: printerProfileId,
          status: preview ? "preview" : "pending",
          updated_at: now,
        })
        .execute();
      if (preview) {
        await db
          .insertInto("qcafe_print_previews")
          .values({
            confirmed_at: null,
            confirmed_by: null,
            id: randomUUID(),
            job_id: jobId,
            requested_at: now,
            requested_by: actor,
            status: "pending",
          })
          .execute();
      } else {
        await db
          .insertInto("qcafe_print_attempts")
          .values({
            attempt_number: 1,
            error: null,
            id: randomUUID(),
            job_id: jobId,
            requested_at: now,
            requested_by: actor,
            route_ref: routeRef ?? null,
            status: "queued",
          })
          .execute();
      }
      return jobId;
    });
  }

  async previewForJob(jobId: string) {
    return this.tables().selectFrom("qcafe_print_previews").selectAll().where("job_id", "=", jobId).executeTakeFirst();
  }

  async confirmPreview(jobId: string, previewId: string, routeRef: string | null, actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeDocumentsDatabase>;
      await db
        .updateTable("qcafe_print_previews")
        .set({ confirmed_at: now, confirmed_by: actor, status: "confirmed" })
        .where("id", "=", previewId)
        .where("status", "=", "pending")
        .execute();
      await db
        .insertInto("qcafe_print_attempts")
        .values({
          attempt_number: 1,
          error: null,
          id: randomUUID(),
          job_id: jobId,
          requested_at: now,
          requested_by: actor,
          route_ref: routeRef,
          status: "queued",
        })
        .execute();
      await db
        .updateTable("qcafe_print_jobs")
        .set({ attempt_count: 1, status: "pending", updated_at: now })
        .where("id", "=", jobId)
        .execute();
    });
  }

  async recordAttempt(
    jobId: string,
    attemptNumber: number,
    status: "acknowledged" | "failed",
    error: string | undefined,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeDocumentsDatabase>;
      await db
        .insertInto("qcafe_print_attempts")
        .values({
          attempt_number: attemptNumber,
          error: error ?? null,
          id: randomUUID(),
          job_id: jobId,
          requested_at: now,
          requested_by: actor,
          route_ref: null,
          status,
        })
        .execute();
      await db
        .updateTable("qcafe_print_jobs")
        .set({ attempt_count: attemptNumber, status, updated_at: now })
        .where("id", "=", jobId)
        .execute();
    });
  }

  async requeue(jobId: string, attemptNumber: number, actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeDocumentsDatabase>;
      await db
        .insertInto("qcafe_print_attempts")
        .values({
          attempt_number: attemptNumber,
          error: null,
          id: randomUUID(),
          job_id: jobId,
          requested_at: now,
          requested_by: actor,
          route_ref: null,
          status: "queued",
        })
        .execute();
      await db
        .updateTable("qcafe_print_jobs")
        .set({ attempt_count: attemptNumber, status: "pending", updated_at: now })
        .where("id", "=", jobId)
        .execute();
    });
  }

  async recordDispatch(
    jobId: string,
    adapterKind: string,
    endpointRef: string | null,
    decision: "dispatched" | "unavailable" | "rerouted",
    detail: string | null,
    actor: string,
    now: string,
  ) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_print_dispatches")
      .values({
        adapter_kind: adapterKind,
        created_at: now,
        created_by: actor,
        decision,
        detail,
        endpoint_ref: endpointRef,
        id,
        job_id: jobId,
      })
      .execute();
    return id;
  }

  async markJobProcessing(jobId: string, now: string) {
    await this.tables()
      .updateTable("qcafe_print_jobs")
      .set({ status: "processing", updated_at: now })
      .where("id", "=", jobId)
      .execute();
  }

  async rerouteJob(jobId: string, printerProfileId: string, status: "pending", now: string) {
    await this.tables()
      .updateTable("qcafe_print_jobs")
      .set({ printer_profile_id: printerProfileId, status, updated_at: now })
      .where("id", "=", jobId)
      .execute();
  }

  async consentFor(locationId: string, customerRef: string, channel: "email" | "whatsapp") {
    return this.tables()
      .selectFrom("qcafe_delivery_consents")
      .selectAll()
      .where("location_id", "=", locationId)
      .where("customer_ref", "=", customerRef)
      .where("channel", "=", channel)
      .executeTakeFirst();
  }

  async grantConsent(scope: DocumentsScope, customerRef: string, channel: "email" | "whatsapp", now: string) {
    const existing = await this.consentFor(scope.locationId, customerRef, channel);
    if (existing) {
      await this.tables()
        .updateTable("qcafe_delivery_consents")
        .set({ granted_at: now, revoked_at: null, status: "granted" })
        .where("id", "=", existing.id)
        .execute();
      return existing.id;
    }
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_delivery_consents")
      .values({
        business_id: scope.businessId,
        channel,
        created_at: now,
        customer_ref: customerRef,
        granted_at: now,
        id,
        location_id: scope.locationId,
        revoked_at: null,
        status: "granted",
      })
      .execute();
    return id;
  }

  async revokeConsent(id: string, now: string) {
    await this.tables()
      .updateTable("qcafe_delivery_consents")
      .set({ revoked_at: now, status: "revoked" })
      .where("id", "=", id)
      .where("status", "=", "granted")
      .execute();
  }

  delivery(id: string) {
    return this.tables().selectFrom("qcafe_deliveries").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async queueDelivery(
    scope: DocumentsScope,
    input: { channel: "email" | "whatsapp"; consentId: string; destination: string; documentId: string },
    actor: string,
    now: string,
  ) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_deliveries")
      .values({
        business_id: scope.businessId,
        channel: input.channel,
        consent_id: input.consentId,
        created_at: now,
        created_by: actor,
        destination: input.destination,
        document_id: input.documentId,
        error: null,
        id,
        location_id: scope.locationId,
        provider_reference: null,
        status: "queued",
        updated_at: now,
      })
      .execute();
    return id;
  }

  async recordDeliveryResult(
    id: string,
    status: "sent" | "failed",
    providerReference: string | undefined,
    error: string | undefined,
    now: string,
  ) {
    await this.tables()
      .updateTable("qcafe_deliveries")
      .set({ error: error ?? null, provider_reference: providerReference ?? null, status, updated_at: now })
      .where("id", "=", id)
      .where("status", "=", "queued")
      .execute();
  }
}
