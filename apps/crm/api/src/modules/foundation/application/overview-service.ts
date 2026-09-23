import type { CrmDatabaseQuery } from "../persistence/crm-database.js";

export interface CrmOverview {
  readonly counts: {
    readonly campaigns: number;
    readonly leads: number;
    readonly openEnquiries: number;
    readonly activeWork: number;
    readonly pendingCollection: number;
    readonly pendingVerification: number;
  };
  readonly recentEnquiries: readonly {
    readonly id: string;
    readonly subject: string;
    readonly priority: string;
    readonly status: string;
    readonly createdAt: string;
  }[];
}

export class OverviewService {
  constructor(private readonly database: CrmDatabaseQuery) {}

  async read(): Promise<CrmOverview> {
    const [campaigns, leads, openEnquiries, activeWork, pendingCollection, pendingVerification, recentEnquiries] =
      await Promise.all([
        this.count("crm_campaigns"),
        this.count("crm_leads"),
        this.count("crm_enquiries", (query) => query.where("status", "in", ["open", "in_progress"])),
        this.count("crm_work_orders", (query) => query.where("status", "in", ["scheduled", "in_progress"])),
        this.count("crm_collection_plans", (query) => query.where("status", "in", ["pending", "overdue"])),
        this.count("crm_verifications", (query) => query.where("status", "in", ["pending", "failed"])),
        this.database
          .selectFrom("crm_enquiries")
          .select(["id", "subject", "priority", "status", "created_at"])
          .orderBy("created_at", "desc")
          .limit(6)
          .execute(),
      ]);
    return {
      counts: { activeWork, campaigns, leads, openEnquiries, pendingCollection, pendingVerification },
      recentEnquiries: recentEnquiries.map((item) => ({
        createdAt: item.created_at,
        id: item.id,
        priority: item.priority,
        status: item.status,
        subject: item.subject,
      })),
    };
  }

  private count(table: "crm_campaigns" | "crm_leads" | "crm_enquiries" | "crm_work_orders" | "crm_collection_plans" | "crm_verifications", filter?: (query: any) => any): Promise<number> {
    let query = this.database.selectFrom(table).select(({ fn }) => fn.countAll<number>().as("count"));
    if (filter) query = filter(query);
    return query.executeTakeFirst().then((row) => Number(row?.count ?? 0));
  }
}
