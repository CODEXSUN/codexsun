import type { CommonModuleItem, CommonModuleKey, Contact, Product } from "../../../core/shared/index.js"
import type { BootstrapSnapshot, Company } from "../../../cxapp/shared/index.js"
import type { CustomerAccount, StorefrontOrder } from "../../../ecommerce/shared/index.js"
import type {
  BillingCategory,
  BillingLedger,
  BillingVoucher,
  BillingVoucherGroup,
  BillingVoucherMasterType,
} from "../../../billing/shared/index.js"
import type {
  FrappeItem,
  FrappeItemProductSyncLog,
  FrappePurchaseReceipt,
  FrappeSettings,
  FrappeTodo,
} from "../../../frappe/shared/index.js"

import { billingCategories, billingLedgers, billingVoucherGroups, billingVoucherMasterTypes, billingVouchers } from "../../../billing/src/data/billing-seed.js"
import { commonModuleItemsByKey as defaultCommonModuleItemsByKey } from "../../../core/src/common-modules/seed-data.js"
import { contacts } from "../../../core/src/data/core-seed.js"
import { products } from "../../../core/src/data/product-seed.js"
import { bootstrapSnapshot, companies } from "../../../cxapp/src/data/cxapp-seed.js"
import { defaultStorefrontSettings } from "../../../ecommerce/src/data/storefront-seed.js"
import { frappeItemProductSyncLogs, frappeItems, frappePurchaseReceipts, frappeSettings, frappeTodos } from "../../../frappe/src/data/frappe-seed.js"

export type DemoDataBundle = {
  bootstrapSnapshots: BootstrapSnapshot[]
  companies: Company[]
  commonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]>
  contacts: Contact[]
  products: Product[]
  storefrontSettings: typeof defaultStorefrontSettings
  customerAccounts: CustomerAccount[]
  orders: StorefrontOrder[]
  billing: {
    categories: BillingCategory[]
    ledgers: BillingLedger[]
    voucherGroups: BillingVoucherGroup[]
    voucherTypes: BillingVoucherMasterType[]
    vouchers: BillingVoucher[]
  }
  frappe: {
    settings: FrappeSettings
    todos: FrappeTodo[]
    items: FrappeItem[]
    purchaseReceipts: FrappePurchaseReceipt[]
    itemProductSyncLogs: FrappeItemProductSyncLog[]
  }
}

const timestamp = "2026-04-05T10:30:00.000Z"

function clone<T>(value: T): T {
  return structuredClone(value)
}

function withDemoProductCategory() {
  const nextItems = clone(defaultCommonModuleItemsByKey)
  nextItems.productCategories = [
    ...nextItems.productCategories,
    {
      id: "product-category:studio-drops",
      code: "CAT-STUDIO-DROPS",
      name: "Studio Drops",
      description: "Drop-led capsule launches used for sales demos and merchandising walkthroughs.",
      image: "https://placehold.co/320x220/f4ebe1/3b2a20?text=Studio+Drops",
      position_order: 2,
      show_on_storefront_top_menu: true,
      show_on_storefront_catalog: true,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  return nextItems
}

function createDemoCompanies() {
  return [
    ...clone(companies),
    {
      ...clone(companies[1]!),
      id: "company:atelier-demo",
      name: "Atelier Demo",
      legalName: "Atelier Demo Private Limited",
      tagline: "Showcase brand for live customer walkthroughs.",
      shortAbout: "Live demo brand used for tailored presentations.",
      longAbout:
        "Atelier Demo is the showcase company profile used to present storefront, billing, and customer operations during sales walkthroughs.",
      website: "https://atelier-demo.example.com",
      description: "Presentation-first demo tenant for storefront and ERP walkthroughs.",
      primaryEmail: "hello@atelier-demo.example.com",
      primaryPhone: "+91 90000 00071",
      createdAt: timestamp,
      updatedAt: timestamp,
      logos: [
        {
          id: "company-logo:atelier-demo:primary",
          companyId: "company:atelier-demo",
          logoUrl: "https://placehold.co/160x160/f8efe7/3f2c22?text=AD",
          logoType: "primary",
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      addresses: [
        {
          id: "company-address:atelier-demo:hq",
          companyId: "company:atelier-demo",
          addressTypeId: "address-type:office",
          addressLine1: "45 Presentation Arcade",
          addressLine2: "Teynampet",
          cityId: "city:chennai",
          districtId: "district:chennai",
          stateId: "state:tamil-nadu",
          countryId: "country:india",
          pincodeId: "pincode:600001",
          latitude: 13.0418,
          longitude: 80.2467,
          isDefault: true,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      emails: [
        {
          id: "company-email:atelier-demo:primary",
          companyId: "company:atelier-demo",
          email: "hello@atelier-demo.example.com",
          emailType: "support",
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      phones: [
        {
          id: "company-phone:atelier-demo:primary",
          companyId: "company:atelier-demo",
          phoneNumber: "+91 90000 00071",
          phoneType: "office",
          isPrimary: true,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      bankAccounts: [
        {
          id: "company-bank:atelier-demo:primary",
          companyId: "company:atelier-demo",
          bankName: "Kotak Mahindra Bank",
          accountNumber: "008812345678",
          accountHolderName: "Atelier Demo Private Limited",
          ifsc: "KKBK0001987",
          branch: "Teynampet",
          isPrimary: true,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
  ]
}

function createDemoContacts() {
  return [
    ...clone(contacts),
    {
      ...clone(contacts[0]!),
      id: "contact:anaya-menon",
      uuid: "5f0fd6f8-31d2-44db-9e20-bbc1f88aa201",
      code: "C0091",
      name: "Anaya Menon",
      description: "Demo retail customer used for storefront and order-history walkthroughs.",
      primaryEmail: "anaya.menon@example.com",
      primaryPhone: "+91 98888 12001",
      createdAt: timestamp,
      updatedAt: timestamp,
      addresses: [
        {
          ...clone(contacts[0]!.addresses[0]!),
          id: "contact-address:anaya:home",
          contactId: "contact:anaya-menon",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      emails: [
        {
          ...clone(contacts[0]!.emails[0]!),
          id: "contact-email:anaya:primary",
          contactId: "contact:anaya-menon",
          email: "anaya.menon@example.com",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      phones: [
        {
          ...clone(contacts[0]!.phones[0]!),
          id: "contact-phone:anaya:primary",
          contactId: "contact:anaya-menon",
          phoneNumber: "+91 98888 12001",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
    {
      ...clone(contacts[0]!),
      id: "contact:rahul-bose",
      uuid: "6a67b6af-d68e-4b59-97f1-fb2a82645d22",
      code: "C0092",
      name: "Rahul Bose",
      description: "Demo B2B customer for multi-order commerce and billing walkthroughs.",
      primaryEmail: "rahul.bose@example.com",
      primaryPhone: "+91 98888 12002",
      createdAt: timestamp,
      updatedAt: timestamp,
      addresses: [
        {
          ...clone(contacts[0]!.addresses[0]!),
          id: "contact-address:rahul:office",
          contactId: "contact:rahul-bose",
          addressLine1: "11 Merch Square",
          addressLine2: "Koramangala",
          cityId: "city:bengaluru",
          districtId: "district:bengaluru",
          stateId: "state:karnataka",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      emails: [
        {
          ...clone(contacts[0]!.emails[0]!),
          id: "contact-email:rahul:primary",
          contactId: "contact:rahul-bose",
          email: "rahul.bose@example.com",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      phones: [
        {
          ...clone(contacts[0]!.phones[0]!),
          id: "contact-phone:rahul:primary",
          contactId: "contact:rahul-bose",
          phoneNumber: "+91 98888 12002",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
  ]
}

function createDemoCustomerAccounts(): CustomerAccount[] {
  return [
    {
      id: "ecommerce-customer:anaya-menon",
      authUserId: null,
      coreContactId: "contact:anaya-menon",
      email: "anaya.menon@example.com",
      phoneNumber: "+91 98888 12001",
      displayName: "Anaya Menon",
      companyName: null,
      gstin: null,
      isActive: true,
      lastLoginAt: "2026-04-04T18:20:00.000Z",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "ecommerce-customer:rahul-bose",
      authUserId: null,
      coreContactId: "contact:rahul-bose",
      email: "rahul.bose@example.com",
      phoneNumber: "+91 98888 12002",
      displayName: "Rahul Bose",
      companyName: "Rahul Retail Studio",
      gstin: "29ABCDE1234F1Z5",
      isActive: true,
      lastLoginAt: "2026-04-04T19:10:00.000Z",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

function createTimelineEvent(id: string, code: string, label: string, summary: string, createdAt: string) {
  return { id, code, label, summary, createdAt }
}

function createDemoOrders(): StorefrontOrder[] {
  const firstProduct = products[0]!
  const secondProduct = products[1]!

  return [
    {
      id: "storefront-order:demo-001",
      orderNumber: "ECM-20260405-0201",
      customerAccountId: "ecommerce-customer:anaya-menon",
      coreContactId: "contact:anaya-menon",
        status: "shipped",
        paymentStatus: "paid",
        paymentProvider: "razorpay",
        paymentMode: "mock",
        fulfillmentMethod: "delivery",
        paymentCollectionMethod: "online",
        pickupLocation: null,
        shipmentDetails: {
          carrierName: "Blue Dart",
          trackingId: "BD-ECM-0201",
          trackingUrl: "https://tracking.example.com/BD-ECM-0201",
          note: "Demo shipment currently in transit.",
          markedFulfilmentAt: "2026-04-04T14:30:00.000Z",
          shippedAt: "2026-04-05T08:40:00.000Z",
          deliveredAt: null,
          updatedAt: "2026-04-05T08:40:00.000Z",
        },
        refund: null,
        providerOrderId: "order_demo_001",
      providerPaymentId: "pay_demo_001",
      checkoutFingerprint: null,
      shippingAddress: {
        fullName: "Anaya Menon",
        email: "anaya.menon@example.com",
        phoneNumber: "+91 98888 12001",
        line1: "21 Temple View",
        line2: "Mylapore",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      },
      billingAddress: {
        fullName: "Anaya Menon",
        email: "anaya.menon@example.com",
        phoneNumber: "+91 98888 12001",
        line1: "21 Temple View",
        line2: "Mylapore",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      },
      items: [
        {
          id: "order-item:demo-001",
          productId: firstProduct.id,
          slug: firstProduct.slug,
          name: firstProduct.name,
          brandName: firstProduct.brandName,
          imageUrl: firstProduct.primaryImageUrl,
          variantLabel: null,
          attributes: [],
          quantity: 1,
          unitPrice: firstProduct.basePrice,
          mrp: firstProduct.basePrice + 600,
          lineTotal: firstProduct.basePrice,
        },
      ],
      itemCount: 1,
      subtotalAmount: firstProduct.basePrice,
      discountAmount: 600,
      shippingAmount: 0,
      handlingAmount: 49,
      totalAmount: firstProduct.basePrice + 49,
      currency: "INR",
      notes: "Seeded demo order for shipping and tracking walkthroughs.",
      timeline: [
        createTimelineEvent(
          "timeline:demo-001-created",
          "order_created",
          "Order created",
          "Demo order was seeded for storefront walkthroughs.",
          "2026-04-04T09:15:00.000Z"
        ),
        createTimelineEvent(
          "timeline:demo-001-paid",
          "payment_captured",
          "Payment captured",
          "Mock payment was captured for the demo journey.",
          "2026-04-04T09:18:00.000Z"
        ),
        createTimelineEvent(
          "timeline:demo-001-shipped",
          "order_shipped",
          "Order shipped",
          "Shipment is currently in transit for the seeded demo order.",
          "2026-04-05T08:40:00.000Z"
        ),
      ],
      createdAt: "2026-04-04T09:15:00.000Z",
      updatedAt: "2026-04-05T08:40:00.000Z",
    },
    {
      id: "storefront-order:demo-002",
      orderNumber: "ECM-20260405-0202",
      customerAccountId: "ecommerce-customer:rahul-bose",
      coreContactId: "contact:rahul-bose",
        status: "delivered",
        paymentStatus: "paid",
        paymentProvider: "razorpay",
        paymentMode: "mock",
        fulfillmentMethod: "delivery",
        paymentCollectionMethod: "online",
        pickupLocation: null,
        shipmentDetails: {
          carrierName: "Delhivery",
          trackingId: "DLV-ECM-0202",
          trackingUrl: "https://tracking.example.com/DLV-ECM-0202",
          note: "Demo shipment delivered successfully.",
          markedFulfilmentAt: "2026-04-04T11:45:00.000Z",
          shippedAt: "2026-04-04T17:20:00.000Z",
          deliveredAt: "2026-04-05T12:15:00.000Z",
          updatedAt: "2026-04-05T12:15:00.000Z",
        },
        refund: null,
        providerOrderId: "order_demo_002",
      providerPaymentId: "pay_demo_002",
      checkoutFingerprint: null,
      shippingAddress: {
        fullName: "Rahul Bose",
        email: "rahul.bose@example.com",
        phoneNumber: "+91 98888 12002",
        line1: "11 Merch Square",
        line2: "Koramangala",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560001",
      },
      billingAddress: {
        fullName: "Rahul Bose",
        email: "rahul.bose@example.com",
        phoneNumber: "+91 98888 12002",
        line1: "11 Merch Square",
        line2: "Koramangala",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560001",
      },
      items: [
        {
          id: "order-item:demo-002",
          productId: secondProduct.id,
          slug: secondProduct.slug,
          name: secondProduct.name,
          brandName: secondProduct.brandName,
          imageUrl: secondProduct.primaryImageUrl,
          variantLabel: null,
          attributes: [],
          quantity: 2,
          unitPrice: secondProduct.basePrice,
          mrp: secondProduct.basePrice + 400,
          lineTotal: secondProduct.basePrice * 2,
        },
      ],
      itemCount: 2,
      subtotalAmount: secondProduct.basePrice * 2,
      discountAmount: 800,
      shippingAmount: 149,
      handlingAmount: 99,
      totalAmount: secondProduct.basePrice * 2 + 149 + 99,
      currency: "INR",
      notes: "Seeded demo order for delivered state and portal history.",
      timeline: [
        createTimelineEvent(
          "timeline:demo-002-created",
          "order_created",
          "Order created",
          "Demo order was seeded for portal history review.",
          "2026-04-03T10:00:00.000Z"
        ),
        createTimelineEvent(
          "timeline:demo-002-paid",
          "payment_captured",
          "Payment captured",
          "Mock payment completed for the demo customer order.",
          "2026-04-03T10:05:00.000Z"
        ),
        createTimelineEvent(
          "timeline:demo-002-delivered",
          "order_delivered",
          "Order delivered",
          "Seeded demo order completed successfully.",
          "2026-04-04T14:25:00.000Z"
        ),
      ],
      createdAt: "2026-04-03T10:00:00.000Z",
      updatedAt: "2026-04-04T14:25:00.000Z",
    },
  ]
}

export function buildDefaultDemoData(): DemoDataBundle {
  return {
    bootstrapSnapshots: [clone(bootstrapSnapshot)],
    companies: clone(companies),
    commonModuleItemsByKey: clone(defaultCommonModuleItemsByKey),
    contacts: clone(contacts),
    products: clone(products),
    storefrontSettings: clone(defaultStorefrontSettings),
    customerAccounts: [],
    orders: [],
    billing: {
      categories: clone(billingCategories),
      ledgers: clone(billingLedgers),
      voucherGroups: clone(billingVoucherGroups),
      voucherTypes: clone(billingVoucherMasterTypes),
      vouchers: clone(billingVouchers),
    },
    frappe: {
      settings: clone(frappeSettings),
      todos: clone(frappeTodos),
      items: clone(frappeItems),
      purchaseReceipts: clone(frappePurchaseReceipts),
      itemProductSyncLogs: clone(frappeItemProductSyncLogs),
    },
  }
}

export function buildDemoProfileData(): DemoDataBundle {
  const base = buildDefaultDemoData()

  return {
    ...base,
    companies: createDemoCompanies(),
    commonModuleItemsByKey: withDemoProductCategory(),
    contacts: createDemoContacts(),
    customerAccounts: createDemoCustomerAccounts(),
    orders: createDemoOrders(),
  }
}
