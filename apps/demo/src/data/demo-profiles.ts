import type { DemoProfile } from "../../shared/index.js"

export const demoProfiles: DemoProfile[] = [
  {
    id: "default",
    name: "Default data",
    summary:
      "Install the current repo-owned baseline records across shared masters, products, billing, ecommerce, and frappe.",
  },
  {
    id: "demo",
    name: "Demo data",
    summary:
      "Install the default baseline plus extra showcase companies, contacts, categories, customers, and storefront orders where demo data is available.",
  },
]
