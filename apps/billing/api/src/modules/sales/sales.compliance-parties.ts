import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { assertBillingScope } from "../../auth/billing-scope.js";
import { salesDatabase } from "./sales.repository-support.js";
import type { Sale } from "./sales.types.js";

export type ComplianceAddress = {
  stateCode?: string | null;
  countryCode?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  cityName?: string | null;
  pincodeName?: string | null;
  countryName?: string | null;
  isDefault?: boolean;
};
export type ComplianceParties = {
  seller: { gstin: string; name: string; address: ComplianceAddress };
  buyer: ComplianceAddress;
  shipping: ComplianceAddress;
};

export async function loadComplianceParties(
  databaseName: string,
  invoice: Sale
): Promise<ComplianceParties> {
  assertBillingScope(invoice.companyId, invoice.financialYearId);
  const database = await salesDatabase(databaseName);
  const company = await sql<{ gstin: string; name: string; addresses: unknown }>`
    SELECT gstin, COALESCE(NULLIF(legal_name, ''), name) AS name, addresses_json AS addresses
    FROM core_companies WHERE id=${invoice.companyId} AND status='active'
  `.execute(database);
  const seller = company.rows[0];
  if (!seller) throw AppError.validation("The invoice company is missing or inactive.");
  let addresses: ComplianceAddress[];
  try {
    addresses =
      typeof seller.addresses === "string" ? JSON.parse(seller.addresses) : seller.addresses;
  } catch {
    throw AppError.validation("The company address data is invalid.");
  }
  if (!Array.isArray(addresses) || !addresses.length)
    throw AppError.validation("Configure the company address before generating compliance.");
  const result = await sql<ComplianceAddress & { id: number }>`
    SELECT address.id, address.address_line1 AS addressLine1, address.address_line2 AS addressLine2,
      address.city_name AS cityName, address.pincode_name AS pincodeName, address.country_name AS countryName, state.code AS stateCode, country.code AS countryCode
    FROM core_contacts_addresses address
    LEFT JOIN core_states state ON state.id=address.state_id
    LEFT JOIN core_countries country ON country.id=address.country_id
    WHERE address.id IN (${invoice.billingAddressId}, ${invoice.shippingAddressId})
  `.execute(database);
  const buyer = result.rows.find((row) => row.id === invoice.billingAddressId);
  const shipping = result.rows.find((row) => row.id === invoice.shippingAddressId);
  if (!buyer || !shipping)
    throw AppError.validation("Invoice billing or shipping address is missing.");
  return {
    seller: {
      gstin: seller.gstin,
      name: seller.name,
      address: addresses.find((address) => address.isDefault) ?? addresses[0]!
    },
    buyer,
    shipping
  };
}
