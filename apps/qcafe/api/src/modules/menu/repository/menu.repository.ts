import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  CreateMenuCategory, CreateMenuItem, CreateMenuVariant, CreatePriceBook, MenuCatalog, MenuPrice, SetMenuPrice,
} from "../contracts/menu.contract.js";

export class MenuRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async list(businessId: string): Promise<MenuCatalog> {
    const [categories, items, variants, priceBooks, prices] = await Promise.all([
      this.database.selectFrom("qcafe_menu_categories").selectAll().where("business_id", "=", businessId).orderBy("sort_order").orderBy("name").execute(),
      this.database.selectFrom("qcafe_menu_items").selectAll().where("business_id", "=", businessId).orderBy("name").execute(),
      this.database.selectFrom("qcafe_menu_variants").innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_menu_variants.item_id")
        .select(["qcafe_menu_variants.id", "qcafe_menu_variants.item_id", "qcafe_menu_variants.code", "qcafe_menu_variants.name", "qcafe_menu_variants.active"])
        .where("qcafe_menu_items.business_id", "=", businessId).orderBy("qcafe_menu_variants.name").execute(),
      this.database.selectFrom("qcafe_price_books").selectAll().where("business_id", "=", businessId).orderBy("name").execute(),
      this.database.selectFrom("qcafe_menu_prices").innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_menu_prices.item_id")
        .selectAll("qcafe_menu_prices").where("qcafe_menu_items.business_id", "=", businessId).orderBy("valid_from", "desc").execute(),
    ]);
    return {
      categories: categories.map((row) => ({ active: row.active === 1, code: row.code, id: row.id, name: row.name, sortOrder: row.sort_order })),
      items: items.map((row) => ({ active: row.active === 1, businessId: row.business_id, categoryId: row.category_id, code: row.code, id: row.id, itemType: row.item_type, name: row.name, taxCode: row.tax_code,
        variants: variants.filter((variant) => variant.item_id === row.id).map((variant) => ({ active: variant.active === 1, code: variant.code, id: variant.id, name: variant.name })) })),
      priceBooks: priceBooks.map((row) => ({ active: row.active === 1, code: row.code, currency: row.currency, id: row.id, name: row.name })),
      prices: prices.map(toMenuPrice),
    };
  }

  async createCategory(input: CreateMenuCategory, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_menu_categories").values({ active: 1, business_id: input.businessId, code: input.code, created_at: now, id, name: input.name, parent_id: null, sort_order: input.sortOrder, updated_at: now, version: 1 }).execute();
    return id;
  }
  async createItem(input: CreateMenuItem, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_menu_items").values({ active: 1, business_id: input.businessId, category_id: input.categoryId, code: input.code, created_at: now, id, item_type: input.itemType, name: input.name, tax_code: input.taxCode ?? null, updated_at: now, version: 1 }).execute();
    return id;
  }
  async createVariant(input: CreateMenuVariant, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_menu_variants").values({ active: 1, code: input.code, created_at: now, id, item_id: input.itemId, name: input.name, quantity_basis_milli: 1000, updated_at: now, version: 1 }).execute();
    return id;
  }
  async createPriceBook(input: CreatePriceBook, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_price_books").values({ active: 1, business_id: input.businessId, code: input.code, created_at: now, currency: input.currency, id, location_id: null, name: input.name, service_channel_id: null, status: "active", updated_at: now, valid_from: now.slice(0, 10), valid_to: null, version: 1 }).execute();
    return id;
  }
  async setPrice(input: SetMenuPrice, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_menu_prices").values({ active: 1, amount_minor: input.amountMinor, created_at: now, id, item_id: input.itemId, location_id: input.locationId ?? null, price_book_id: input.priceBookId, service_channel_id: input.serviceChannelId ?? null, tax_included: 0, updated_at: now, valid_from: input.validFrom, valid_to: input.validTo ?? null, variant_id: input.variantId ?? null, version: 1 }).execute();
    return id;
  }
  async findEffectivePrice(input: {
    businessDate: string; itemId: string; locationId?: string; priceBookId: string;
    serviceChannelId?: string; variantId?: string;
  }): Promise<MenuPrice | null> {
    const rows = await this.database.selectFrom("qcafe_menu_prices").selectAll()
      .where("price_book_id", "=", input.priceBookId).where("item_id", "=", input.itemId).where("active", "=", 1)
      .where("valid_from", "<=", input.businessDate).execute();
    const candidates = rows.filter((row) => (!row.valid_to || row.valid_to >= input.businessDate)
      && (row.variant_id === null || row.variant_id === (input.variantId ?? null))
      && (row.location_id === null || row.location_id === (input.locationId ?? null))
      && (row.service_channel_id === null || row.service_channel_id === (input.serviceChannelId ?? null)));
    candidates.sort((left, right) => specificity(right) - specificity(left) || right.valid_from.localeCompare(left.valid_from) || right.created_at.localeCompare(left.created_at));
    return candidates[0] ? toMenuPrice(candidates[0]) : null;
  }
}

function specificity(row: QcafeFoundationDatabase["qcafe_menu_prices"]): number {
  return Number(Boolean(row.variant_id)) * 4 + Number(Boolean(row.location_id)) * 2 + Number(Boolean(row.service_channel_id));
}
function toMenuPrice(row: QcafeFoundationDatabase["qcafe_menu_prices"]): MenuPrice {
  return { active: row.active === 1, amountMinor: row.amount_minor, id: row.id, itemId: row.item_id, locationId: row.location_id, priceBookId: row.price_book_id, serviceChannelId: row.service_channel_id, validFrom: row.valid_from, validTo: row.valid_to, variantId: row.variant_id };
}
