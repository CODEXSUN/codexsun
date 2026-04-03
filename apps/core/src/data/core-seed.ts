import {
  bootstrapSnapshotSchema,
  commonModuleItemSchema,
  commonModuleMetadataSchema,
  companySchema,
  contactSchema,
  type BootstrapSnapshot,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleMetadata,
  type CommonModuleMetadataColumn,
  type Company,
  type Contact,
  deliveryChannels,
  productModules,
} from "../../shared/index.js"

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

export const bootstrapSnapshot: BootstrapSnapshot = bootstrapSnapshotSchema.parse({
  productName: "codexsun",
  mission:
    "Connect shared ERP foundations, storefront operations, and delivery-ready business workflows inside one suite.",
  channels: deliveryChannels,
  modules: productModules,
  engineeringRules: [
    "Keep shared masters inside apps/core and consume them from other apps.",
    "Keep business logic outside apps/framework so the runtime stays reusable.",
    "Treat source-controlled design-system defaults as the only UI naming source of truth.",
    "Adopt imported code into app boundaries instead of mirroring temp folder structure.",
  ],
})

export const companies: Company[] = [
  companySchema.parse({
    id: "company:codexsun",
    name: "Codexsun Commerce",
    legalName: "Codexsun Commerce Private Limited",
    tagline: "Suite-first commerce and operations software.",
    registrationNumber: "U72900TZ2026PTC001201",
    pan: "AACCC1234K",
    financialYearStart: "2026-04-01",
    booksStart: "2026-04-01",
    website: "https://codexsun.example.com",
    description:
      "Primary suite operator for shared ERP, commerce, and deployment workflows.",
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: "https://instagram.com/codexsun",
    youtubeUrl: null,
    primaryEmail: "hello@codexsun.example.com",
    primaryPhone: "+91 90000 00001",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    logos: [
      {
        id: "company-logo:codexsun:primary",
        companyId: "company:codexsun",
        logoUrl: "https://placehold.co/160x160/f4efe8/2b211a?text=CS",
        logoType: "primary",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    addresses: [
      {
        id: "company-address:codexsun:hq",
        companyId: "company:codexsun",
        addressType: "head-office",
        addressLine1: "18 North Residency, Cathedral Road",
        addressLine2: "Nungambakkam",
        cityId: "city:chennai",
        stateId: "state:tamil-nadu",
        countryId: "country:india",
        pincodeId: "pincode:600001",
        latitude: 13.0604,
        longitude: 80.2496,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    emails: [
      {
        id: "company-email:codexsun:primary",
        companyId: "company:codexsun",
        email: "hello@codexsun.example.com",
        emailType: "support",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "company-email:codexsun:ops",
        companyId: "company:codexsun",
        email: "ops@codexsun.example.com",
        emailType: "operations",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: "company-phone:codexsun:primary",
        companyId: "company:codexsun",
        phoneNumber: "+91 90000 00001",
        phoneType: "office",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [
      {
        id: "company-bank:codexsun:primary",
        companyId: "company:codexsun",
        bankName: "Axis Bank",
        accountNumber: "001234567890",
        accountHolderName: "Codexsun Commerce Private Limited",
        ifsc: "UTIB0000123",
        branch: "Anna Salai",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  }),
  companySchema.parse({
    id: "company:loomline",
    name: "Loomline Retail",
    legalName: "Loomline Retail LLP",
    tagline: "Pilot storefront and retail operations tenant.",
    registrationNumber: "AAM-440021",
    pan: "AACFL9876R",
    financialYearStart: "2026-04-01",
    booksStart: "2026-04-01",
    website: "https://loomline.example.com",
    description:
      "Pilot commerce tenant used to validate shared masters, storefront, and order workflows.",
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    youtubeUrl: null,
    primaryEmail: "hello@loomline.example.com",
    primaryPhone: "+91 90000 00041",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    logos: [
      {
        id: "company-logo:loomline:primary",
        companyId: "company:loomline",
        logoUrl: "https://placehold.co/160x160/f7e8db/4a2b1f?text=LL",
        logoType: "primary",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    addresses: [
      {
        id: "company-address:loomline:studio",
        companyId: "company:loomline",
        addressType: "studio",
        addressLine1: "6 Residency Arcade",
        addressLine2: "Indiranagar",
        cityId: "city:bengaluru",
        stateId: "state:karnataka",
        countryId: "country:india",
        pincodeId: "pincode:560001",
        latitude: 12.9719,
        longitude: 77.6412,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    emails: [
      {
        id: "company-email:loomline:primary",
        companyId: "company:loomline",
        email: "hello@loomline.example.com",
        emailType: "sales",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: "company-phone:loomline:primary",
        companyId: "company:loomline",
        phoneNumber: "+91 90000 00041",
        phoneType: "office",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [
      {
        id: "company-bank:loomline:primary",
        companyId: "company:loomline",
        bankName: "HDFC Bank",
        accountNumber: "009876543210",
        accountHolderName: "Loomline Retail LLP",
        ifsc: "HDFC0000456",
        branch: "Indiranagar",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  }),
]

export const contacts: Contact[] = [
  contactSchema.parse({
    id: "contact:maya-rao",
    uuid: "d261d26f-55bc-4a4e-a8ab-8d3c9f1a7b11",
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
        addressType: "home",
        addressLine1: "21 Temple View",
        addressLine2: "Mylapore",
        cityId: "city:chennai",
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
        addressType: "warehouse",
        addressLine1: "4 Bommasandra Industrial Park",
        addressLine2: null,
        cityId: "city:bengaluru",
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
        addressType: "hub",
        addressLine1: "95 Logistics Mile",
        addressLine2: "Guindy",
        cityId: "city:chennai",
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

export const commonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> = {
  countries: [
    defineItem("country:india", {
      code: "IN",
      name: "India",
      phone_code: "+91",
    }),
  ],
  states: [
    defineItem("state:tamil-nadu", {
      country_id: "country:india",
      code: "TN",
      name: "Tamil Nadu",
    }),
    defineItem("state:karnataka", {
      country_id: "country:india",
      code: "KA",
      name: "Karnataka",
    }),
  ],
  districts: [
    defineItem("district:chennai", {
      state_id: "state:tamil-nadu",
      name: "Chennai",
    }),
    defineItem("district:bengaluru", {
      state_id: "state:karnataka",
      name: "Bengaluru Urban",
    }),
  ],
  cities: [
    defineItem("city:chennai", {
      district_id: "district:chennai",
      state_id: "state:tamil-nadu",
      name: "Chennai",
    }),
    defineItem("city:bengaluru", {
      district_id: "district:bengaluru",
      state_id: "state:karnataka",
      name: "Bengaluru",
    }),
  ],
  pincodes: [
    defineItem("pincode:600001", {
      city_id: "city:chennai",
      postal_code: "600001",
    }),
    defineItem("pincode:560001", {
      city_id: "city:bengaluru",
      postal_code: "560001",
    }),
  ],
  contactGroups: [
    defineItem("contact-group:retail", {
      code: "retail",
      name: "Retail customers",
    }),
    defineItem("contact-group:vendors", {
      code: "vendors",
      name: "Vendors",
    }),
  ],
  contactTypes: [
    defineItem("contact-type:customer", {
      code: "customer",
      name: "Customer",
      requires_gstin: false,
    }),
    defineItem("contact-type:supplier", {
      code: "supplier",
      name: "Supplier",
      requires_gstin: true,
    }),
    defineItem("contact-type:partner", {
      code: "partner",
      name: "Partner",
      requires_gstin: true,
    }),
  ],
  productGroups: [
    defineItem("product-group:apparel", {
      code: "apparel",
      name: "Apparel",
    }),
    defineItem("product-group:accessories", {
      code: "accessories",
      name: "Accessories",
    }),
  ],
  productCategories: [
    defineItem("product-category:ethnic", {
      code: "ethnic",
      name: "Ethnic Wear",
      description: "Festive and premium ethnic silhouettes.",
      image: "https://placehold.co/320x220/f4ebe1/3b2a20?text=Ethnic",
      position_order: 10,
      show_on_storefront_top_menu: true,
      show_on_storefront_catalog: true,
    }),
    defineItem("product-category:shirts", {
      code: "shirts",
      name: "Shirts",
      description: "Relaxed shirts for daily and occasion wear.",
      image: "https://placehold.co/320x220/efe6dc/3b2a20?text=Shirts",
      position_order: 20,
      show_on_storefront_top_menu: true,
      show_on_storefront_catalog: true,
    }),
    defineItem("product-category:accessories", {
      code: "accessories",
      name: "Accessories",
      description: "Utility and styling accessories.",
      image: "https://placehold.co/320x220/f5ece3/3b2a20?text=Accessories",
      position_order: 30,
      show_on_storefront_top_menu: true,
      show_on_storefront_catalog: true,
    }),
  ],
  productTypes: [
    defineItem("product-type:finished-good", {
      code: "finished-good",
      name: "Finished good",
    }),
  ],
  units: [
    defineItem("unit:piece", {
      code: "PCS",
      name: "Piece",
      symbol: "pc",
    }),
  ],
  hsnCodes: [
    defineItem("hsn:6204", {
      code: "6204",
      name: "Women woven garments",
      gst_rate: 12,
    }),
    defineItem("hsn:6205", {
      code: "6205",
      name: "Men shirts",
      gst_rate: 12,
    }),
  ],
  taxes: [
    defineItem("tax:gst-12", {
      code: "GST12",
      name: "GST 12%",
      rate: 12,
    }),
  ],
  brands: [
    defineItem("brand:aster-loom", {
      code: "aster-loom",
      name: "Aster Loom",
      description: "Artisanal festive silhouettes.",
      featured_label: true,
    }),
    defineItem("brand:northline", {
      code: "northline",
      name: "Northline",
      description: "Relaxed modern menswear.",
      featured_label: false,
    }),
    defineItem("brand:little-bloom", {
      code: "little-bloom",
      name: "Little Bloom",
      description: "Playful premium kidswear.",
      featured_label: true,
    }),
  ],
  colours: [
    defineItem("colour:ivory", {
      code: "ivory",
      name: "Ivory",
      swatch: "#efe6d7",
    }),
    defineItem("colour:indigo", {
      code: "indigo",
      name: "Indigo",
      swatch: "#29446a",
    }),
    defineItem("colour:sand", {
      code: "sand",
      name: "Sand",
      swatch: "#c8a67e",
    }),
  ],
  sizes: [
    defineItem("size:s", {
      code: "S",
      name: "Small",
      sort_order: 10,
    }),
    defineItem("size:m", {
      code: "M",
      name: "Medium",
      sort_order: 20,
    }),
    defineItem("size:l", {
      code: "L",
      name: "Large",
      sort_order: 30,
    }),
  ],
  currencies: [
    defineItem("currency:inr", {
      code: "INR",
      name: "Indian Rupee",
      symbol: "Rs.",
    }),
  ],
  orderTypes: [
    defineItem("order-type:retail", {
      code: "retail",
      name: "Retail order",
    }),
  ],
  styles: [
    defineItem("style:modern-ethnic", {
      code: "modern-ethnic",
      name: "Modern ethnic",
    }),
    defineItem("style:relaxed", {
      code: "relaxed",
      name: "Relaxed",
    }),
  ],
  transports: [
    defineItem("transport:surface", {
      code: "surface",
      name: "Surface courier",
    }),
  ],
  warehouses: [
    defineItem("warehouse:chennai-central", {
      code: "chennai-central",
      name: "Chennai Central Warehouse",
      city_id: "city:chennai",
    }),
  ],
  destinations: [
    defineItem("destination:domestic", {
      code: "domestic",
      name: "Domestic",
    }),
  ],
  paymentTerms: [
    defineItem("payment-term:immediate", {
      code: "immediate",
      name: "Immediate",
      days: 0,
    }),
    defineItem("payment-term:net-15", {
      code: "net-15",
      name: "Net 15",
      days: 15,
    }),
  ],
  storefrontTemplates: [
    defineItem("storefront-template:home-category", {
      code: "home-category",
      name: "Home Category",
      sort_order: 10,
      badge_text: "Shop by category",
      title: "Category stories driven from live catalog masters.",
      description: "Top menu and catalog categories stay aligned with shared core master data.",
      cta_primary_label: "Browse catalog",
      cta_primary_href: "/search",
      cta_secondary_label: null,
      cta_secondary_href: null,
      icon_key: null,
      theme_key: "neutral",
    }),
    defineItem("storefront-template:home-featured", {
      code: "home-featured",
      name: "Home Featured",
      sort_order: 20,
      badge_text: "Featured edit",
      title: "Featured products now come from the storefront publishing profile.",
      description: "This section is safe to keep backend-driven because category, price, and stock all resolve from the same product source.",
      cta_primary_label: null,
      cta_primary_href: null,
      cta_secondary_label: null,
      cta_secondary_href: null,
      icon_key: null,
      theme_key: "sand",
    }),
    defineItem("storefront-template:home-cta", {
      code: "home-cta",
      name: "Home CTA",
      sort_order: 30,
      badge_text: "Storefront ready",
      title: "Ship catalog, checkout, and order operations from one suite.",
      description: "This CTA stays aligned with the current go-live storefront and operations baseline.",
      cta_primary_label: "Open storefront",
      cta_primary_href: "/public/v1/storefront/catalog",
      cta_secondary_label: "Review orders",
      cta_secondary_href: "/dashboard/apps/ecommerce/orders",
      icon_key: "sparkles",
      theme_key: "cta",
    }),
  ],
  sliderThemes: [
    defineItem("slider-theme:signature-01", {
      code: "signature-01",
      name: "Signature Ember",
      sort_order: 10,
      add_to_cart_label: "Add to cart",
      view_details_label: "View details",
      background_from: "#2b1a14",
      background_via: "#6b4633",
      background_to: "#f2ddc8",
      text_color: "#ffffff",
      muted_text_color: "#efe2d6",
    }),
    defineItem("slider-theme:signature-02", {
      code: "signature-02",
      name: "Walnut Glow",
      sort_order: 20,
      add_to_cart_label: "Add to bag",
      view_details_label: "Explore",
      background_from: "#311f19",
      background_via: "#7a503c",
      background_to: "#f6e6d3",
      text_color: "#ffffff",
      muted_text_color: "#f3e7dc",
    }),
  ],
}
