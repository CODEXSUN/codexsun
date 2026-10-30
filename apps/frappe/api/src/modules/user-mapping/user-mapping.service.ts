import { createHash } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { Selectable } from "kysely";
import { FrappeConnectionRepository, requestFrappe } from "../connection/index.js";
import type { FrappeSettings } from "../connection/index.js";
import { lookupFrappeUser } from "../user-sync/index.js";
import { FrappeUserMappingRepository } from "./user-mapping.repository.js";
import type { FrappeUserMappingContext, FrappeUserMappingRow } from "./user-mapping.types.js";

export class FrappeUserMappingService {
  private readonly repository: FrappeUserMappingRepository;

  constructor(
    private readonly context: FrappeUserMappingContext,
    private readonly defaults: FrappeSettings,
    private readonly encryptionSecret: string
  ) {
    this.repository = new FrappeUserMappingRepository(context.database);
  }

  async list() {
    const [localUsers, rows, connectionHash] = await Promise.all([
      this.context.localUsers(),
      this.repository.list(),
      this.connectionHash()
    ]);
    return {
      localUsers,
      links: rows.map((row) => toRecord(row, connectionHash))
    };
  }

  async audit() {
    const [localUsers, rows, connectionHash, credentials] = await Promise.all([
      this.context.localUsers(),
      this.repository.list(),
      this.connectionHash(),
      new FrappeConnectionRepository(this.context.database).credentials(this.encryptionSecret)
    ]);
    const settings = credentials?.settings ?? this.defaults;
    if (
      !credentials?.row.enabled ||
      credentials.row.verification_status !== "verified" ||
      !settings.baseUrl ||
      !settings.apiKey ||
      !settings.apiSecret
    )
      throw AppError.conflict("Verify the Frappe connection before auditing user mappings.");

    const [remoteUsers, employees] = await Promise.all([
      listRemote<UserRecord>(settings, "User", [
        "name",
        "full_name",
        "email",
        "enabled",
        "user_type"
      ]),
      listRemote<EmployeeRecord>(settings, "Employee", ["name", "user_id", "status"])
    ]);
    const localById = new Map(localUsers.map((user) => [user.id, user]));
    const usersById = new Map(remoteUsers.map((user) => [normalize(user.name), user]));
    const employeesByCode = new Map<string, EmployeeRecord[]>();
    const employeesByUser = new Map<string, EmployeeRecord[]>();
    const mappingsByEmployeeCode = new Map<string, Selectable<FrappeUserMappingRow>[]>();
    for (const employee of employees) {
      append(employeesByCode, normalize(employee.name), employee);
      if (employee.user_id) append(employeesByUser, normalize(employee.user_id), employee);
    }
    for (const row of rows) {
      if (row.employee_code) append(mappingsByEmployeeCode, normalize(row.employee_code), row);
    }
    const linkedLocalIds = new Set(rows.map((row) => Number(row.local_user_id)));
    const audits = rows.map((row) => {
      const local = localById.get(Number(row.local_user_id));
      const remote = usersById.get(normalize(row.frappe_user_id));
      const employeeMatches = employeesByCode.get(normalize(row.employee_code ?? "")) ?? [];
      const localMappingMatches =
        mappingsByEmployeeCode.get(normalize(row.employee_code ?? "")) ?? [];
      const employee = employeeMatches[0];
      const employeeUserMatches = employeesByUser.get(normalize(row.frappe_email)) ?? [];
      const issues: string[] = [];
      if (!local) issues.push("Local application user is missing.");
      else if (local.status !== "active") issues.push(`Local user is ${local.status}.`);
      if (row.connection_hash !== connectionHash)
        issues.push("Mapping belongs to a different Frappe site.");
      if (!remote) issues.push("Mapped Frappe User does not exist.");
      else {
        if (!remote.enabled) issues.push("Frappe User is disabled.");
        if (remote.user_type !== "System User") issues.push("Frappe User is not a System User.");
        if (normalize(remote.email ?? "") !== normalize(row.frappe_email))
          issues.push("Frappe User email does not match the mapped email.");
      }
      if (row.employee_code && !employee) issues.push("Mapped Employee code does not exist.");
      if (employee && normalize(employee.user_id ?? "") !== normalize(row.frappe_email))
        issues.push("Mapped Employee user_id does not match the mapped email.");
      if (employee && employee.status !== "Active")
        issues.push(`Mapped Employee is ${employee.status || "inactive"}.`);
      if (employeeMatches.length > 1) issues.push("Employee code resolves to multiple records.");
      if (localMappingMatches.length > 1)
        issues.push("Employee code is assigned to multiple local users.");
      if (employeeUserMatches.length > 1)
        issues.push("Frappe email resolves to multiple Employees.");
      return {
        localUserId: Number(row.local_user_id),
        localName: local?.name ?? "Missing local user",
        localEmail: local?.email ?? null,
        localStatus: local?.status ?? null,
        frappeUserId: row.frappe_user_id,
        frappeName: remote?.full_name?.trim() || remote?.name || null,
        frappeEmail: row.frappe_email,
        employeeCode: row.employee_code,
        employeeUserId: employee?.user_id ?? null,
        employeeStatus: employee?.status ?? null,
        connectionCurrent: row.connection_hash === connectionHash,
        status: issues.length ? ("mismatch" as const) : ("matched" as const),
        issues
      };
    });
    const unmapped = localUsers.filter((user) => !linkedLocalIds.has(user.id));
    return {
      checkedAt: new Date().toISOString(),
      totals: {
        localUsers: localUsers.length,
        mapped: rows.length,
        matched: audits.filter((row) => row.status === "matched").length,
        mismatched: audits.filter((row) => row.status === "mismatch").length,
        unmapped: unmapped.length
      },
      mappings: audits,
      unmapped: unmapped.map((user) => ({
        localUserId: user.id,
        localName: user.name,
        localEmail: user.email,
        localStatus: user.status
      }))
    };
  }

  async save(input: { localUserId: number; frappeUserId: string }) {
    const user = (await this.context.localUsers()).find((item) => item.id === input.localUserId);
    if (!user) throw AppError.notFound("Local application user was not found.");
    const connectionHash = await this.connectionHash();
    const remote = await lookupFrappeUser(
      this.context.database,
      this.defaults,
      this.encryptionSecret,
      input.frappeUserId
    );
    if (connectionHash !== (await this.connectionHash()))
      throw AppError.conflict("The Frappe connection changed while checking this user. Try again.");
    let saved: Awaited<ReturnType<FrappeUserMappingRepository["save"]>>;
    try {
      saved = await this.repository.save({
        local_user_id: user.id,
        frappe_user_id: remote.frappeUserId,
        frappe_email: remote.email,
        employee_code: remote.employeeCode,
        connection_hash: connectionHash
      });
    } catch (error) {
      if (isDuplicate(error))
        throw AppError.conflict("That Frappe user is already linked to another local user.");
      throw error;
    }
    await this.context.audit(saved.created ? "linked" : "updated", user, remote.frappeUserId);
    return toRecord(saved.row, connectionHash);
  }

  async remove(localUserId: number) {
    const user = (await this.context.localUsers()).find((item) => item.id === localUserId);
    if (!user) throw AppError.notFound("Local application user was not found.");
    const removed = await this.repository.remove(localUserId);
    if (!removed) throw AppError.notFound("This application user has no Frappe mapping.");
    await this.context.audit("unlinked", user, removed.frappe_user_id);
    return { localUserId };
  }

  private async connectionHash() {
    const stored = await new FrappeConnectionRepository(this.context.database).connection();
    const baseUrl = stored?.base_url || this.defaults.baseUrl;
    return createHash("sha256")
      .update(baseUrl ? new URL(baseUrl).origin.toLowerCase() : "unconfigured")
      .digest("hex");
  }
}

type UserRecord = {
  name: string;
  full_name?: string | null;
  email?: string | null;
  enabled?: number | boolean;
  user_type?: string | null;
};
type EmployeeRecord = { name: string; user_id?: string | null; status?: string | null };

async function listRemote<T extends { name: string }>(
  settings: FrappeSettings,
  doctype: string,
  fields: string[]
) {
  const output: T[] = [];
  for (let offset = 0; offset <= 10_000; offset += 100) {
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      limit_start: String(offset),
      limit_page_length: "100",
      order_by: "name asc"
    });
    const response = await requestFrappe<{ data?: T[] }>(
      `/api/resource/${encodeURIComponent(doctype)}?${query}`,
      "GET",
      settings
    );
    if (!Array.isArray(response.data))
      throw AppError.validation(`Frappe returned an invalid ${doctype} audit list.`);
    if (offset === 10_000 && response.data.length)
      throw AppError.conflict(`Frappe has more than 10,000 ${doctype} records to audit.`);
    output.push(...response.data);
    if (response.data.length < 100) break;
  }
  return output;
}

function append<T>(map: Map<string, T[]>, key: string, value: T) {
  if (!key) return;
  map.set(key, [...(map.get(key) ?? []), value]);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toRecord(row: Selectable<FrappeUserMappingRow>, connectionHash: string) {
  return {
    localUserId: Number(row.local_user_id),
    frappeUserId: row.frappe_user_id,
    frappeEmail: row.frappe_email,
    employeeCode: row.employee_code,
    connectionCurrent: row.connection_hash === connectionHash,
    verifiedAt: new Date(row.verified_at).toISOString()
  };
}

function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ER_DUP_ENTRY"
  );
}
