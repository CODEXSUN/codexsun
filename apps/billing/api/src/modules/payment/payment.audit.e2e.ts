import assert from "node:assert/strict";
import { sql } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import { PaymentService } from "./payment.service.js";
import { PaymentRepository } from "./payment.repository.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";

export async function verifyPaymentAudit(databaseName: string) {
  const service = new PaymentService(),
    repository = new PaymentRepository();
  const draft = await service.create(databaseName, {
    allocations: [],
    amount: 10,
    companyId: 1,
    currencyId: 1,
    supplierId: 1,
    discountAmount: 0,
    financialYearId: 1,
    ledgerId: 1,
    notes: "Audit fixture",
    paymentDate: "2026-10-01",
    paymentMode: "cash",
    paymentNumber: "PAY-AUDIT-1",
    referenceDate: "",
    referenceNo: "",
    roundOff: 0,
    tdsAmount: 0
  });
  await assert.rejects(
    () => repository.setStatus(databaseName, draft.id, "cancelled"),
    /status changed/
  );
  await service.post(databaseName, draft.id);
  await assert.rejects(() => repository.deleteDraft(databaseName, draft.id), /status changed/);
  assert.equal((await repository.get(databaseName, draft.id))?.status, "posted");
  await service.cancel(databaseName, draft.id);
  await assert.rejects(
    () => repository.setStatus(databaseName, draft.id, "posted"),
    /status changed/
  );
  const database = await getBillingDatabase(databaseName);
  await sql`UPDATE core_contacts SET deleted_at=UTC_TIMESTAMP(3) WHERE id=1`.execute(database);
  try {
    await assert.rejects(
      () =>
        service.create(databaseName, {
          ...draft,
          paymentNumber: "PAY-DELETED-PARTY",
          allocations: []
        }),
      /supplier is invalid/
    );
  } finally {
    await sql`UPDATE core_contacts SET deleted_at=NULL WHERE id=1`.execute(database);
  }
  const settings = new BillingSettingsRepository();
  const before = await settings.getBillingSettings(databaseName, 1);
  await Promise.all([
    settings.advanceNextNumber(databaseName, 1, "payment", 900),
    settings.advanceNextNumber(databaseName, 1, "receipt", 800),
    settings.advanceNextNumber(databaseName, 1, "payment", 500)
  ]);
  const after = await settings.getBillingSettings(databaseName, 1);
  assert.ok(after.numbering.payment.nextNumber >= 900);
  assert.ok(after.numbering.receipt.nextNumber >= 800);
  assert.deepEqual(after.features, before.features);
  const db = await getBillingDatabase(databaseName);
  const audit = await sql<{
    previous_status: string;
    new_status: string;
  }>`SELECT previous_status,new_status FROM billing_payment_activities WHERE payment_id=(SELECT id FROM billing_payments WHERE uuid=${draft.id}) AND action='cancelled'`.execute(
    db
  );
  assert.equal(audit.rows[0]?.previous_status, "posted");
  console.log(
    "PASS: payment lifecycle protection, retained posted payments, audit status, concurrent atomic numbering."
  );
}
