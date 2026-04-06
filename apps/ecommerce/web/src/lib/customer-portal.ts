import {
  Gift,
  Heart,
  Headphones,
  Package,
  Settings2,
  ShoppingCart,
  Sparkles,
  TicketPercent,
  UserRound,
  type LucideIcon,
} from "lucide-react"

export type PortalSectionId =
  | "overview"
  | "profile"
  | "wishlist"
  | "cart"
  | "checkout"
  | "orders"
  | "support"
  | "coupons"
  | "gift-cards"
  | "rewards"

export type CustomerPortalSection = {
  id: PortalSectionId
  label: string
  summary: string
  icon: LucideIcon
}

export const customerPortalSections: CustomerPortalSection[] = [
  {
    id: "overview",
    label: "Overview",
    summary: "Quick view of account, rewards, and current portal activity.",
    icon: Sparkles,
  },
  {
    id: "profile",
    label: "Profile",
    summary: "Customer-safe profile and contact fields linked back to core contact data.",
    icon: UserRound,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    summary: "Saved products that can move back into cart or checkout.",
    icon: Heart,
  },
  {
    id: "cart",
    label: "Cart",
    summary: "Live local cart summary with a direct move to checkout.",
    icon: ShoppingCart,
  },
  {
    id: "checkout",
    label: "Checkout",
    summary: "Complete delivery, payment, and order confirmation without leaving the portal.",
    icon: ShoppingCart,
  },
  {
    id: "orders",
    label: "Orders",
    summary: "Portal-owned order history and order-detail handoff.",
    icon: Package,
  },
  {
    id: "coupons",
    label: "Coupons",
    summary: "Available offers assigned to this customer account.",
    icon: TicketPercent,
  },
  {
    id: "gift-cards",
    label: "Gift Cards",
    summary: "Stored gift balances and future purchase credit.",
    icon: Gift,
  },
  {
    id: "rewards",
    label: "Rewards",
    summary: "Tier progress, points history, and customer-retention balance.",
    icon: Settings2,
  },
  {
    id: "support",
    label: "Support",
    summary: "Reach company support using the shared contact channels.",
    icon: Headphones,
  },
]

export function normalizePortalSectionId(value: string | undefined): PortalSectionId {
  const matchedSection = customerPortalSections.find((section) => section.id === value)

  return matchedSection?.id ?? "overview"
}
