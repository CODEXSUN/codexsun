export interface EcommerceWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const ecommerceWorkspaceItems: EcommerceWorkspaceItem[] = [
  {
    id: 'overview',
    name: 'Ecommerce Overview',
    route: '/admin/dashboard/ecommerce',
    summary: 'Operational view of storefront, customers, and order flow.',
  },
  {
    id: 'orders',
    name: 'Orders',
    route: '/admin/dashboard/orders',
    summary: 'Backoffice order orchestration and fulfillment operations.',
  },
  {
    id: 'customers',
    name: 'Customers',
    route: '/admin/dashboard/customers',
    summary: 'Customer helpdesk and support-oriented commerce context.',
  },
  {
    id: 'products',
    name: 'Products',
    route: '/admin/dashboard/products',
    summary: 'Product catalog administration and ecommerce merchandising base.',
  },
  {
    id: 'mailbox',
    name: 'Mailbox',
    route: '/admin/dashboard/mailbox/messages',
    summary: 'Commerce communication templates and outbound messaging.',
  },
  {
    id: 'storefront-designer',
    name: 'Storefront Designer',
    route: '/admin/dashboard/storefront-designer',
    summary: 'Storefront layout, campaign, and merchandising surfaces.',
  },
  {
    id: 'slider-themes',
    name: 'Storefront Slider',
    route: '/admin/dashboard/slider-themes',
    summary: 'Slider themes, hero motion, and storefront banner settings.',
  },
  {
    id: 'settings',
    name: 'Ecommerce Settings',
    route: '/admin/dashboard/ecommerce/settings',
    summary: 'Pricing formula defaults for purchase, sell, and MRP calculations.',
  },
]
