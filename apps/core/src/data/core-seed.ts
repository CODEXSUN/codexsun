import {
  commonModuleItemSchema,
  commonModuleMetadataSchema,
  contactSchema,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleMetadata,
  type CommonModuleMetadataColumn,
  type Contact,
} from "../../shared/index.js"
import { commonModuleItemsByKey as curatedCommonModuleItemsByKey } from "../common-modules/seed-data.js"

const timestamp = "2026-03-30T09:00:00.000Z"

function stringColumn(
  key: string,
  label: string,
  options: Partial<Pick<CommonModuleMetadataColumn, "nullable" | "referenceModule">> = {}
): CommonModuleMetadataColumn {
  return {
    key,
    label,
    type: "string",
    required: true,
    nullable: options.nullable ?? false,
    referenceModule: options.referenceModule,
  }
}

function numberColumn(
  key: string,
  label: string,
  options: Partial<Pick<CommonModuleMetadataColumn, "nullable" | "referenceModule">> = {}
): CommonModuleMetadataColumn {
  return {
    key,
    label,
    type: "number",
    required: true,
    nullable: options.nullable ?? false,
    referenceModule: options.referenceModule,
  }
}

function booleanColumn(
  key: string,
  label: string,
  options: Partial<Pick<CommonModuleMetadataColumn, "nullable" | "referenceModule">> = {}
): CommonModuleMetadataColumn {
  return {
    key,
    label,
    type: "boolean",
    required: true,
    nullable: options.nullable ?? false,
    referenceModule: options.referenceModule,
  }
}

function defineMetadata(
  key: CommonModuleKey,
  label: string,
  defaultSortKey: string,
  columns: CommonModuleMetadataColumn[]
): CommonModuleMetadata {
  return commonModuleMetadataSchema.parse({
    key,
    label,
    defaultSortKey,
    columns,
  })
}

function defineItem(
  id: string,
  extra: Record<string, string | number | boolean | null>
): CommonModuleItem {
  return commonModuleItemSchema.parse({
    id,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...extra,
  })
}

export const contacts: Contact[] = [
  contactSchema.parse({
    id: "contact:maya-rao",
    uuid: "d261d26f-55bc-4a4e-a8ab-8d3c9f1a7b11",
    code: "C0001",
    contactTypeId: null,
    ledgerId: "ledger-sundry-debtors",
    ledgerName: "Sundry Debtors",
    name: "Maya Rao",
    legalName: null,
    pan: null,
    gstin: null,
    msmeType: null,
    msmeNo: null,
    openingBalance: 0,
    balanceType: null,
    creditLimit: 25000,
    website: null,
    description: "High-value storefront customer for premium ethnic collections.",
    primaryEmail: "maya.rao@example.com",
    primaryPhone: "+91 98888 11001",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    addresses: [
      {
        id: "contact-address:maya:home",
        contactId: "contact:maya-rao",
        addressTypeId: "address-type:primary-1",
        addressLine1: "21 Temple View",
        addressLine2: "Mylapore",
        cityId: "city:chennai",
        districtId: "district:chennai",
        stateId: "state:tamil-nadu",
        countryId: "country:india",
        pincodeId: "pincode:600001",
        latitude: null,
        longitude: null,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    emails: [
      {
        id: "contact-email:maya:primary",
        contactId: "contact:maya-rao",
        email: "maya.rao@example.com",
        emailType: "personal",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: "contact-phone:maya:primary",
        contactId: "contact:maya-rao",
        phoneNumber: "+91 98888 11001",
        phoneType: "mobile",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [],
    gstDetails: [],
  }),
  contactSchema.parse({
    id: "contact:northwind-textiles",
    uuid: "af6e2e72-7b2d-4a7c-b1a5-11c7e6aa5530",
    code: "S0001",
    contactTypeId: null,
    ledgerId: "ledger-sundry-creditors",
    ledgerName: "Sundry Creditors",
    name: "Northwind Textiles",
    legalName: "Northwind Textiles LLP",
    pan: "AABCN1234D",
    gstin: "29AABCN1234D1Z5",
    msmeType: "small",
    msmeNo: "MSME-NT-2031",
    openingBalance: 150000,
    balanceType: "credit",
    creditLimit: 500000,
    website: "https://northwind-textiles.example.com",
    description: "Primary woven-fabric supplier for apparel and festive collections.",
    primaryEmail: "care@northwind-textiles.example.com",
    primaryPhone: "+91 94444 22001",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    addresses: [
      {
        id: "contact-address:northwind:hq",
        contactId: "contact:northwind-textiles",
        addressTypeId: "address-type:office",
        addressLine1: "4 Bommasandra Industrial Park",
        addressLine2: null,
        cityId: "city:bengaluru",
        districtId: "district:bengaluru",
        stateId: "state:karnataka",
        countryId: "country:india",
        pincodeId: "pincode:560001",
        latitude: null,
        longitude: null,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    emails: [
      {
        id: "contact-email:northwind:primary",
        contactId: "contact:northwind-textiles",
        email: "care@northwind-textiles.example.com",
        emailType: "operations",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: "contact-phone:northwind:primary",
        contactId: "contact:northwind-textiles",
        phoneNumber: "+91 94444 22001",
        phoneType: "office",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [
      {
        id: "contact-bank:northwind:primary",
        contactId: "contact:northwind-textiles",
        bankName: "ICICI Bank",
        accountNumber: "781234567890",
        accountHolderName: "Northwind Textiles LLP",
        ifsc: "ICIC0000711",
        branch: "Electronic City",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    gstDetails: [
      {
        id: "contact-gst:northwind:primary",
        contactId: "contact:northwind-textiles",
        gstin: "29AABCN1234D1Z5",
        state: "Karnataka",
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  }),
  contactSchema.parse({
    id: "contact:swift-drop",
    uuid: "25782363-d9ef-4a57-94e4-c83c696a65a4",
    code: "P0001",
    contactTypeId: null,
    ledgerId: null,
    ledgerName: null,
    name: "Swift Drop Logistics",
    legalName: "Swift Drop Logistics Private Limited",
    pan: "AAACS4321P",
    gstin: "33AAACS4321P1Z1",
    msmeType: null,
    msmeNo: null,
    openingBalance: 0,
    balanceType: null,
    creditLimit: 100000,
    website: "https://swiftdrop.example.com",
    description: "Regional courier partner used for in-transit and delivery confirmations.",
    primaryEmail: "ops@swiftdrop.example.com",
    primaryPhone: "+91 93333 41001",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    addresses: [
      {
        id: "contact-address:swiftdrop:hub",
        contactId: "contact:swift-drop",
        addressTypeId: "address-type:branch",
        addressLine1: "95 Logistics Mile",
        addressLine2: "Guindy",
        cityId: "city:chennai",
        districtId: "district:chennai",
        stateId: "state:tamil-nadu",
        countryId: "country:india",
        pincodeId: "pincode:600001",
        latitude: null,
        longitude: null,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    emails: [
      {
        id: "contact-email:swiftdrop:primary",
        contactId: "contact:swift-drop",
        email: "ops@swiftdrop.example.com",
        emailType: "operations",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: "contact-phone:swiftdrop:primary",
        contactId: "contact:swift-drop",
        phoneNumber: "+91 93333 41001",
        phoneType: "office",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [],
    gstDetails: [
      {
        id: "contact-gst:swiftdrop:primary",
        contactId: "contact:swift-drop",
        gstin: "33AAACS4321P1Z1",
        state: "Tamil Nadu",
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  }),
]

export const commonModuleMetadata: CommonModuleMetadata[] = [
  defineMetadata("countries", "Countries", "name", [
    stringColumn("code", "Country code"),
    stringColumn("name", "Country name"),
    stringColumn("phone_code", "Phone code"),
  ]),
  defineMetadata("states", "States", "name", [
    stringColumn("country_id", "Country", { referenceModule: "countries" }),
    stringColumn("code", "State code"),
    stringColumn("name", "State name"),
  ]),
  defineMetadata("districts", "Districts", "name", [
    stringColumn("state_id", "State", { referenceModule: "states" }),
    stringColumn("name", "District name"),
  ]),
  defineMetadata("cities", "Cities", "name", [
    stringColumn("district_id", "District", { referenceModule: "districts" }),
    stringColumn("state_id", "State", { referenceModule: "states" }),
    stringColumn("name", "City name"),
  ]),
  defineMetadata("pincodes", "Postal codes", "postal_code", [
    stringColumn("city_id", "City", { referenceModule: "cities" }),
    stringColumn("postal_code", "Postal code"),
  ]),
  defineMetadata("contactGroups", "Contact groups", "name", [
    stringColumn("code", "Group code"),
    stringColumn("name", "Group name"),
  ]),
  defineMetadata("contactTypes", "Contact types", "name", [
    stringColumn("code", "Type code"),
    stringColumn("name", "Type name"),
    booleanColumn("requires_gstin", "Requires GSTIN"),
  ]),
  defineMetadata("addressTypes", "Address types", "name", [
    stringColumn("code", "Type code"),
    stringColumn("name", "Type name"),
    stringColumn("description", "Description", { nullable: true }),
  ]),
  defineMetadata("bankNames", "Bank names", "name", [
    stringColumn("code", "Code"),
    stringColumn("name", "Name"),
    stringColumn("description", "Description", { nullable: true }),
  ]),
  defineMetadata("productGroups", "Product groups", "name", [
    stringColumn("code", "Group code"),
    stringColumn("name", "Group name"),
  ]),
  defineMetadata("productCategories", "Product categories", "name", [
    stringColumn("code", "Category code"),
    stringColumn("name", "Category name"),
    stringColumn("description", "Description", { nullable: true }),
    stringColumn("image", "Image", { nullable: true }),
    numberColumn("position_order", "Position order"),
    booleanColumn("show_on_storefront_top_menu", "Top menu"),
    booleanColumn("show_on_storefront_catalog", "Catalog section"),
  ]),
  defineMetadata("productTypes", "Product types", "name", [
    stringColumn("code", "Type code"),
    stringColumn("name", "Type name"),
  ]),
  defineMetadata("units", "Units", "name", [
    stringColumn("code", "Unit code"),
    stringColumn("name", "Unit name"),
    stringColumn("symbol", "Symbol"),
  ]),
  defineMetadata("hsnCodes", "HSN codes", "code", [
    stringColumn("code", "HSN code"),
    stringColumn("name", "Description"),
    numberColumn("gst_rate", "GST rate"),
  ]),
  defineMetadata("taxes", "Tax profiles", "name", [
    stringColumn("code", "Tax code"),
    stringColumn("name", "Tax name"),
    numberColumn("rate", "Rate"),
  ]),
  defineMetadata("brands", "Brands", "name", [
    stringColumn("code", "Brand code"),
    stringColumn("name", "Brand name"),
    stringColumn("description", "Description", { nullable: true }),
    booleanColumn("featured_label", "Featured label"),
  ]),
  defineMetadata("colours", "Colours", "name", [
    stringColumn("code", "Colour code"),
    stringColumn("name", "Colour name"),
    stringColumn("swatch", "Swatch"),
  ]),
  defineMetadata("sizes", "Sizes", "sort_order", [
    stringColumn("code", "Size code"),
    stringColumn("name", "Size name"),
    numberColumn("sort_order", "Sort order"),
  ]),
  defineMetadata("currencies", "Currencies", "code", [
    stringColumn("code", "Currency code"),
    stringColumn("name", "Currency name"),
    stringColumn("symbol", "Symbol"),
  ]),
  defineMetadata("orderTypes", "Order types", "name", [
    stringColumn("code", "Order code"),
    stringColumn("name", "Order type"),
  ]),
  defineMetadata("styles", "Styles", "name", [
    stringColumn("code", "Style code"),
    stringColumn("name", "Style name"),
  ]),
  defineMetadata("transports", "Transports", "name", [
    stringColumn("code", "Transport code"),
    stringColumn("name", "Transport name"),
  ]),
  defineMetadata("warehouses", "Warehouses", "name", [
    stringColumn("code", "Warehouse code"),
    stringColumn("name", "Warehouse name"),
    booleanColumn("is_default_location", "Default location"),
    stringColumn("city_id", "City", { referenceModule: "cities" }),
  ]),
  defineMetadata("destinations", "Destinations", "name", [
    stringColumn("code", "Destination code"),
    stringColumn("name", "Destination name"),
  ]),
  defineMetadata("paymentTerms", "Payment terms", "days", [
    stringColumn("code", "Term code"),
    stringColumn("name", "Term name"),
    numberColumn("days", "Days"),
  ]),
  defineMetadata("storefrontTemplates", "Storefront templates", "sort_order", [
    stringColumn("code", "Template code"),
    stringColumn("name", "Template name"),
    numberColumn("sort_order", "Sort order"),
    stringColumn("badge_text", "Badge", { nullable: true }),
    stringColumn("title", "Title"),
    stringColumn("description", "Description", { nullable: true }),
    stringColumn("cta_primary_label", "Primary CTA label", { nullable: true }),
    stringColumn("cta_primary_href", "Primary CTA href", { nullable: true }),
    stringColumn("cta_secondary_label", "Secondary CTA label", { nullable: true }),
    stringColumn("cta_secondary_href", "Secondary CTA href", { nullable: true }),
    stringColumn("icon_key", "Icon key", { nullable: true }),
    stringColumn("theme_key", "Theme key", { nullable: true }),
  ]),
  defineMetadata("sliderThemes", "Slider themes", "sort_order", [
    stringColumn("code", "Theme code"),
    stringColumn("name", "Theme name"),
    numberColumn("sort_order", "Sort order"),
    stringColumn("add_to_cart_label", "Add to cart label", { nullable: true }),
    stringColumn("view_details_label", "View details label", { nullable: true }),
    stringColumn("background_from", "Background start"),
    stringColumn("background_via", "Background middle"),
    stringColumn("background_to", "Background end"),
    stringColumn("text_color", "Text color", { nullable: true }),
    stringColumn("muted_text_color", "Muted text color", { nullable: true }),
  ]),
]

export const commonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> =
  curatedCommonModuleItemsByKey
