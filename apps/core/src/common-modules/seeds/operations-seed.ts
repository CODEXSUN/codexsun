import type { SeedMap } from "./helpers.js"
import { defineItem } from "./helpers.js"

export const operationsSeed: SeedMap = {
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
    defineItem("warehouse:coimbatore-knits", {
      code: "coimbatore-knits",
      name: "Coimbatore Knits Warehouse",
      country_id: "country:india",
      state_id: "state:tamil-nadu",
      district_id: "district:coimbatore",
      city_id: "city:coimbatore",
      pincode_id: "pincode:641018",
      address_line1: "14 Textile Park Road",
      address_line2: "Gandhipuram",
      description: "Fabric and knitted goods warehouse.",
    }),
  ],
  storefrontTemplates: [
    defineItem("storefront-template:home-category", { code: "home-category", name: "Home Category", sort_order: 10, badge_text: "Shop by category", title: "Category stories driven from live catalog masters.", description: "Top menu and catalog categories stay aligned with shared core master data.", cta_primary_label: "Browse catalog", cta_primary_href: "/search", cta_secondary_label: null, cta_secondary_href: null, icon_key: null, theme_key: "neutral" }),
    defineItem("storefront-template:home-featured", { code: "home-featured", name: "Home Featured", sort_order: 20, badge_text: "Featured edit", title: "Featured products now come from the storefront publishing profile.", description: "This section is safe to keep backend-driven because category, price, and stock all resolve from the same product source.", cta_primary_label: null, cta_primary_href: null, cta_secondary_label: null, cta_secondary_href: null, icon_key: null, theme_key: "sand" }),
    defineItem("storefront-template:home-cta", { code: "home-cta", name: "Home CTA", sort_order: 30, badge_text: "Storefront ready", title: "Ship catalog, checkout, and order operations from one suite.", description: "This CTA stays aligned with the current go-live storefront and operations baseline.", cta_primary_label: "Open storefront", cta_primary_href: "/public/v1/storefront/catalog", cta_secondary_label: "Review orders", cta_secondary_href: "/dashboard/apps/ecommerce/orders", icon_key: "sparkles", theme_key: "cta" }),
  ],
  sliderThemes: [
    defineItem("slider-theme:signature-01", { code: "signature-01", name: "Signature Ember", sort_order: 10, add_to_cart_label: "Add to cart", view_details_label: "View details", background_from: "#2b1a14", background_via: "#6b4633", background_to: "#f2ddc8", text_color: "#ffffff", muted_text_color: "#efe2d6", badge_background: "#f2ddc8", badge_text_color: "#2b1a14", primary_button_background: "#ffffff", primary_button_text_color: "#2b1a14", secondary_button_background: "#6b4633", secondary_button_text_color: "#ffffff", nav_background: "#2b1a14", nav_text_color: "#ffffff" }),
    defineItem("slider-theme:signature-02", { code: "signature-02", name: "Walnut Glow", sort_order: 20, add_to_cart_label: "Add to bag", view_details_label: "Explore", background_from: "#311f19", background_via: "#7a503c", background_to: "#f6e6d3", text_color: "#ffffff", muted_text_color: "#f3e7dc", badge_background: "#f6e6d3", badge_text_color: "#311f19", primary_button_background: "#ffffff", primary_button_text_color: "#311f19", secondary_button_background: "#7a503c", secondary_button_text_color: "#ffffff", nav_background: "#311f19", nav_text_color: "#ffffff" }),
  ],
}
