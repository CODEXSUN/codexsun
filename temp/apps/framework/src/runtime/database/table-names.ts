export const migrationTableName = 'system_migrations'
export const seederTableName = 'system_seeders'

export const authTableNames = {
  users: 'auth_users',
  contactVerifications: 'auth_contact_verifications',
  roles: 'auth_roles',
  permissions: 'auth_permissions',
  userRoles: 'auth_user_roles',
  rolePermissions: 'auth_role_permissions',
} as const

export const commonTableNames = {
  countries: 'common_countries',
  states: 'common_states',
  districts: 'common_districts',
  cities: 'common_cities',
  pincodes: 'common_pincodes',
  contactGroups: 'common_contact_groups',
  contactTypes: 'common_contact_types',
  productGroups: 'common_product_groups',
  productCategories: 'common_product_categories',
  productTypes: 'common_product_types',
  units: 'common_units',
  hsnCodes: 'common_hsn_codes',
  taxes: 'common_taxes',
  brands: 'common_brands',
  colours: 'common_colours',
  sizes: 'common_sizes',
  currencies: 'common_currencies',
  orderTypes: 'common_order_types',
  styles: 'common_styles',
  transports: 'common_transports',
  warehouses: 'common_warehouses',
  destinations: 'common_destinations',
  paymentTerms: 'common_payment_terms',
  storefrontTemplates: 'common_storefront_templates',
  sliderThemes: 'common_slider_themes',
} as const

export const companyTableNames = {
  companies: 'companies',
  logos: 'company_logos',
  addresses: 'company_addresses',
  emails: 'company_emails',
  phones: 'company_phones',
  bankAccounts: 'company_bank_accounts',
} as const

export const contactTableNames = {
  contacts: 'contacts',
  addresses: 'contact_addresses',
  emails: 'contact_emails',
  phones: 'contact_phones',
  bankAccounts: 'contact_bank_accounts',
  gstDetails: 'contact_gst_details',
} as const

export const productTableNames = {
  products: 'products',
  variants: 'product_variants',
  variantAttributes: 'product_variant_attributes',
  images: 'product_images',
  variantImages: 'product_variant_images',
  stockItems: 'stock_items',
  stockMovements: 'stock_movements',
  prices: 'product_prices',
  discounts: 'product_discounts',
  offers: 'product_offers',
  attributes: 'product_attributes',
  attributeValues: 'product_attribute_values',
  variantMap: 'product_variant_map',
  seo: 'product_seo',
  storefront: 'product_storefront_profiles',
  reviews: 'product_reviews',
  tags: 'product_tags',
  tagMap: 'product_tag_map',
} as const

export const mediaTableNames = {
  files: 'media_files',
  folders: 'media_folders',
  tags: 'media_tags',
  tagMap: 'media_tag_map',
  usage: 'media_usage',
  versions: 'media_versions',
} as const

export const storefrontTableNames = {
  orders: 'storefront_orders',
  orderItems: 'storefront_order_items',
} as const

export const customerTableNames = {
  deliveryAddresses: 'customer_delivery_addresses',
} as const

export const commerceTableNames = {
  orderEvents: 'storefront_order_events',
  shipments: 'storefront_shipments',
  shipmentEvents: 'storefront_shipment_events',
  invoices: 'sales_invoices',
  invoiceItems: 'sales_invoice_items',
  vouchers: 'accounting_vouchers',
  voucherLines: 'accounting_voucher_lines',
} as const

export const billingTableNames = {
  ledgerGroups: 'billing_ledger_groups',
  ledgers: 'billing_ledgers',
} as const

export const mailboxTableNames = {
  templates: 'mailbox_templates',
  messages: 'mailbox_messages',
  recipients: 'mailbox_message_recipients',
} as const

export const frappeTableNames = {
  purchaseReceipts: 'frappe_purchase_receipts',
  purchaseReceiptItems: 'frappe_purchase_receipt_items',
  itemProductSyncLogs: 'frappe_item_product_sync_logs',
} as const

export const taskTableNames = {
  tasks: 'tasks',
  groups: 'task_groups',
  milestones: 'task_milestones',
  activities: 'task_activities',
  templates: 'task_templates',
  templateItems: 'task_template_items',
  checklistItems: 'task_checklist_items',
} as const

export const notificationTableNames = {
  notifications: 'notifications',
} as const
