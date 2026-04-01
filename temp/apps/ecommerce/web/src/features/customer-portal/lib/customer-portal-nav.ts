import {
  Bell,
  CircleUserRound,
  Headphones,
  Heart,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react'
import { buildCustomerPortalPath } from '@framework-core/web/auth/lib/portal-routing'

export const customerPortalLinks = [
  { title: 'Overview', href: buildCustomerPortalPath(), icon: LayoutDashboard },
  { title: 'Orders', href: buildCustomerPortalPath('/orders'), icon: ShoppingBag },
  { title: 'Profile', href: buildCustomerPortalPath('/profile'), icon: CircleUserRound },
  { title: 'Wishlist', href: buildCustomerPortalPath('/wishlist'), icon: Heart },
  { title: 'Cart', href: buildCustomerPortalPath('/cart'), icon: ShoppingCart },
  { title: 'Notifications', href: buildCustomerPortalPath('/notifications'), icon: Bell },
  { title: 'Support', href: buildCustomerPortalPath('/support'), icon: Headphones },
] as const

export function resolveCustomerPortalTitle(pathname: string) {
  const activeLink = customerPortalLinks.find((link) => pathname === link.href)
  if (activeLink) {
    return activeLink.title
  }

  return 'Customer Portal'
}
