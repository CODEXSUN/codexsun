import {
  commonModuleItemSchema,
  type CommonModuleItem,
  type CommonModuleKey,
} from "../../shared/index.js"

const timestamp = "2026-03-30T09:00:00.000Z"
const defaultRecordId = "1"

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

const baseCommonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> = {
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
      code: "CHN",
      name: "Chennai",
    }),
    defineItem("district:bengaluru", {
      state_id: "state:karnataka",
      code: "BLR-URB",
      name: "Bengaluru Urban",
    }),
  ],
  cities: [
    defineItem("city:chennai", {
      state_id: "state:tamil-nadu",
      district_id: "district:chennai",
      code: "MAA",
      name: "Chennai",
    }),
    defineItem("city:bengaluru", {
      state_id: "state:karnataka",
      district_id: "district:bengaluru",
      code: "BLR",
      name: "Bengaluru",
    }),
  ],
  pincodes: [
    defineItem("pincode:600001", {
      country_id: "country:india",
      state_id: "state:tamil-nadu",
      district_id: "district:chennai",
      city_id: "city:chennai",
      code: "600001",
      area_name: "Mylapore",
    }),
    defineItem("pincode:560001", {
      country_id: "country:india",
      state_id: "state:karnataka",
      district_id: "district:bengaluru",
      city_id: "city:bengaluru",
      code: "560001",
      area_name: "Indiranagar",
    }),
  ],
  contactGroups: [
    defineItem("contact-group:retail", {
      code: "retail",
      name: "Retail Customers",
      description: "Walk-in and storefront customers.",
    }),
    defineItem("contact-group:vendors", {
      code: "vendors",
      name: "Vendors",
      description: "Suppliers and procurement parties.",
    }),
  ],
  contactTypes: [
    defineItem("contact-type:customer", {
      code: "customer",
      name: "Customer",
      description: "Sell-side customer account.",
    }),
    defineItem("contact-type:supplier", {
      code: "supplier",
      name: "Supplier",
      description: "Purchase-side supplier account.",
    }),
    defineItem("contact-type:partner", {
      code: "partner",
      name: "Partner",
      description: "Shared service or logistics partner.",
    }),
  ],
  addressTypes: [
    defineItem("address-type:billing", {
      code: "billing",
      name: "Billing",
      description: "Billing and invoice address.",
    }),
    defineItem("address-type:shipping", {
      code: "shipping",
      name: "Shipping",
      description: "Shipping and delivery address.",
    }),
    defineItem("address-type:office", {
      code: "office",
      name: "Office",
      description: "Office or business address.",
    }),
    defineItem("address-type:branch", {
      code: "branch",
      name: "Branch",
      description: "Branch or outlet address.",
    }),
    defineItem("address-type:primary-1", {
      code: "primary-1",
      name: "Primary 1",
      description: "Primary address slot one.",
    }),
    defineItem("address-type:primary-2", {
      code: "primary-2",
      name: "Primary 2",
      description: "Primary address slot two.",
    }),
  ],
  productGroups: [
    defineItem("product-group:apparel", {
      code: "apparel",
      name: "Apparel",
      description: "Core apparel assortment.",
    }),
    defineItem("product-group:accessories", {
      code: "accessories",
      name: "Accessories",
      description: "Complementary accessories and add-ons.",
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
      name: "Finished Good",
      description: "Stocked sellable product.",
    }),
  ],
  units: [
    defineItem("unit:piece", {
      code: "PCS",
      name: "Piece",
      symbol: "pc",
      description: "Single piece unit.",
    }),
  ],
  hsnCodes: [
    defineItem("hsn:6204", {
      code: "6204",
      name: "Women Woven Garments",
      description: "Woven garments and festive women apparel.",
    }),
    defineItem("hsn:6205", {
      code: "6205",
      name: "Men Shirts",
      description: "Woven shirts and related menswear.",
    }),
  ],
  taxes: [
    defineItem("tax:gst-12", {
      code: "GST12",
      name: "GST 12%",
      tax_type: "gst",
      rate_percent: 12,
      description: "Standard GST slab for apparel categories in the sample data.",
    }),
  ],
  brands: [
    defineItem("brand:aster-loom", {
      code: "aster-loom",
      name: "Aster Loom",
      description: "Artisanal festive silhouettes.",
    }),
    defineItem("brand:northline", {
      code: "northline",
      name: "Northline",
      description: "Relaxed modern menswear.",
    }),
    defineItem("brand:little-bloom", {
      code: "little-bloom",
      name: "Little Bloom",
      description: "Playful premium kidswear.",
    }),
  ],
  colours: [
    defineItem("colour:ivory", {
      code: "ivory",
      name: "Ivory",
      hex_code: "#efe6d7",
      description: "Warm off-white neutral.",
    }),
    defineItem("colour:indigo", {
      code: "indigo",
      name: "Indigo",
      hex_code: "#29446a",
      description: "Deep indigo blue.",
    }),
    defineItem("colour:sand", {
      code: "sand",
      name: "Sand",
      hex_code: "#c8a67e",
      description: "Muted sand beige.",
    }),
  ],
  sizes: [
    defineItem("size:s", {
      code: "S",
      name: "Small",
      sort_order: 10,
      description: "Standard small size.",
    }),
    defineItem("size:m", {
      code: "M",
      name: "Medium",
      sort_order: 20,
      description: "Standard medium size.",
    }),
    defineItem("size:l", {
      code: "L",
      name: "Large",
      sort_order: 30,
      description: "Standard large size.",
    }),
  ],
  currencies: [
    defineItem("currency:inr", {
      code: "INR",
      name: "Indian Rupee",
      symbol: "Rs.",
      decimal_places: 2,
    }),
  ],
  orderTypes: [
    defineItem("order-type:retail", {
      code: "retail",
      name: "Retail Order",
      description: "Standard sell-side retail order flow.",
    }),
  ],
  styles: [
    defineItem("style:modern-ethnic", {
      code: "modern-ethnic",
      name: "Modern Ethnic",
      description: "Modernized ethnic styling.",
    }),
    defineItem("style:relaxed", {
      code: "relaxed",
      name: "Relaxed",
      description: "Relaxed daily-wear styling.",
    }),
  ],
  transports: [
    defineItem("transport:surface", {
      code: "surface",
      name: "Surface Courier",
      description: "Ground and standard courier service.",
    }),
  ],
  warehouses: [
    defineItem("warehouse:chennai-central", {
      code: "chennai-central",
      name: "Chennai Central Warehouse",
      country_id: "country:india",
      state_id: "state:tamil-nadu",
      district_id: "district:chennai",
      city_id: "city:chennai",
      pincode_id: "pincode:600001",
      address_line1: "18 North Residency",
      address_line2: "Nungambakkam",
      description: "Primary warehouse for the shared sample data.",
    }),
  ],
  destinations: [
    defineItem("destination:domestic", {
      code: "domestic",
      name: "Domestic",
      description: "Domestic shipping and movement destination.",
    }),
  ],
  paymentTerms: [
    defineItem("payment-term:immediate", {
      code: "immediate",
      name: "Immediate",
      due_days: 0,
      description: "Pay immediately on billing.",
    }),
    defineItem("payment-term:net-15", {
      code: "net-15",
      name: "Net 15",
      due_days: 15,
      description: "Payment due within 15 days.",
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
      badge_background: "#f2ddc8",
      badge_text_color: "#2b1a14",
      primary_button_background: "#ffffff",
      primary_button_text_color: "#2b1a14",
      secondary_button_background: "#6b4633",
      secondary_button_text_color: "#ffffff",
      nav_background: "#2b1a14",
      nav_text_color: "#ffffff",
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
      badge_background: "#f6e6d3",
      badge_text_color: "#311f19",
      primary_button_background: "#ffffff",
      primary_button_text_color: "#311f19",
      secondary_button_background: "#7a503c",
      secondary_button_text_color: "#ffffff",
      nav_background: "#311f19",
      nav_text_color: "#ffffff",
    }),
  ],
}

const defaultCommonModuleRows: Record<CommonModuleKey, Record<string, string | number | boolean | null>> = {
  countries: { code: "-", name: "-", phone_code: "-" },
  states: { country_id: defaultRecordId, code: "-", name: "-" },
  districts: { state_id: defaultRecordId, code: "-", name: "-" },
  cities: { state_id: defaultRecordId, district_id: defaultRecordId, code: "-", name: "-" },
  pincodes: {
    country_id: defaultRecordId,
    state_id: defaultRecordId,
    district_id: defaultRecordId,
    city_id: defaultRecordId,
    code: "-",
    area_name: "-",
  },
  contactGroups: { code: "-", name: "-", description: "-" },
  contactTypes: { code: "-", name: "-", description: "-" },
  addressTypes: { code: "-", name: "-", description: "-" },
  productGroups: { code: "-", name: "-", description: "-" },
  productCategories: {
    code: "-",
    name: "-",
    description: "-",
    image: "-",
    position_order: 0,
    show_on_storefront_top_menu: false,
    show_on_storefront_catalog: false,
  },
  productTypes: { code: "-", name: "-", description: "-" },
  units: { code: "-", name: "-", symbol: "-", description: "-" },
  hsnCodes: { code: "-", name: "-", description: "-" },
  taxes: { code: "-", name: "-", tax_type: "-", rate_percent: 0, description: "-" },
  brands: { code: "-", name: "-", description: "-" },
  colours: { code: "-", name: "-", hex_code: "-", description: "-" },
  sizes: { code: "-", name: "-", sort_order: 0, description: "-" },
  currencies: { code: "-", name: "-", symbol: "-", decimal_places: 0 },
  orderTypes: { code: "-", name: "-", description: "-" },
  styles: { code: "-", name: "-", description: "-" },
  transports: { code: "-", name: "-", description: "-" },
  warehouses: {
    code: "-",
    name: "-",
    country_id: defaultRecordId,
    state_id: defaultRecordId,
    district_id: defaultRecordId,
    city_id: defaultRecordId,
    pincode_id: defaultRecordId,
    address_line1: "-",
    address_line2: "-",
    description: "-",
  },
  destinations: { code: "-", name: "-", description: "-" },
  paymentTerms: { code: "-", name: "-", due_days: 0, description: "-" },
  storefrontTemplates: {
    code: "-",
    name: "-",
    sort_order: 0,
    badge_text: "-",
    title: "-",
    description: "-",
    cta_primary_label: "-",
    cta_primary_href: "-",
    cta_secondary_label: "-",
    cta_secondary_href: "-",
    icon_key: "-",
    theme_key: "-",
  },
  sliderThemes: {
    code: "-",
    name: "-",
    sort_order: 0,
    add_to_cart_label: "-",
    view_details_label: "-",
    background_from: "-",
    background_via: "-",
    background_to: "-",
    text_color: "-",
    muted_text_color: "-",
    badge_background: "-",
    badge_text_color: "-",
    primary_button_background: "-",
    primary_button_text_color: "-",
    secondary_button_background: "-",
    secondary_button_text_color: "-",
    nav_background: "-",
    nav_text_color: "-",
  },
}

export const commonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> =
  Object.fromEntries(
    (Object.entries(baseCommonModuleItemsByKey) as Array<[CommonModuleKey, CommonModuleItem[]]>).map(
      ([moduleKey, items]) => [
        moduleKey,
        [defineItem(defaultRecordId, defaultCommonModuleRows[moduleKey]), ...items],
      ]
    )
  ) as Record<CommonModuleKey, CommonModuleItem[]>
