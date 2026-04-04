import type { SeedMap } from "./helpers.js"
import { defineItem, defineNamedModuleItem } from "./helpers.js"

export const masterSeed: SeedMap = {
  contactGroups: [
    defineNamedModuleItem("contact-group", "retail", "retail", "Retail Customers", "Walk-in and storefront customers."),
    defineNamedModuleItem("contact-group", "vendors", "vendors", "Vendors", "Suppliers and procurement parties."),
    defineNamedModuleItem("contact-group", "partners", "partners", "Partners", "Service and channel partners."),
  ],
  contactTypes: [
    defineNamedModuleItem("contact-type", "registered", "registered", "Registered", "GST-registered business contact."),
    defineNamedModuleItem("contact-type", "unregistered", "unregistered", "UnRegistered", "Consumer or non-GST contact."),
    defineNamedModuleItem("contact-type", "registered-customer-b2b", "registered-customer-b2b", "Registered Customer (B2B)", "GST-registered sell-side customer account."),
    defineNamedModuleItem("contact-type", "unregistered-customer-b2c", "unregistered-customer-b2c", "UnRegistered Customer (B2C)", "Consumer or walk-in sell-side customer account."),
    defineNamedModuleItem("contact-type", "partner", "partner", "Partner", "Shared service, channel, or logistics partner."),
    defineNamedModuleItem("contact-type", "supplier", "supplier", "Supplier", "Purchase-side supplier account."),
  ],
  addressTypes: [
    defineNamedModuleItem("address-type", "billing", "billing", "Billing", "Billing and invoice address."),
    defineNamedModuleItem("address-type", "shipping", "shipping", "Shipping", "Shipping and delivery address."),
    defineNamedModuleItem("address-type", "office", "office", "Office", "Office or business address."),
    defineNamedModuleItem("address-type", "branch", "branch", "Branch", "Branch or outlet address."),
    defineNamedModuleItem("address-type", "primary-1", "primary-1", "Primary 1", "Primary address slot one."),
    defineNamedModuleItem("address-type", "primary-2", "primary-2", "Primary 2", "Primary address slot two."),
  ],
  bankNames: [
    defineNamedModuleItem("bank-name", "state-bank-of-india", "SBI", "State Bank of India", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "hdfc-bank", "HDFC", "HDFC Bank", "Private sector banking master."),
    defineNamedModuleItem("bank-name", "icici-bank", "ICICI", "ICICI Bank", "Private sector banking master."),
    defineNamedModuleItem("bank-name", "axis-bank", "AXIS", "Axis Bank", "Private sector banking master."),
    defineNamedModuleItem("bank-name", "canara-bank", "CANARA", "Canara Bank", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "indian-bank", "INDIAN", "Indian Bank", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "indian-overseas-bank", "IOB", "Indian Overseas Bank", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "kotak-mahindra-bank", "KOTAK", "Kotak Mahindra Bank", "Private sector banking master."),
    defineNamedModuleItem("bank-name", "punjab-national-bank", "PNB", "Punjab National Bank", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "bank-of-baroda", "BOB", "Bank of Baroda", "Public sector banking master."),
    defineNamedModuleItem("bank-name", "union-bank-of-india", "UBI", "Union Bank of India", "Public sector banking master."),
  ],
  currencies: [
    defineItem("currency:inr", { code: "INR", name: "Indian Rupee", symbol: "Rs.", decimal_places: 2 }),
    defineItem("currency:usd", { code: "USD", name: "US Dollar", symbol: "$", decimal_places: 2 }),
    defineItem("currency:aed", { code: "AED", name: "UAE Dirham", symbol: "AED", decimal_places: 2 }),
  ],
  paymentTerms: [
    defineItem("payment-term:immediate", { code: "immediate", name: "Immediate", due_days: 0, description: "Pay immediately on billing." }),
    defineItem("payment-term:net-7", { code: "net-7", name: "Net 7", due_days: 7, description: "Payment due within 7 days." }),
    defineItem("payment-term:net-15", { code: "net-15", name: "Net 15", due_days: 15, description: "Payment due within 15 days." }),
    defineItem("payment-term:net-30", { code: "net-30", name: "Net 30", due_days: 30, description: "Payment due within 30 days." }),
  ],
  destinations: [
    defineNamedModuleItem("destination", "domestic", "domestic", "Domestic", "Domestic shipping and movement destination."),
    defineNamedModuleItem("destination", "export", "export", "Export", "Export or cross-border destination."),
  ],
  transports: [
    defineNamedModuleItem("transport", "surface", "surface", "Surface Courier", "Ground and standard courier service."),
    defineNamedModuleItem("transport", "air", "air", "Air Cargo", "Air cargo and express freight."),
    defineNamedModuleItem("transport", "pickup", "pickup", "Customer Pickup", "Customer self pickup or counter delivery."),
  ],
}
