import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import type { MailboxService } from "../../../cxapp/src/services/mailbox-service.js"
import type {
  CustomerAccount,
  StorefrontOrder,
  StorefrontProductCard,
  StorefrontSettings,
} from "../../shared/index.js"

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeText(value: string | null | undefined, fallback = "") {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTimestamp(value: string | null | undefined, fallback = "Pending") {
  if (!value) {
    return fallback
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function resolveFrontendOrigin(config: ServerConfig) {
  const configuredHost = normalizeText(config.frontendDomain, "localhost")
  const host = configuredHost.startsWith("http://") || configuredHost.startsWith("https://")
    ? configuredHost
    : `${config.tlsEnabled ? "https" : "http"}://${configuredHost}`
  const port = config.tlsEnabled ? config.frontendHttpsPort : config.frontendHttpPort
  const defaultPort =
    (config.tlsEnabled && port === 443) || (!config.tlsEnabled && port === 80)

  if (configuredHost.startsWith("http://") || configuredHost.startsWith("https://")) {
    return configuredHost.replace(/\/$/, "")
  }

  return `${host}${defaultPort ? "" : `:${port}`}`
}

function resolveAbsoluteUrl(config: ServerConfig, href: string) {
  return new URL(href, `${resolveFrontendOrigin(config)}/`).toString()
}

function resolveImageUrl(config: ServerConfig, imageUrl: string | null | undefined) {
  const trimmed = imageUrl?.trim()

  if (!trimmed) {
    return "https://placehold.co/720x960/e7dccd/3d2b21?text=Tm+Next"
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return resolveAbsoluteUrl(config, trimmed)
}

function renderProductCardsHtml(
  items: StorefrontProductCard[],
  config: ServerConfig,
  settings: StorefrontSettings
) {
  if (items.length === 0) {
    return ""
  }

  return items
    .map((item, index) => {
      const productHref = resolveAbsoluteUrl(config, `/shop/product/${encodeURIComponent(item.slug)}`)
      const imageUrl = resolveImageUrl(config, item.primaryImageUrl)
      const badge = item.badge ?? (item.isNewArrival ? "New arrival" : item.isBestSeller ? "Best seller" : null)

      return `
        <div style="display:inline-block;vertical-align:top;width:calc(50% - 10px);max-width:calc(50% - 10px);margin:0 ${index % 2 === 0 ? "10px" : "0"} 16px 0;">
          <a href="${productHref}" style="display:block;overflow:hidden;border:1px solid #e6d8c8;border-radius:22px;background:#fffaf4;text-decoration:none;color:#201711;">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}" style="display:block;width:100%;height:188px;object-fit:cover;background:#efe3d5;" />
            <div style="padding:18px;">
              ${
                badge
                  ? `<div style="display:inline-block;border-radius:999px;background:${escapeHtml(settings.sections.featured.cardDesign.badgeBackgroundColor)};color:${escapeHtml(settings.sections.featured.cardDesign.badgeTextColor)};padding:6px 10px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(badge)}</div>`
                  : ""
              }
              <div style="margin-top:12px;font-size:17px;line-height:1.4;font-weight:700;color:#201711;">${escapeHtml(item.name)}</div>
              <div style="margin-top:6px;font-size:13px;line-height:1.6;color:#7d6859;">${escapeHtml(normalizeText(item.shortDescription, item.brandName ?? item.categoryName ?? "Storefront arrival"))}</div>
              <div style="margin-top:14px;">
                <div style="font-size:18px;font-weight:700;color:#201711;">${escapeHtml(formatCurrency(item.sellingPrice))}</div>
                <div style="margin-top:4px;font-size:12px;color:#9a8170;text-decoration:line-through;">${escapeHtml(formatCurrency(item.mrp))}</div>
                <div style="display:inline-block;margin-top:10px;border-radius:999px;background:#fff0df;color:#8b4d17;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                  Save ${escapeHtml(String(item.discountPercent))}%
                </div>
              </div>
            </div>
          </a>
        </div>
      `
    })
    .join("")
}

function renderOrderItemsHtml(order: StorefrontOrder, config: ServerConfig) {
  return order.items
    .map((item, index) => {
      const productHref = resolveAbsoluteUrl(config, `/shop/product/${encodeURIComponent(item.slug)}`)
      const attributes = item.attributes
        .map(
          (attribute) => `
            <span style="display:inline-flex;align-items:center;border-radius:999px;background:#f4ede3;color:#5d4839;padding:5px 10px;font-size:11px;line-height:1.2;">
              ${escapeHtml(attribute.name)}: ${escapeHtml(attribute.value)}
            </span>
          `
        )
        .join("")

      return `
        <div style="display:flex;gap:16px;border:1px solid #eadfce;border-radius:22px;background:#fffaf4;padding:18px;margin:0 0 ${index === order.items.length - 1 ? 0 : 16}px;">
          <img src="${escapeHtml(resolveImageUrl(config, item.imageUrl))}" alt="${escapeHtml(item.name)}" style="width:84px;height:104px;border-radius:18px;object-fit:cover;background:#efe3d5;flex:none;" />
          <div style="min-width:0;flex:1;">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;justify-content:space-between;">
              <div>
                <a href="${productHref}" style="color:#201711;text-decoration:none;font-size:16px;line-height:1.45;font-weight:700;">${escapeHtml(item.name)}</a>
                <div style="margin-top:4px;font-size:13px;color:#7d6859;">${escapeHtml(normalizeText(item.brandName, "Tm Next Storefront"))}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:700;color:#201711;">${escapeHtml(formatCurrency(item.lineTotal))}</div>
                <div style="font-size:12px;color:#7d6859;">Qty ${escapeHtml(String(item.quantity))} x ${escapeHtml(formatCurrency(item.unitPrice))}</div>
              </div>
            </div>
            ${
              item.variantLabel
                ? `<div style="margin-top:12px;"><span style="display:inline-flex;align-items:center;border-radius:999px;background:#2b1a14;color:#fff3eb;padding:6px 11px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(item.variantLabel)}</span></div>`
                : ""
            }
            ${
              attributes
                ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">${attributes}</div>`
                : ""
            }
          </div>
        </div>
      `
    })
    .join("")
}

function renderMilestonesHtml(order: StorefrontOrder) {
  const paymentCapturedAt =
    order.timeline.find((item) => item.code === "payment_captured")?.createdAt ?? null
  const deliveredAt =
    order.timeline.find((item) => item.code === "delivered")?.createdAt ?? null

  const milestones = [
    {
      label: "Purchased",
      value: formatTimestamp(order.createdAt),
      tone: "#214d38",
      background: "#edf7ee",
    },
    {
      label: "Paid",
      value: formatTimestamp(paymentCapturedAt),
      tone: "#7a4a17",
      background: "#fff3e5",
    },
    {
      label: "Delivered",
      value: formatTimestamp(deliveredAt, "Awaiting fulfillment"),
      tone: "#28546d",
      background: "#edf5fb",
    },
  ]

  return milestones
    .map(
      (milestone) => `
        <div style="border-radius:20px;background:${milestone.background};padding:16px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${milestone.tone};">${milestone.label}</div>
          <div style="margin-top:8px;font-size:15px;line-height:1.6;font-weight:700;color:#201711;">${milestone.value}</div>
        </div>
      `
    )
    .join("")
}

function buildSupportFooter(settings: StorefrontSettings, config: ServerConfig) {
  return {
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    supportMailTo: `mailto:${settings.supportEmail}`,
    supportPhoneHref: `tel:${settings.supportPhone.replace(/\s+/g, "")}`,
    storefrontHomeUrl: resolveAbsoluteUrl(config, "/"),
    storefrontCatalogUrl: resolveAbsoluteUrl(config, "/shop/catalog"),
    storefrontOrdersUrl: resolveAbsoluteUrl(config, "/profile"),
  }
}

export async function sendStorefrontWelcomeEmail(input: {
  mailboxService: MailboxService
  config: ServerConfig
  settings: StorefrontSettings
  account: CustomerAccount
  newArrivalItems: StorefrontProductCard[]
}) {
  const support = buildSupportFooter(input.settings, input.config)

  await input.mailboxService.sendTemplatedEmail({
    to: [
      {
        email: input.account.email,
        name: input.account.displayName,
      },
    ],
    templateCode: "storefront_customer_welcome",
    templateData: {
      storeName: "Tm Next Storefront",
      displayName: input.account.displayName,
      summary:
        "Your customer portal is live. Browse fresh arrivals, manage orders, and keep your next factory-direct pick just a click away.",
      shopNowUrl: support.storefrontCatalogUrl,
      shopNowLabel: "Start shopping",
      accountUrl: support.storefrontOrdersUrl,
      accountLabel: "Open customer portal",
      supportEmail: support.supportEmail,
      supportPhone: support.supportPhone,
      supportMailTo: support.supportMailTo,
      supportPhoneHref: support.supportPhoneHref,
      storefrontHomeUrl: support.storefrontHomeUrl,
      announcement: input.settings.announcement,
      productCardsHtml: renderProductCardsHtml(
        input.newArrivalItems.slice(0, 4),
        input.config,
        input.settings
      ),
    },
    referenceType: "storefront_customer_welcome",
    referenceId: input.account.id,
  })
}

export async function sendStorefrontCampaignSubscriptionEmail(input: {
  mailboxService: MailboxService
  config: ServerConfig
  settings: StorefrontSettings
  account: CustomerAccount
}) {
  const support = buildSupportFooter(input.settings, input.config)

  await input.mailboxService.sendTemplatedEmail({
    to: [
      {
        email: input.account.email,
        name: input.account.displayName,
      },
    ],
    templateCode: "storefront_campaign_subscription",
    templateData: {
      storeName: "Tm Next Storefront",
      displayName: input.account.displayName,
      summary:
        "You are subscribed to launch drops, curated offers, and customer-only campaign notes from the storefront.",
      catalogUrl: support.storefrontCatalogUrl,
      catalogLabel: "Browse latest arrivals",
      supportEmail: support.supportEmail,
      supportPhone: support.supportPhone,
      supportMailTo: support.supportMailTo,
      supportPhoneHref: support.supportPhoneHref,
      storefrontHomeUrl: support.storefrontHomeUrl,
    },
    referenceType: "storefront_campaign_subscription",
    referenceId: input.account.id,
  })
}

export async function sendStorefrontOrderConfirmedEmail(input: {
  mailboxService: MailboxService
  config: ServerConfig
  settings: StorefrontSettings
  order: StorefrontOrder
  customerEmail: string
  customerName: string
}) {
  const support = buildSupportFooter(input.settings, input.config)
  const orderUrl = resolveAbsoluteUrl(
    input.config,
    `/customer/orders/${encodeURIComponent(input.order.id)}`
  )

  await input.mailboxService.sendTemplatedEmail({
    to: [
      {
        email: input.customerEmail,
        name: input.customerName,
      },
    ],
    templateCode: "storefront_order_confirmed",
    templateData: {
      storeName: "Tm Next Storefront",
      displayName: input.customerName,
      orderNumber: input.order.orderNumber,
      orderStatus: input.order.status.replace(/_/g, " "),
      totalAmount: formatCurrency(input.order.totalAmount),
      purchasedAt: formatTimestamp(input.order.createdAt),
      paymentStatus: input.order.paymentStatus,
      orderUrl,
      orderUrlLabel: "Open order details",
      supportEmail: support.supportEmail,
      supportPhone: support.supportPhone,
      supportMailTo: support.supportMailTo,
      supportPhoneHref: support.supportPhoneHref,
      storefrontHomeUrl: support.storefrontHomeUrl,
      orderItemsHtml: renderOrderItemsHtml(input.order, input.config),
      milestoneCardsHtml: renderMilestonesHtml(input.order),
      reviewUrl: orderUrl,
    },
    referenceType: "storefront_order_confirmed",
    referenceId: input.order.id,
  })
}
