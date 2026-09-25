import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { DocumentsRepository } from "../repository/documents.repository.js";
import { DocumentsConflictError, DocumentsService } from "../services/documents.service.js";

const context = { actorId: "cashier-1", correlationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
const now = () => new Date("2026-09-24T12:00:00.000Z");

async function setup() {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  await persistence.initialize();
  const database = persistence.database();
  const activity = new ActivityRepository(database, now);
  const foundation = new FoundationSetupService(
    new FoundationSetupRepository(database),
    { localDatabasePath: ":memory:", mode: "local" },
    activity,
    now,
  );
  const created = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = created.businesses[0]!;
  const location = business.locations[0]!;
  const documents = new DocumentsService(new DocumentsRepository(database), activity, now);
  return { business, documents, location };
}

test("creates the durable document before any print job is queued", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const profile = await documents.createPrinterProfile(
    { ...scope, code: "COUNTER", kind: "direct", name: "Counter" },
    context,
  );
  await documents.createPrinterRoute(
    { documentKind: "receipt", locationId: location.id, priority: 0, printerProfileId: profile.id },
    context,
  );
  const draft = await documents.createDocument({ ...scope, kind: "receipt", title: "Bill 1" }, context);
  await assert.rejects(
    documents.queuePrintJob({ ...scope, documentId: draft.id, preview: false }, context),
    DocumentsConflictError,
  );
  await assert.rejects(
    documents.queuePrintJob({ ...scope, documentId: "00000000-0000-4000-8000-000000000000", preview: false }, context),
    DocumentsConflictError,
  );
  await documents.renderDocument(draft.id, context);
  const state = await documents.queuePrintJob({ ...scope, documentId: draft.id, preview: false }, context);
  assert.equal(state.documents.length, 1);
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0]!.document_id, draft.id);
  assert.equal(state.jobs[0]!.attempt_count, 1);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0]!.status, "queued");
  assert.equal(state.attempts[0]!.attempt_number, 1);
});

test("records attempts without removing the original and supports reprint", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const profile = await documents.createPrinterProfile(
    { ...scope, code: "KOT", kind: "direct", name: "Kitchen" },
    context,
  );
  const draft = await documents.createDocument({ ...scope, kind: "kot", title: "KOT 7" }, context);
  await documents.renderDocument(draft.id, context);
  let state = await documents.queuePrintJob(
    { ...scope, documentId: draft.id, preview: false, printerProfileId: profile.id },
    context,
  );
  const jobId = state.jobs[0]!.id;
  state = await documents.recordAttempt(jobId, "failed", "Paper jam", context);
  assert.equal(state.jobs[0]!.status, "failed");
  state = await documents.reprint(jobId, context);
  assert.equal(state.jobs[0]!.status, "pending");
  assert.deepEqual(
    state.attempts.map((attempt) => [attempt.attempt_number, attempt.status]),
    [
      [1, "queued"],
      [2, "failed"],
      [3, "queued"],
    ],
  );
  state = await documents.recordAttempt(jobId, "acknowledged", undefined, context);
  assert.equal(state.jobs[0]!.status, "acknowledged");
  await assert.rejects(documents.reprint(jobId, context), DocumentsConflictError);
  await assert.rejects(documents.recordAttempt(jobId, "failed", "Late failure", context), DocumentsConflictError);
});

test("an operator confirms a preview job before the print attempt starts", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const profile = await documents.createPrinterProfile(
    { ...scope, code: "COUNTER", kind: "direct", name: "Counter" },
    context,
  );
  const draft = await documents.createDocument({ ...scope, kind: "receipt", title: "Bill 9" }, context);
  await documents.renderDocument(draft.id, context);
  let state = await documents.queuePrintJob(
    { ...scope, documentId: draft.id, preview: true, printerProfileId: profile.id },
    context,
  );
  const jobId = state.jobs[0]!.id;
  assert.equal(state.jobs[0]!.status, "preview");
  assert.equal(state.attempts.length, 0);
  assert.equal(state.previews.length, 1);
  assert.equal(state.previews[0]!.status, "pending");
  await assert.rejects(documents.recordAttempt(jobId, "acknowledged", undefined, context), DocumentsConflictError);
  state = await documents.confirmPreview(jobId, context);
  assert.equal(state.jobs[0]!.status, "pending");
  assert.equal(state.previews[0]!.status, "confirmed");
  assert.deepEqual(
    state.attempts.map((attempt) => [attempt.attempt_number, attempt.status]),
    [[1, "queued"]],
  );
  await assert.rejects(documents.confirmPreview(jobId, context), DocumentsConflictError);
});

test("a direct job records request, acknowledgement, retry, and failure with idempotency", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const profile = await documents.createPrinterProfile(
    { ...scope, code: "DIRECT", kind: "direct", name: "Windows service" },
    context,
  );
  const draft = await documents.createDocument({ ...scope, kind: "kot", title: "KOT direct" }, context);
  await documents.renderDocument(draft.id, context);
  const queued = {
    ...scope,
    documentId: draft.id,
    idempotencyKey: "direct-1",
    preview: false,
    printerProfileId: profile.id,
  };
  let state = await documents.queuePrintJob(queued, context);
  const jobId = state.jobs[0]!.id;
  assert.equal(state.jobs[0]!.status, "pending");
  state = await documents.queuePrintJob(queued, context);
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0]!.id, jobId);
  assert.equal(state.attempts.length, 1);
  state = await documents.recordAttempt(jobId, "failed", "Service offline", context);
  assert.equal(state.jobs[0]!.status, "failed");
  state = await documents.reprint(jobId, context);
  assert.equal(state.jobs[0]!.status, "pending");
  state = await documents.recordAttempt(jobId, "acknowledged", undefined, context);
  assert.equal(state.jobs[0]!.status, "acknowledged");
  assert.deepEqual(
    state.attempts.map((attempt) => [attempt.attempt_number, attempt.status]),
    [
      [1, "queued"],
      [2, "failed"],
      [3, "queued"],
      [4, "acknowledged"],
    ],
  );
  const other = await documents.queuePrintJob({ ...queued, idempotencyKey: "direct-2" }, context);
  assert.equal(other.jobs.length, 2);
});

test("deliveries use a rendered document, customer consent, and a provider reference", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const draft = await documents.createDocument({ ...scope, kind: "receipt", title: "Bill email" }, context);
  await assert.rejects(
    documents.queueDelivery(
      { ...scope, channel: "email", customerRef: "C-1", destination: "a@example.com", documentId: draft.id },
      context,
    ),
    DocumentsConflictError,
  );
  await documents.renderDocument(draft.id, context);
  await assert.rejects(
    documents.queueDelivery(
      { ...scope, channel: "email", customerRef: "C-1", destination: "a@example.com", documentId: draft.id },
      context,
    ),
    DocumentsConflictError,
  );
  await documents.grantConsent(business.id, location.id, "C-1", "email", context);
  await assert.rejects(
    documents.queueDelivery(
      { ...scope, channel: "email", customerRef: "C-1", destination: "not-an-email", documentId: draft.id },
      context,
    ),
    DocumentsConflictError,
  );
  let state = await documents.queueDelivery(
    { ...scope, channel: "email", customerRef: "C-1", destination: "a@example.com", documentId: draft.id },
    context,
  );
  const deliveryId = state.deliveries[0]!.id;
  assert.equal(state.deliveries[0]!.status, "queued");
  await assert.rejects(
    documents.recordDeliveryResult(deliveryId, "sent", undefined, undefined, context),
    DocumentsConflictError,
  );
  state = await documents.recordDeliveryResult(deliveryId, "sent", "smtp-1", undefined, context);
  assert.equal(state.deliveries[0]!.status, "sent");
  assert.equal(state.deliveries[0]!.provider_reference, "smtp-1");
  await assert.rejects(
    documents.recordDeliveryResult(deliveryId, "failed", undefined, "Late bounce", context),
    DocumentsConflictError,
  );
});

test("whatsapp delivery requires consent and revocation blocks new sends", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const draft = await documents.createDocument({ ...scope, kind: "receipt", title: "Bill WA" }, context);
  await documents.renderDocument(draft.id, context);
  await documents.grantConsent(business.id, location.id, "C-9", "whatsapp", context);
  await assert.rejects(
    documents.queueDelivery(
      { ...scope, channel: "whatsapp", customerRef: "C-9", destination: "9876543210", documentId: draft.id },
      context,
    ),
    DocumentsConflictError,
  );
  let state = await documents.queueDelivery(
    { ...scope, channel: "whatsapp", customerRef: "C-9", destination: "+919876543210", documentId: draft.id },
    context,
  );
  const failedId = state.deliveries[0]!.id;
  await assert.rejects(
    documents.recordDeliveryResult(failedId, "failed", undefined, undefined, context),
    DocumentsConflictError,
  );
  state = await documents.recordDeliveryResult(failedId, "failed", undefined, "Provider rejected", context);
  assert.equal(state.deliveries[0]!.status, "failed");
  await documents.revokeConsent(business.id, location.id, "C-9", "whatsapp", context);
  await assert.rejects(
    documents.queueDelivery(
      { ...scope, channel: "whatsapp", customerRef: "C-9", destination: "+919876543210", documentId: draft.id },
      context,
    ),
    DocumentsConflictError,
  );
});

test("unavailable printers keep jobs pending or follow fallback routes", async () => {
  const { business, documents, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const bluetooth = await documents.createPrinterProfile(
    { ...scope, code: "BT", kind: "bluetooth", name: "Portable" },
    context,
  );
  const draft = await documents.createDocument({ ...scope, kind: "receipt", title: "Bill fallback" }, context);
  await documents.renderDocument(draft.id, context);
  let state = await documents.queuePrintJob(
    { ...scope, documentId: draft.id, preview: false, printerProfileId: bluetooth.id },
    context,
  );
  const heldId = state.jobs[0]!.id;
  state = await documents.dispatchPrintJob(heldId, context);
  assert.equal(state.jobs.find((job) => job.id === heldId)!.status, "pending");
  assert.equal(state.dispatches[0]!.decision, "unavailable");

  const gateway = await documents.createPrinterProfile(
    { ...scope, code: "GW", configRef: "https://print.local/gw", kind: "gateway", name: "Gateway" },
    context,
  );
  await documents.createPrinterRoute(
    {
      documentKind: "receipt",
      fallbackProfileId: gateway.id,
      locationId: location.id,
      priority: 1,
      printerProfileId: bluetooth.id,
    },
    context,
  );
  state = await documents.dispatchPrintJob(heldId, context);
  const rerouted = state.jobs.find((job) => job.id === heldId)!;
  assert.equal(rerouted.printer_profile_id, gateway.id);
  assert.equal(rerouted.status, "pending");
  assert.equal(state.dispatches[state.dispatches.length - 1]!.decision, "rerouted");

  state = await documents.dispatchPrintJob(heldId, context);
  assert.equal(state.jobs.find((job) => job.id === heldId)!.status, "processing");
  assert.equal(state.dispatches[state.dispatches.length - 1]!.decision, "dispatched");
});
