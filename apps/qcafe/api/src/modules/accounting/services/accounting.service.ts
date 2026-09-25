import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { AccountingScope } from "../contracts/accounting.contract.js";
import { CLEARING_BY_METHOD_KIND, AccountingRepository } from "../repository/accounting.repository.js";

export class AccountingConflictError extends Error {}

type JournalSource = "bill" | "payment" | "refund" | "voucher-issue" | "voucher-apply";

export class AccountingService {
  constructor(
    private readonly repo: AccountingRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: AccountingScope) {
    return this.repo.workspace(scope);
  }

  async generate(sourceType: JournalSource, sourceId: string, context: CommandContext) {
    const existing = await this.repo.journalBySource(sourceType, sourceId);
    if (existing) return { id: existing.id };
    const built = await this.buildLines(sourceType, sourceId);
    await this.repo.ensureChart(built.scope.businessId, this.timestamp());
    const accounts = new Map<string, string>();
    for (const code of new Set(built.lines.map((line) => line.accountCode))) {
      const account = await this.repo.accountByCode(built.scope.businessId, code);
      if (!account || !account.active) throw new AccountingConflictError(`Account ${code} is unavailable.`);
      accounts.set(code, account.id);
    }
    const debit = built.lines.reduce((sum, line) => sum + line.debitMinor, 0);
    const credit = built.lines.reduce((sum, line) => sum + line.creditMinor, 0);
    if (debit <= 0 || debit !== credit) throw new AccountingConflictError("The journal does not balance.");
    const number = await this.repo.nextJournalNumber(built.scope.locationId, this.timestamp());
    const id = await this.repo.createJournal(
      built.scope,
      { number, sourceId, sourceType },
      built.lines.map((line) => ({ ...line, accountId: accounts.get(line.accountCode)! })),
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "journal.generated", id, "journal", { number, sourceType });
    return { id };
  }

  private async buildLines(sourceType: JournalSource, sourceId: string) {
    switch (sourceType) {
      case "bill":
        return this.billLines(sourceId);
      case "payment":
        return this.paymentLines(sourceId);
      case "refund":
        return this.refundLines(sourceId);
      case "voucher-issue":
        return this.voucherIssueLines(sourceId);
      case "voucher-apply":
        return this.voucherApplyLines(sourceId);
    }
  }

  private scopeOf(businessId: string, locationId: string): AccountingScope {
    return { businessId, locationId };
  }

  private async billLines(billId: string) {
    const bill = await this.repo.bill(billId);
    if (!bill) throw new AccountingConflictError("The bill is invalid.");
    if (!["posted", "part_paid", "paid"].includes(bill.status)) {
      throw new AccountingConflictError("Only a posted bill generates a journal.");
    }
    const scope = this.scopeOf(bill.business_id, bill.location_id);
    if (!(await this.repo.location(scope))) throw new AccountingConflictError("The outlet scope is invalid.");
    const lines = [
      { accountCode: "1100", creditMinor: 0, debitMinor: bill.payable_minor, memo: `Bill ${bill.number}` },
      {
        accountCode: "4000",
        creditMinor: bill.payable_minor - bill.tax_minor,
        debitMinor: 0,
        memo: `Bill ${bill.number}`,
      },
    ];
    if (bill.tax_minor > 0) {
      lines.push({
        accountCode: "2000",
        creditMinor: bill.tax_minor,
        debitMinor: 0,
        memo: `GST on bill ${bill.number}`,
      });
    }
    return { lines, scope };
  }

  private async clearingFor(methodId: string) {
    const method = await this.repo.paymentMethod(methodId);
    if (!method || !method.active) throw new AccountingConflictError("The payment method is invalid.");
    const code = CLEARING_BY_METHOD_KIND[method.kind] ?? "1030";
    return { code, method };
  }

  private async paymentLines(paymentId: string) {
    const payment = await this.repo.payment(paymentId);
    if (!payment || payment.status !== "posted" || payment.direction !== "in" || payment.purpose !== "sale") {
      throw new AccountingConflictError("Only a posted sale payment generates a journal.");
    }
    const scope = await this.scopeFromLocation(payment.location_id);
    const { code } = await this.clearingFor(payment.payment_method_id);
    return {
      lines: [
        { accountCode: code, creditMinor: 0, debitMinor: payment.amount_minor, memo: `Payment ${payment.id}` },
        {
          accountCode: "1100",
          creditMinor: payment.amount_minor,
          debitMinor: 0,
          memo: `Bill ${payment.bill_id ?? "direct"}`,
        },
      ],
      scope,
    };
  }

  private async scopeFromLocation(locationId: string): Promise<AccountingScope> {
    const location = await this.repo.businessForLocation(locationId);
    if (!location) throw new AccountingConflictError("The outlet scope is invalid.");
    return { businessId: location.business_id, locationId: location.id };
  }

  private async refundLines(paymentId: string) {
    const payment = await this.repo.payment(paymentId);
    if (
      !payment ||
      payment.status !== "posted" ||
      payment.direction !== "out" ||
      (payment.purpose !== "refund" && payment.purpose !== "reversal")
    ) {
      throw new AccountingConflictError("Only a posted refund generates a journal.");
    }
    const scope = await this.scopeFromLocation(payment.location_id);
    const { code } = await this.clearingFor(payment.payment_method_id);
    return {
      lines: [
        { accountCode: "4000", creditMinor: 0, debitMinor: payment.amount_minor, memo: `Refund ${payment.id}` },
        { accountCode: code, creditMinor: payment.amount_minor, debitMinor: 0, memo: `Refund ${payment.id}` },
      ],
      scope,
    };
  }

  private async voucherIssueLines(paymentId: string) {
    const payment = await this.repo.payment(paymentId);
    if (!payment || payment.status !== "posted" || payment.direction !== "in" || payment.purpose !== "advance") {
      throw new AccountingConflictError("Only a posted advance generates a voucher-issue journal.");
    }
    const scope = await this.scopeFromLocation(payment.location_id);
    const { code } = await this.clearingFor(payment.payment_method_id);
    return {
      lines: [
        { accountCode: code, creditMinor: 0, debitMinor: payment.amount_minor, memo: `Advance ${payment.id}` },
        { accountCode: "1100", creditMinor: payment.amount_minor, debitMinor: 0, memo: `Advance ${payment.id}` },
      ],
      scope,
    };
  }

  private async voucherApplyLines(applicationId: string) {
    const application = await this.repo.voucherApplication(applicationId);
    if (!application) throw new AccountingConflictError("The voucher application is invalid.");
    const voucher = await this.repo.voucher(application.voucher_id);
    if (!voucher) throw new AccountingConflictError("The voucher is invalid.");
    const scope = this.scopeOf(voucher.business_id, voucher.location_id);
    return {
      lines: [
        {
          accountCode: "1100",
          creditMinor: 0,
          debitMinor: application.applied_minor,
          memo: `Voucher ${voucher.number}`,
        },
        {
          accountCode: "1100",
          creditMinor: application.applied_minor,
          debitMinor: 0,
          memo: `Bill ${application.bill_id}`,
        },
      ],
      scope,
    };
  }

  async postJournal(journalId: string, context: CommandContext) {
    const journal = await this.repo.journal(journalId);
    if (!journal || journal.status !== "draft")
      throw new AccountingConflictError("Only a draft journal can be posted.");
    const lines = await this.repo.journalLines(journalId);
    const debit = lines.reduce((sum, line) => sum + line.debit_minor, 0);
    const credit = lines.reduce((sum, line) => sum + line.credit_minor, 0);
    if (!lines.length || debit <= 0 || debit !== credit)
      throw new AccountingConflictError("The journal does not balance.");
    await this.repo.postJournal(journalId, this.timestamp());
    await this.record(context, "journal.posted", journalId, "journal", { number: journal.number });
    return { id: journalId };
  }

  async exportCsv(scope: AccountingScope, status: "draft" | "posted", fromDate?: string, toDate?: string) {
    if (!(await this.repo.location(scope))) throw new AccountingConflictError("The outlet scope is invalid.");
    const state = await this.repo.workspace(scope);
    const accounts = new Map(state.accounts.map((account) => [account.id, account]));
    const rows = [
      "journal_number,status,source_type,source_id,account_code,account_name,debit_minor,credit_minor,memo",
    ];
    let journals = 0;
    for (const journal of state.journals) {
      if (journal.status !== status) continue;
      if (fromDate && !journal.created_at.startsWith(fromDate)) continue;
      if (toDate && journal.created_at.slice(0, 10) > toDate) continue;
      journals += 1;
      for (const line of state.journalLines.filter((row) => row.journal_id === journal.id)) {
        const account = accounts.get(line.account_id);
        rows.push(
          [
            journal.number,
            journal.status,
            journal.source_type,
            journal.source_id,
            account?.code ?? "",
            `"${account?.name ?? ""}"`,
            line.debit_minor,
            line.credit_minor,
            `"${(line.memo ?? "").replace(/"/g, "'")}"`,
          ].join(","),
        );
      }
    }
    return { csv: rows.join("\n"), journals, lines: rows.length - 1 };
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
      eventType: `qcafe.accounting.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
