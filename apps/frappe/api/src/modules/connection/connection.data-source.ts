import { AppError } from "@codexsun/framework/errors";
import type {
  EnquiryRemoteSource,
  LiveEnquiryInput,
  LiveEnquiryPatch,
  LiveEnquiryQuery,
  LiveEnquiryEstimateInput,
  LiveEnquiryJobInput
} from "@codexsun/crm-api";
import type { Kysely } from "kysely";
import { FrappeConnectionRepository } from "./connection.repository.js";
import { getLiveFrappeEnquiry, listLiveFrappeEnquiries } from "./connection.live-enquiries.js";
import { LiveFrappeActions } from "./connection.live-actions.js";
import type { FrappeDatabase, FrappeSettings } from "./connection.types.js";
import { aggregateFrappeEnquiries } from "./connection.aggregate-enquiries.js";

export class FrappeCrmEnquirySource implements EnquiryRemoteSource {
  private readonly repository: FrappeConnectionRepository;

  constructor(
    private readonly database: Kysely<FrappeDatabase>,
    private readonly settings: FrappeSettings,
    private readonly encryptionSecret: string,
    private readonly frappeEnabled: boolean,
    private readonly actorEmail: string,
    private readonly canViewAll: boolean,
    private readonly mappedEmployeeCode: (email: string, baseUrl: string) => Promise<string | null>
  ) {
    this.repository = new FrappeConnectionRepository(database);
  }

  provider() {
    return this.frappeEnabled
      ? this.repository.provider("crm.enquiries")
      : Promise.resolve("local" as const);
  }

  async list(query: LiveEnquiryQuery) {
    if (!this.frappeEnabled) throw AppError.forbidden("Frappe is not enabled for this tenant.");
    const connection = await this.repository.connection();
    const employee =
      query.scope === "all" && this.canViewAll
        ? null
        : await this.mappedEmployeeCode(this.actorEmail, connection?.base_url ?? "");
    return listLiveFrappeEnquiries(
      this.database,
      this.settings,
      this.encryptionSecret,
      query,
      employee,
      this.canViewAll
    );
  }

  async get(name: string) {
    if (!this.frappeEnabled) throw AppError.forbidden("Frappe is not enabled for this tenant.");
    const settings = await this.verifiedSettings();
    const employee = this.canViewAll ? null : await this.employeeCode(settings.baseUrl);
    return getLiveFrappeEnquiry(
      this.database,
      this.settings,
      this.encryptionSecret,
      name,
      employee,
      this.canViewAll
    );
  }

  async options() {
    return (await this.actions()).options();
  }

  async createOption(kind: "list-in" | "status" | "priority", name: string) {
    return (await this.actions()).createOption(kind, name);
  }

  async create(input: LiveEnquiryInput) {
    const name = await (await this.actions()).create(input);
    return this.get(name);
  }

  async update(name: string, input: LiveEnquiryPatch) {
    await (await this.actions()).update(name, input);
    return this.get(name);
  }

  async addMessage(name: string, body: string, parentName: string | null) {
    await (await this.actions()).addMessage(name, body, parentName);
    return this.get(name);
  }

  async suspendMessage(name: string, messageName: string) {
    await (await this.actions()).suspendMessage(name, messageName);
    return this.get(name);
  }

  async openNewCall(name: string) {
    await (await this.actions()).openNewCall(name);
    return this.get(name);
  }

  async delete(name: string) {
    return (await this.actions()).delete(name);
  }

  async jobs(name: string) {
    return (await this.actions()).jobs(name);
  }

  async startJob(name: string) {
    return (await this.actions()).startJob(name);
  }

  async stopJob(name: string, jobName: string) {
    return (await this.actions()).stopJob(name, jobName);
  }

  async saveJob(name: string, input: LiveEnquiryJobInput, jobName?: string) {
    return (await this.actions()).saveJob(name, input, jobName);
  }

  async estimates(name: string) {
    return (await this.actions()).estimates(name);
  }

  async saveEstimate(name: string, input: LiveEnquiryEstimateInput, estimateName?: string) {
    return (await this.actions()).saveEstimate(name, input, estimateName);
  }

  async report(query: {
    view: "list-in" | "creator" | "assignee" | "status";
    fromDate?: string | undefined;
    toDate?: string | undefined;
    assignee?: string | undefined;
  }) {
    const settings = await this.verifiedSettings();
    const employee = await this.employeeCode(settings.baseUrl);
    const field = {
      "list-in": "group",
      creator: "user_employee",
      assignee: "assigned_to_employee",
      status: "status"
    }[query.view];
    const filters: Array<[string, string, string]> = [];
    if (query.fromDate) filters.push(["date", ">=", query.fromDate]);
    if (query.toDate) filters.push(["date", "<=", query.toDate]);
    if (query.assignee)
      filters.push([
        "assigned_to_employee",
        query.assignee === "none" ? "is" : "=",
        query.assignee === "none" ? "not set" : query.assignee
      ]);
    const rows = await aggregateFrappeEnquiries(
      settings,
      query.view === "status" ? ["status"] : [field, "status"],
      filters,
      employee,
      this.canViewAll
    );
    return rows.map((row) => ({
      group: row[field] ? String(row[field]) : null,
      status: row.status ? String(row.status) : null,
      count: row.count
    }));
  }

  async summary(_today: string) {
    const settings = await this.verifiedSettings();
    const employee = await this.employeeCode(settings.baseUrl);
    const grouped = async (
      field: "status" | "priority",
      filters: Array<[string, string, string]>
    ) => aggregateFrappeEnquiries(settings, [field], filters, employee, this.canViewAll);
    const allStatuses = await grouped("status", []);
    const allCount = allStatuses.reduce((total, row) => total + row.count, 0);
    if (!employee)
      return {
        allCount,
        assigned: { total: 0, statusCounts: [], priorityCounts: [] },
        created: { total: 0, statusCounts: [], priorityCounts: [] }
      };
    const [assignedStatuses, assignedPriorities, createdStatuses, createdPriorities] =
      await Promise.all([
        grouped("status", [["assigned_to_employee", "=", employee]]),
        grouped("priority", [["assigned_to_employee", "=", employee]]),
        grouped("status", [["user_employee", "=", employee]]),
        grouped("priority", [["user_employee", "=", employee]])
      ]);
    const scope = async (
      field: "assigned_to_employee" | "user_employee",
      statuses: typeof assignedStatuses,
      priorities: typeof assignedPriorities
    ) => {
      const base: Array<[string, string, string]> = [[field, "=", employee]];
      const days7 = frappeDateTimeDaysAgo(7);
      const days30 = frappeDateTimeDaysAgo(30);
      const recentCount = async (dateField: "creation" | "modified", threshold: string) => {
        const rows = await grouped("status", [...base, [dateField, ">=", threshold]]);
        return rows.reduce((total, row) => total + row.count, 0);
      };
      const [created7, created30, updated7, updated30] = await Promise.all([
        recentCount("creation", days7),
        recentCount("creation", days30),
        recentCount("modified", days7),
        recentCount("modified", days30)
      ]);
      return {
      total: statuses.reduce((total, row) => total + row.count, 0),
      statusCounts: statuses.map((row) => ({ code: String(row.status ?? ""), count: row.count })),
      priorityCounts: priorities.map((row) => ({
        code: String(row.priority ?? ""),
        count: row.count
      })),
      created7,
      created30,
      updated7,
      updated30
      };
    };
    const [assigned, created] = await Promise.all([
      scope("assigned_to_employee", assignedStatuses, assignedPriorities),
      scope("user_employee", createdStatuses, createdPriorities)
    ]);
    return {
      allCount,
      assigned,
      created
    };
  }

  private async verifiedSettings() {
    if (!this.frappeEnabled || (await this.provider()) !== "frappe")
      throw AppError.conflict("CRM Enquiries is set to Local.");
    const saved = await this.repository.credentials(this.encryptionSecret);
    if (!saved || saved.row.verification_status !== "verified" || !saved.settings.enabled)
      throw AppError.conflict("The live Frappe connection is not verified and enabled.");
    return saved.settings;
  }

  private async actions() {
    const settings = await this.verifiedSettings();
    const employee = await this.employeeCode(settings.baseUrl);
    return new LiveFrappeActions(settings, employee, this.canViewAll);
  }

  private async employeeCode(baseUrl: string) {
    const employee = await this.mappedEmployeeCode(this.actorEmail, baseUrl);
    if (!employee && !this.canViewAll)
      throw AppError.forbidden("Map this CRM user to a Frappe employee to view live enquiries.");
    return employee;
  }
}

function frappeDateTimeDaysAgo(days: number) {
  const value = new Date(Date.now() - days * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}
