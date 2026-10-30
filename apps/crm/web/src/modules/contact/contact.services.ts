import { crmRequest } from "../../crm-request";
import type {
  ContactCityLookup,
  ContactCountryLookup,
  ContactDistrictLookup,
  ContactLookups,
  ContactNamedLookup,
  ContactNextCode,
  ContactPincodeLookup,
  ContactRecord,
  ContactSavePayload,
  ContactStateLookup
} from "./contact.types";

const contactPath = "/crm/contacts";

async function contactRequest<T>(suffix = "", options: RequestInit = {}) {
  return crmRequest<T>(`${contactPath}${suffix}`, options);
}

const lookupRoutes = {
  "contact-types": "/crm/contacts/lookups/contact-types",
  "contact-groups": "/crm/contacts/lookups/contact-groups",
  "address-types": "/crm/contacts/lookups/address-types",
  "bank-names": "/crm/contacts/lookups/bank-names",
  countries: "/crm/contacts/lookups/countries",
  states: "/crm/contacts/lookups/states",
  districts: "/crm/contacts/lookups/districts",
  cities: "/crm/contacts/lookups/cities",
  pincodes: "/crm/contacts/lookups/pincodes"
};

async function fixedLookupRequest<T>(lookup: keyof typeof lookupRoutes, options: RequestInit = {}) {
  return crmRequest<T>(lookupRoutes[lookup], options);
}

export const listContacts = (search = "") =>
  contactRequest<ContactRecord[]>(`?search=${encodeURIComponent(search)}`);
export const getNextContactCode = () => contactRequest<ContactNextCode>("/next-code");
export const getContact = (id: number) => contactRequest<ContactRecord>(`/${id}`);
export const createContact = (payload: ContactSavePayload) =>
  contactRequest<ContactRecord>("", { body: JSON.stringify(payload), method: "POST" });
export const updateContact = (id: number, payload: ContactSavePayload) =>
  contactRequest<ContactRecord>(`/${id}`, { body: JSON.stringify(payload), method: "PUT" });
export const setContactActive = (id: number, active: boolean) =>
  contactRequest<ContactRecord>(`/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
export const forceDeleteContact = (id: number) =>
  contactRequest<ContactRecord>(`/${id}/force`, { method: "DELETE" });

export async function listContactLookups(): Promise<ContactLookups> {
  const response = await crmRequest<Partial<ContactLookups>>(`${contactPath}/lookups`);
  return {
    addressTypes: Array.isArray(response.addressTypes) ? response.addressTypes : [],
    bankNames: Array.isArray(response.bankNames) ? response.bankNames : [],
    cities: Array.isArray(response.cities) ? response.cities : [],
    contactGroups: Array.isArray(response.contactGroups) ? response.contactGroups : [],
    contactTypes: Array.isArray(response.contactTypes) ? response.contactTypes : [],
    countries: Array.isArray(response.countries) ? response.countries : [],
    districts: Array.isArray(response.districts) ? response.districts : [],
    pincodes: Array.isArray(response.pincodes) ? response.pincodes : [],
    states: Array.isArray(response.states) ? response.states : []
  };
}

export const createContactTypeLookup = (name: string) =>
  fixedLookupRequest<ContactNamedLookup>("contact-types", {
    body: JSON.stringify({ name, isActive: true, sortOrder: 1000 }),
    method: "POST"
  });
export const createContactGroupLookup = (name: string) =>
  fixedLookupRequest<ContactNamedLookup>("contact-groups", {
    body: JSON.stringify({ name, isActive: true, sortOrder: 1000 }),
    method: "POST"
  });
export const createAddressTypeLookup = (name: string) =>
  fixedLookupRequest<ContactNamedLookup>("address-types", {
    body: JSON.stringify({ name, isActive: true, sortOrder: 1000 }),
    method: "POST"
  });
export const createBankNameLookup = (name: string) =>
  fixedLookupRequest<ContactNamedLookup>("bank-names", {
    body: JSON.stringify({ name, isActive: true, sortOrder: 1000 }),
    method: "POST"
  });
export const createCountryLookup = (name: string) =>
  fixedLookupRequest<ContactCountryLookup>("countries", {
    body: JSON.stringify({ code: lookupCode(name), name, sortOrder: 1000, status: "active" }),
    method: "POST"
  });
export const createStateLookup = (name: string, countryId: number) =>
  fixedLookupRequest<ContactStateLookup>("states", {
    body: JSON.stringify({
      code: lookupCode(name),
      countryId,
      name,
      sortOrder: 1000,
      status: "active"
    }),
    method: "POST"
  });
export const createDistrictLookup = (name: string, stateId: number) =>
  fixedLookupRequest<ContactDistrictLookup>("districts", {
    body: JSON.stringify({ stateId, name, sortOrder: 1000, status: "active" }),
    method: "POST"
  });
export const createCityLookup = (name: string, districtId: number) =>
  fixedLookupRequest<ContactCityLookup>("cities", {
    body: JSON.stringify({ districtId, name, sortOrder: 1000, status: "active" }),
    method: "POST"
  });
export const createPincodeLookup = (postalCode: string, area: string, cityId: number) =>
  fixedLookupRequest<ContactPincodeLookup>("pincodes", {
    body: JSON.stringify({ area, cityId, name: postalCode, sortOrder: 1000, status: "active" }),
    method: "POST"
  });

function lookupCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}
