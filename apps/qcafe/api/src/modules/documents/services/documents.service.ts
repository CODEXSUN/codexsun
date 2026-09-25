import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  CreateDocument,
  CreatePrinterProfile,
  CreatePrinterRoute,
  DocumentsScope,
  QueuePrintJob,
} from "../contracts/documents.contract.js";
import { DocumentsRepository } from "../repository/documents.repository.js";
import { dispatchThroughAdapter } from "./print-adapters.js";

export class DocumentsConflictError extends Error {}

export class DocumentsService {
  constructor(
    private readonly repo: DocumentsRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: DocumentsScope) {
    return this.repo.workspace(scope);
  }

  async createDocument(input: CreateDocument, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new DocumentsConflictError("The document outlet scope is invalid.");
    }
    const id = await this.repo.createDocument(input, context.actorId, this.timestamp());
    await this.record(context, "document.created", id, "document", { kind: input.kind });
    return { id };
  }

  async renderDocument(documentId: string, context: CommandContext) {
    const document = await this.repo.document(documentId);
    if (!document) throw new DocumentsConflictError("The document is invalid.");
    if (document.status !== "draft") throw new DocumentsConflictError("Only a draft document can be rendered.");
    await this.repo.renderDocument(documentId, this.timestamp());
    await this.record(context, "document.rendered", documentId, "document", {});
    return { id: documentId };
  }

  async createPrinterProfile(input: CreatePrinterProfile, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new DocumentsConflictError("The document outlet scope is invalid.");
    }
    const id = await this.repo.createPrinterProfile(input, this.timestamp());
    await this.record(context, "printer-profile.created", id, "printer-profile", { code: input.code });
    return { id };
  }

  async createPrinterRoute(input: CreatePrinterRoute, context: CommandContext) {
    const profile = await this.repo.printerProfile(input.printerProfileId);
    if (!profile || !profile.active) throw new DocumentsConflictError("The route printer profile is invalid.");
    if (input.fallbackProfileId) {
      const fallback = await this.repo.printerProfile(input.fallbackProfileId);
      if (!fallback || !fallback.active || fallback.location_id !== profile.location_id) {
        throw new DocumentsConflictError("The fallback printer profile is invalid.");
      }
    }
    const id = await this.repo.createPrinterRoute(input, this.timestamp());
    await this.record(context, "printer-route.created", id, "printer-route", { documentKind: input.documentKind });
    return { id };
  }

  async queuePrintJob(input: QueuePrintJob, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope))) throw new DocumentsConflictError("The document outlet scope is invalid.");
    const document = await this.repo.document(input.documentId);
    if (!document || document.business_id !== input.businessId || document.location_id !== input.locationId) {
      throw new DocumentsConflictError("The print document is invalid.");
    }
    if (document.status !== "rendered") {
      throw new DocumentsConflictError("Only a rendered document can be queued for printing.");
    }
    let profileId = input.printerProfileId;
    let routeRef = input.routeRef;
    if (!profileId) {
      const route = await this.repo.routeFor(input.locationId, document.kind);
      if (!route) throw new DocumentsConflictError("No print route covers this document kind.");
      const profile = await this.repo.printerProfile(route.printer_profile_id);
      if (!profile || !profile.active) throw new DocumentsConflictError("The routed printer is unavailable.");
      profileId = profile.id;
      routeRef = `route:${route.id}`;
    } else {
      const profile = await this.repo.printerProfile(profileId);
      if (!profile || !profile.active || profile.location_id !== input.locationId) {
        throw new DocumentsConflictError("The selected printer is unavailable.");
      }
    }
    if (input.idempotencyKey) {
      const replayed = await this.repo.jobByIdempotencyKey(input.locationId, input.idempotencyKey);
      if (replayed) {
        await this.record(context, "print-job.replayed", replayed.id, "print-job", { documentId: document.id });
        return this.read(scope);
      }
    }
    const id = await this.repo.queueJob(
      scope,
      document.id,
      profileId,
      routeRef,
      input.preview,
      input.idempotencyKey,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, input.preview ? "print-job.preview-requested" : "print-job.queued", id, "print-job", {
      documentId: document.id,
    });
    return this.read(scope);
  }

  async confirmPreview(jobId: string, context: CommandContext) {
    const job = await this.repo.printJob(jobId);
    if (!job) throw new DocumentsConflictError("The print job is invalid.");
    if (job.status !== "preview") throw new DocumentsConflictError("Only a preview job can be confirmed.");
    const preview = await this.repo.previewForJob(jobId);
    if (!preview || preview.status !== "pending") throw new DocumentsConflictError("The preview is no longer pending.");
    const route = await this.repo.routeFor(job.location_id, (await this.repo.document(job.document_id))?.kind ?? "");
    await this.repo.confirmPreview(
      jobId,
      preview.id,
      route ? `route:${route.id}` : null,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "print-job.preview-confirmed", jobId, "print-job", {});
    return this.read({ businessId: job.business_id, locationId: job.location_id });
  }

  async recordAttempt(
    jobId: string,
    status: "acknowledged" | "failed",
    error: string | undefined,
    context: CommandContext,
  ) {
    const job = await this.repo.printJob(jobId);
    if (!job) throw new DocumentsConflictError("The print job is invalid.");
    if (job.status === "preview") throw new DocumentsConflictError("Confirm the preview before recording attempts.");
    if (job.status === "acknowledged")
      throw new DocumentsConflictError("An acknowledged job accepts no more attempts.");
    if (status === "failed" && !error) throw new DocumentsConflictError("A failed attempt requires an error.");
    await this.repo.recordAttempt(jobId, job.attempt_count + 1, status, error, context.actorId, this.timestamp());
    await this.record(
      context,
      status === "acknowledged" ? "print-job.acknowledged" : "print-job.failed",
      jobId,
      "print-job",
      {
        attempt: job.attempt_count + 1,
      },
    );
    return this.read({ businessId: job.business_id, locationId: job.location_id });
  }

  async dispatchPrintJob(jobId: string, context: CommandContext) {
    const job = await this.repo.printJob(jobId);
    if (!job) throw new DocumentsConflictError("The print job is invalid.");
    if (!["pending", "failed"].includes(job.status)) {
      throw new DocumentsConflictError("Only a pending or failed job can be dispatched.");
    }
    const document = await this.repo.document(job.document_id);
    if (!document) throw new DocumentsConflictError("The print document is invalid.");
    const profile = await this.repo.printerProfile(job.printer_profile_id);
    if (!profile) throw new DocumentsConflictError("The job printer is invalid.");
    const outcome = dispatchThroughAdapter({ jobId, profile });
    const scope = { businessId: job.business_id, locationId: job.location_id };
    if (outcome.decision === "dispatched") {
      await this.repo.markJobProcessing(jobId, this.timestamp());
      await this.repo.recordDispatch(
        jobId,
        profile.kind,
        outcome.endpointRef,
        "dispatched",
        null,
        context.actorId,
        this.timestamp(),
      );
      await this.record(context, "print-job.dispatched", jobId, "print-job", { adapter: profile.kind });
      return this.read(scope);
    }
    const route = await this.repo.fallbackRoute(job.location_id, document.kind);
    const fallback = route?.fallback_profile_id ? await this.repo.printerProfile(route.fallback_profile_id) : undefined;
    if (fallback && fallback.active) {
      await this.repo.rerouteJob(jobId, fallback.id, "pending", this.timestamp());
      await this.repo.recordDispatch(
        jobId,
        profile.kind,
        null,
        "rerouted",
        `Routed to fallback ${fallback.code}. ${outcome.reason}`,
        context.actorId,
        this.timestamp(),
      );
      await this.record(context, "print-job.rerouted", jobId, "print-job", { fallback: fallback.code });
      return this.read(scope);
    }
    await this.repo.recordDispatch(
      jobId,
      profile.kind,
      null,
      "unavailable",
      outcome.reason,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "print-job.dispatch-deferred", jobId, "print-job", { reason: outcome.reason });
    return this.read(scope);
  }

  async reprint(jobId: string, context: CommandContext) {
    const job = await this.repo.printJob(jobId);
    if (!job) throw new DocumentsConflictError("The print job is invalid.");
    if (job.status === "preview") throw new DocumentsConflictError("Confirm the preview before reprinting.");
    if (job.status === "acknowledged") throw new DocumentsConflictError("An acknowledged job cannot be reprinted.");
    await this.repo.requeue(jobId, job.attempt_count + 1, context.actorId, this.timestamp());
    await this.record(context, "print-job.reprinted", jobId, "print-job", { attempt: job.attempt_count + 1 });
    return this.read({ businessId: job.business_id, locationId: job.location_id });
  }

  async grantConsent(
    businessId: string,
    locationId: string,
    customerRef: string,
    channel: "email" | "whatsapp",
    context: CommandContext,
  ) {
    if (!(await this.repo.location({ businessId, locationId }))) {
      throw new DocumentsConflictError("The document outlet scope is invalid.");
    }
    const id = await this.repo.grantConsent({ businessId, locationId }, customerRef, channel, this.timestamp());
    await this.record(context, "delivery-consent.granted", id, "delivery-consent", { channel, customerRef });
    return { id };
  }

  async revokeConsent(
    businessId: string,
    locationId: string,
    customerRef: string,
    channel: "email" | "whatsapp",
    context: CommandContext,
  ) {
    const consent = await this.repo.consentFor(locationId, customerRef, channel);
    if (!consent || consent.business_id !== businessId || consent.status !== "granted") {
      throw new DocumentsConflictError("No active consent exists for this customer and channel.");
    }
    await this.repo.revokeConsent(consent.id, this.timestamp());
    await this.record(context, "delivery-consent.revoked", consent.id, "delivery-consent", { channel, customerRef });
    return { id: consent.id };
  }

  async queueDelivery(
    input: {
      businessId: string;
      channel: "email" | "whatsapp";
      customerRef: string;
      destination: string;
      documentId: string;
      locationId: string;
    },
    context: CommandContext,
  ) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope))) throw new DocumentsConflictError("The document outlet scope is invalid.");
    const document = await this.repo.document(input.documentId);
    if (!document || document.business_id !== input.businessId || document.location_id !== input.locationId) {
      throw new DocumentsConflictError("The delivery document is invalid.");
    }
    if (document.status !== "rendered") {
      throw new DocumentsConflictError("Only a rendered document can be delivered.");
    }
    const consent = await this.repo.consentFor(input.locationId, input.customerRef, input.channel);
    if (!consent || consent.status !== "granted" || consent.business_id !== input.businessId) {
      throw new DocumentsConflictError("The customer has not consented to this channel.");
    }
    if (input.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.destination)) {
      throw new DocumentsConflictError("The email destination is invalid.");
    }
    if (input.channel === "whatsapp" && !/^\+[1-9]\d{7,14}$/.test(input.destination)) {
      throw new DocumentsConflictError(
        "The WhatsApp destination must use international format, for example +919876543210.",
      );
    }
    const id = await this.repo.queueDelivery(
      scope,
      { ...input, consentId: consent.id },
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "delivery.queued", id, "delivery", {
      channel: input.channel,
      documentId: input.documentId,
    });
    return this.read(scope);
  }

  async recordDeliveryResult(
    deliveryId: string,
    status: "sent" | "failed",
    providerReference: string | undefined,
    error: string | undefined,
    context: CommandContext,
  ) {
    const delivery = await this.repo.delivery(deliveryId);
    if (!delivery) throw new DocumentsConflictError("The delivery is invalid.");
    if (delivery.status !== "queued") throw new DocumentsConflictError("Only a queued delivery can be resolved.");
    if (status === "sent" && !providerReference) {
      throw new DocumentsConflictError("A sent delivery requires a provider reference.");
    }
    if (status === "failed" && !error) throw new DocumentsConflictError("A failed delivery requires an error.");
    await this.repo.recordDeliveryResult(deliveryId, status, providerReference, error, this.timestamp());
    await this.record(context, status === "sent" ? "delivery.sent" : "delivery.failed", deliveryId, "delivery", {
      channel: delivery.channel,
    });
    return this.read({ businessId: delivery.business_id, locationId: delivery.location_id });
  }

  private timestamp() {
    return this.now().toISOString();
  }

  private record(
    context: CommandContext,
    event: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, {
      eventType: `qcafe.documents.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
