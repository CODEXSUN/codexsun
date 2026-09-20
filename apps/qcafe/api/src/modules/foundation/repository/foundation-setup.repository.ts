import { randomUUID } from "node:crypto";
import type { Kysely, Transaction } from "kysely";
import type {
  BusinessSetup,
  CreateBusinessSetup,
  CreateLocation,
  LocationSetup,
} from "../contracts/foundation-setup.contract.js";
import type { QcafeFoundationDatabase } from "../persistence/qcafe-foundation.database.js";

type FoundationDatabase = Kysely<QcafeFoundationDatabase> | Transaction<QcafeFoundationDatabase>;

export class FoundationSetupRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async list(): Promise<BusinessSetup[]> {
    const [businesses, locations, channels, sequences, days] = await Promise.all([
      this.database.selectFrom("qcafe_businesses").selectAll().orderBy("name").execute(),
      this.database.selectFrom("qcafe_locations").selectAll().orderBy("name").execute(),
      this.database.selectFrom("qcafe_service_channels").selectAll().orderBy("name").execute(),
      this.database.selectFrom("qcafe_number_sequences").selectAll().orderBy("document_kind").execute(),
      this.database.selectFrom("qcafe_business_days").selectAll().orderBy("opened_at", "desc").execute(),
    ]);

    return businesses.map((business) => ({
      currency: business.currency,
      id: business.id,
      legalName: business.legal_name,
      locations: locations
        .filter((location) => location.business_id === business.id)
        .map((location) => toLocationSetup(location, channels, sequences, days)),
      name: business.name,
      timezone: business.timezone,
    }));
  }

  async createBusiness(input: CreateBusinessSetup, now: string): Promise<string> {
    const businessId = randomUUID();
    await this.database.transaction().execute(async (transaction) => {
      await transaction
        .insertInto("qcafe_businesses")
        .values({
          created_at: now,
          currency: input.currency,
          id: businessId,
          legal_name: input.legalName ?? null,
          name: input.businessName,
          timezone: input.timezone,
          updated_at: now,
        })
        .execute();
      await insertLocation(
        transaction,
        {
          businessId,
          code: input.locationCode,
          name: input.locationName,
          timezone: input.timezone,
        },
        now,
      );
    });
    return businessId;
  }

  async createLocation(input: CreateLocation, now: string): Promise<string> {
    const locationId = randomUUID();
    await this.database.transaction().execute(async (transaction) => insertLocation(transaction, input, now, locationId));
    return locationId;
  }

  async businessExists(businessId: string): Promise<boolean> {
    return Boolean(
      await this.database.selectFrom("qcafe_businesses").select("id").where("id", "=", businessId).executeTakeFirst(),
    );
  }

  async locationExists(locationId: string): Promise<boolean> {
    return Boolean(
      await this.database.selectFrom("qcafe_locations").select("id").where("id", "=", locationId).executeTakeFirst(),
    );
  }

  async openBusinessDay(locationId: string, businessDate: string, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_business_days")
      .values({
        business_date: businessDate,
        closed_at: null,
        id,
        location_id: locationId,
        opened_at: now,
        status: "open",
      })
      .execute();
    return id;
  }
}

async function insertLocation(database: FoundationDatabase, input: CreateLocation, now: string, locationId = randomUUID()): Promise<void> {
  await database
    .insertInto("qcafe_locations")
    .values({
      business_id: input.businessId,
      code: input.code,
      created_at: now,
      id: locationId,
      name: input.name,
      status: "active",
      timezone: input.timezone,
      updated_at: now,
    })
    .execute();
  await database.insertInto("qcafe_service_channels").values(defaultChannels(locationId, now)).execute();
  await database.insertInto("qcafe_number_sequences").values(defaultSequences(locationId, now)).execute();
}

function defaultChannels(locationId: string, now: string) {
  return [
    { code: "COUNTER", kind: "counter" as const, name: "Counter", enabled: 1 },
    { code: "DINE_IN", kind: "dine_in" as const, name: "Dine in", enabled: 1 },
    { code: "TAKEAWAY", kind: "takeaway" as const, name: "Takeaway", enabled: 1 },
  ].map((channel) => ({ ...channel, created_at: now, id: randomUUID(), location_id: locationId }));
}

function defaultSequences(locationId: string, now: string) {
  return [
    { document_kind: "order" as const, prefix: "ORD" },
    { document_kind: "bill" as const, prefix: "BILL" },
    { document_kind: "kot" as const, prefix: "KOT" },
  ].map((sequence) => ({ ...sequence, id: randomUUID(), location_id: locationId, next_value: 1, updated_at: now }));
}

function toLocationSetup(
  location: QcafeFoundationDatabase["qcafe_locations"],
  channels: QcafeFoundationDatabase["qcafe_service_channels"][],
  sequences: QcafeFoundationDatabase["qcafe_number_sequences"][],
  days: QcafeFoundationDatabase["qcafe_business_days"][],
): LocationSetup {
  const day = days.find((candidate) => candidate.location_id === location.id && candidate.status === "open") ?? null;
  return {
    businessDay: day
      ? {
          businessDate: day.business_date,
          closedAt: day.closed_at,
          id: day.id,
          openedAt: day.opened_at,
          status: day.status,
        }
      : null,
    businessId: location.business_id,
    code: location.code,
    id: location.id,
    name: location.name,
    numberSequences: sequences
      .filter((sequence) => sequence.location_id === location.id)
      .map((sequence) => ({
        documentKind: sequence.document_kind,
        id: sequence.id,
        nextValue: sequence.next_value,
        prefix: sequence.prefix,
      })),
    serviceChannels: channels
      .filter((channel) => channel.location_id === location.id)
      .map((channel) => ({
        code: channel.code,
        enabled: channel.enabled === 1,
        id: channel.id,
        kind: channel.kind,
        name: channel.name,
      })),
    status: location.status,
    timezone: location.timezone,
  };
}
