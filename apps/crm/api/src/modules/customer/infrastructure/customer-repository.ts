import { randomUUID } from "node:crypto";
import type { CrmDatabaseQuery } from "../../foundation/persistence/crm-database.js";

export interface CreateAccountInput {
  readonly name: string;
  readonly kind?: string;
  readonly primaryPhone?: string;
  readonly primaryEmail?: string;
}

export interface CreateContactInput {
  readonly name: string;
  readonly phone?: string;
  readonly email?: string;
  readonly role?: string;
  readonly isPrimary?: boolean;
}

export class CustomerRepository {
  constructor(private readonly database: CrmDatabaseQuery) {}

  listAccounts() {
    return this.database.selectFrom("crm_accounts").selectAll().orderBy("created_at", "desc").execute();
  }

  async createAccount(input: CreateAccountInput) {
    const now = new Date().toISOString();
    const account = {
      created_at: now,
      id: randomUUID(),
      kind: input.kind?.trim() || "person",
      name: input.name.trim(),
      primary_email: input.primaryEmail?.trim() || null,
      primary_phone: input.primaryPhone?.trim() || null,
      updated_at: now,
    };
    await this.database.insertInto("crm_accounts").values(account).execute();
    return account;
  }

  async readAccount(accountId: string) {
    const account = await this.database.selectFrom("crm_accounts").selectAll().where("id", "=", accountId).executeTakeFirst();
    if (!account) return undefined;
    const [contacts, addresses, consents, communications] = await Promise.all([
      this.database.selectFrom("crm_contacts").selectAll().where("account_id", "=", accountId).orderBy("created_at", "desc").execute(),
      this.database.selectFrom("crm_addresses").selectAll().where("account_id", "=", accountId).orderBy("created_at", "desc").execute(),
      this.database.selectFrom("crm_consents").selectAll().where("account_id", "=", accountId).orderBy("captured_at", "desc").execute(),
      this.database.selectFrom("crm_communications").selectAll().where("account_id", "=", accountId).orderBy("occurred_at", "desc").execute(),
    ]);
    return { account, contacts, addresses, consents, communications };
  }

  async addContact(accountId: string, input: CreateContactInput) {
    const now = new Date().toISOString();
    const contact = {
      account_id: accountId,
      created_at: now,
      email: input.email?.trim() || null,
      id: randomUUID(),
      is_primary: input.isPrimary ? 1 : 0,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      role: input.role?.trim() || null,
      updated_at: now,
    };
    await this.database.insertInto("crm_contacts").values(contact).execute();
    return contact;
  }
}
