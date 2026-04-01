import { lazy, Suspense, useMemo, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'
import { GlobalLoader } from '@/components/ui/global-loader'
import { RequireAuth } from '@framework-core/web/auth/components/require-auth'
import { RequireSuperAdmin } from '@framework-core/web/auth/components/require-super-admin'
import { rememberRequestedPath } from '@framework-core/web/auth/lib/navigation-state'
import { frontendTarget } from '@/config/frontend'
import { buildAdminPortalPath, buildCustomerPortalPath, customerPortalRoot } from '@framework-core/web/auth/lib/portal-routing'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { NotFoundPage } from '@/features/marketing/pages/not-found-page'
import { useSetup } from '@/features/setup/components/setup-provider'

function lazyPage<TModule extends Record<string, ComponentType<object>>>(
  loader: () => Promise<TModule>,
  key: keyof TModule,
): LazyExoticComponent<TModule[keyof TModule]> {
  return lazy(async () => ({ default: (await loader())[key] }))
}

function renderLazy(Component: ComponentType<object>) {
  return (
    <Suspense
      fallback={<GlobalLoader fullScreen={false} size="sm" />}
    >
      <Component />
    </Suspense>
  )
}

const UiDocsDesktopPage = lazy(() => import('@/features/ui-docs/pages/index'))
const UiDocsButtonPage = lazy(() => import('@/features/ui-docs/pages/button'))
const UiDocsBadgePage = lazy(() => import('@/features/ui-docs/pages/badge'))
const UiDocsCardPage = lazy(() => import('@/features/ui-docs/pages/card'))
const UiDocsInputPage = lazy(() => import('@/features/ui-docs/pages/input'))
const AppLayout = lazyPage(() => import('@/app/layouts/app-layout'), 'AppLayout')
const AuthLayout = lazyPage(() => import('@/app/layouts/auth-layout'), 'AuthLayout')
const CustomerPortalLayout = lazyPage(
  () => import('@/app/layouts/customer-portal-layout'),
  'CustomerPortalLayout',
)
const ShopLayout = lazyPage(() => import('@/app/layouts/shop-layout'), 'ShopLayout')
const WebLayout = lazyPage(() => import('@/app/layouts/web-layout'), 'WebLayout')
const AboutPage = lazyPage(() => import('@/features/marketing/pages/about-page'), 'AboutPage')
const BioPage = lazyPage(() => import('@/features/marketing/pages/bio-page'), 'BioPage')
const ContactPage = lazyPage(() => import('@/features/marketing/pages/contact-page'), 'ContactPage')
const EnquiryPage = lazyPage(() => import('@/features/marketing/pages/enquiry-page'), 'EnquiryPage')
const CustomerDashboardPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-dashboard-page'),
  'CustomerDashboardPage',
)
const CustomerOrdersPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-orders-page'),
  'CustomerOrdersPage',
)
const CustomerOrderTrackingPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-order-tracking-page'),
  'CustomerOrderTrackingPage',
)
const CustomerProfilePage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-profile-page'),
  'CustomerProfilePage',
)
const CustomerWishlistPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-wishlist-page'),
  'CustomerWishlistPage',
)
const CustomerCartPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-cart-page'),
  'CustomerCartPage',
)
const CustomerNotificationsPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-notifications-page'),
  'CustomerNotificationsPage',
)
const CustomerSupportPage = lazyPage(
  () => import('@/features/customer-portal/pages/customer-support-page'),
  'CustomerSupportPage',
)
const DashboardPage = lazyPage(() => import('@/features/dashboard/pages/dashboard-page'), 'DashboardPage')
const CoreWorkspacePage = lazyPage(
  () => import('@/features/core/pages/core-workspace-page'),
  'CoreWorkspacePage',
)
const CoreSettingsPage = lazyPage(
  () => import('@/features/core/pages/core-settings-page'),
  'CoreSettingsPage',
)
const BillingWorkspacePage = lazyPage(
  () => import('@/features/framework/pages/billing-workspace-page'),
  'BillingWorkspacePage',
)
const BillingLedgerListPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingLedgerListPage',
)
const BillingLedgerGroupPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingLedgerGroupPage',
)
const BillingVoucherGroupPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingVoucherGroupPage',
)
const BillingVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingVoucherPage',
)
const BillingGstCenterPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingGstCenterPage',
)
const BillingSalesInvoicePage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingSalesInvoicePage',
)
const BillingPurchaseVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingPurchaseVoucherPage',
)
const BillingReceiptVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingReceiptVoucherPage',
)
const BillingPaymentVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingPaymentVoucherPage',
)
const BillingJournalVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingJournalVoucherPage',
)
const BillingContraVoucherPage = lazyPage(
  () => import('@billing-web/features/billing/pages/billing-pages'),
  'BillingContraVoucherPage',
)
const McpWorkspacePage = lazyPage(
  () => import('@mcp-web/shell/mcp-shell'),
  'McpShellRoot',
)
const CrmWorkspacePage = lazyPage(
  () => import('@/features/framework/pages/crm-workspace-page'),
  'CrmWorkspacePage',
)
const FrappeWorkspacePage = lazyPage(
  () => import('@/features/framework/pages/frappe-workspace-page'),
  'FrappeWorkspacePage',
)
const SiteWorkspacePage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteWorkspacePage',
)
const SiteProjectsPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteProjectsPage',
)
const SiteTemplatesPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteTemplatesPage',
)
const SiteTeamPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteTeamPage',
)
const SiteBioPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteBioPage',
)
const SiteEnquiriesPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteEnquiriesPage',
)
const SiteServicesSnapshotPage = lazyPage(
  () => import('@/features/site/pages/site-workspace-pages'),
  'SiteServicesSnapshotPage',
)
const EcommerceWorkspacePage = lazyPage(
  () => import('@/features/ecommerce/pages/ecommerce-workspace-page'),
  'EcommerceWorkspacePage',
)
const OrderOperationsPage = lazyPage(
  () => import('@/features/commerce/pages/order-operations-page'),
  'OrderOperationsPage',
)
const OrderShowPage = lazyPage(
  () => import('@/features/commerce/pages/order-show-page'),
  'OrderShowPage',
)
const CustomerHelpdeskPage = lazyPage(
  () => import('@/features/commerce/pages/customer-helpdesk-page'),
  'CustomerHelpdeskPage',
)
const CustomerHelpdeskShowPage = lazyPage(
  () => import('@/features/commerce/pages/customer-helpdesk-show-page'),
  'CustomerHelpdeskShowPage',
)
const CommonModulePage = lazyPage(
  () => import('@/features/common-modules/pages/common-module-page'),
  'CommonModulePage',
)
const CommonModulesHomePage = lazyPage(
  () => import('@/features/common-modules/pages/common-modules-home-page'),
  'CommonModulesHomePage',
)
const CompanyFormPage = lazyPage(() => import('@/features/company/pages/company-form-page'), 'CompanyFormPage')
const CompanyListPage = lazyPage(() => import('@/features/company/pages/company-list-page'), 'CompanyListPage')
const CompanyShowPage = lazyPage(() => import('@/features/company/pages/company-show-page'), 'CompanyShowPage')
const ContactFormPage = lazyPage(() => import('@/features/contact/pages/contact-form-page'), 'ContactFormPage')
const ContactListPage = lazyPage(() => import('@/features/contact/pages/contact-list-page'), 'ContactListPage')
const ContactShowPage = lazyPage(() => import('@/features/contact/pages/contact-show-page'), 'ContactShowPage')
const MediaFormPage = lazyPage(() => import('@/features/media/pages/media-form-page'), 'MediaFormPage')
const MediaListPage = lazyPage(() => import('@/features/media/pages/media-list-page'), 'MediaListPage')
const ProductFormPage = lazyPage(() => import('@/features/product/pages/product-form-page'), 'ProductFormPage')
const ProductListPage = lazyPage(() => import('@/features/product/pages/product-list-page'), 'ProductListPage')
const ProductShowPage = lazyPage(() => import('@/features/product/pages/product-show-page'), 'ProductShowPage')
const ProductCategoryFormPage = lazyPage(() => import('@/features/product-categories/pages/product-category-form-page'), 'ProductCategoryFormPage')
const ProductCategoryListPage = lazyPage(() => import('@/features/product-categories/pages/product-category-list-page'), 'ProductCategoryListPage')
const ProductCategoryShowPage = lazyPage(() => import('@/features/product-categories/pages/product-category-show-page'), 'ProductCategoryShowPage')
const MailboxComposePage = lazyPage(() => import('@/features/mailbox/pages/mailbox-compose-page'), 'MailboxComposePage')
const MailboxMessageListPage = lazyPage(
  () => import('@/features/mailbox/pages/mailbox-message-list-page'),
  'MailboxMessageListPage',
)
const MailboxMessageShowPage = lazyPage(
  () => import('@/features/mailbox/pages/mailbox-message-show-page'),
  'MailboxMessageShowPage',
)
const MailboxTemplateFormPage = lazyPage(
  () => import('@/features/mailbox/pages/mailbox-template-form-page'),
  'MailboxTemplateFormPage',
)
const MailboxTemplateListPage = lazyPage(
  () => import('@/features/mailbox/pages/mailbox-template-list-page'),
  'MailboxTemplateListPage',
)
const StorefrontTemplateFormPage = lazyPage(
  () => import('@/features/storefront-designer/pages/storefront-template-form-page'),
  'StorefrontTemplateFormPage',
)
const StorefrontTemplateListPage = lazyPage(
  () => import('@/features/storefront-designer/pages/storefront-template-list-page'),
  'StorefrontTemplateListPage',
)
const StorefrontTemplateShowPage = lazyPage(
  () => import('@/features/storefront-designer/pages/storefront-template-show-page'),
  'StorefrontTemplateShowPage',
)
const SliderThemeFormPage = lazyPage(
  () => import('@/features/slider-themes/pages/slider-theme-form-page'),
  'SliderThemeFormPage',
)
const SliderThemeListPage = lazyPage(
  () => import('@/features/slider-themes/pages/slider-theme-list-page'),
  'SliderThemeListPage',
)
const SliderThemeShowPage = lazyPage(
  () => import('@/features/slider-themes/pages/slider-theme-show-page'),
  'SliderThemeShowPage',
)
const LoginPage = lazyPage(() => import('@framework-core/web/auth/pages/login-page'), 'LoginPage')
const RecoveryLoginPage = lazyPage(() => import('@framework-core/web/auth/pages/recovery-login-page'), 'RecoveryLoginPage')
const ForgotPasswordPage = lazyPage(() => import('@framework-core/web/auth/pages/forgot-password-page'), 'ForgotPasswordPage')
const InitialSetupPage = lazyPage(() => import('@/features/setup/pages/initial-setup-page'), 'InitialSetupPage')
const PortfolioHomePage = lazyPage(
  () => import('@/features/marketing/pages/portfolio-home-page'),
  'PortfolioHomePage',
)
const ProjectsPage = lazyPage(() => import('@/features/marketing/pages/projects-page'), 'ProjectsPage')
const RegisterPage = lazyPage(() => import('@framework-core/web/auth/pages/register-page'), 'RegisterPage')
const ServicesPage = lazyPage(() => import('@/features/marketing/pages/services-page'), 'ServicesPage')
const TeamPage = lazyPage(() => import('@/features/marketing/pages/team-page'), 'TeamPage')
const TemplatesPage = lazyPage(() => import('@/features/marketing/pages/templates-page'), 'TemplatesPage')
const StoreCartPage = lazyPage(() => import('@/features/store/pages/store-cart-page'), 'StoreCartPage')
const StoreCatalogPage = lazyPage(() => import('@/features/store/pages/store-catalog-page'), 'StoreCatalogPage')
const StoreCheckoutPage = lazyPage(() => import('@/features/store/pages/store-checkout-page'), 'StoreCheckoutPage')
const StoreHomePage = lazyPage(() => import('@/features/store/pages/store-home-page'), 'StoreHomePage')
const StoreProductPage = lazyPage(() => import('@/features/store/pages/store-product-page'), 'StoreProductPage')
const StoreWishlistPage = lazyPage(() => import('@/features/store/pages/store-wishlist-page'), 'StoreWishlistPage')
const FrappeConnectionPage = lazyPage(() => import('@/features/frappe/pages/frappe-connection-page'), 'FrappeConnectionPage')
const FrappeItemPage = lazyPage(() => import('@/features/frappe/pages/frappe-item-page'), 'FrappeItemPage')
const FrappePurchaseReceiptPage = lazyPage(() => import('@/features/frappe/pages/frappe-purchase-receipt-page'), 'FrappePurchaseReceiptPage')
const FrappePurchaseReceiptShowPage = lazyPage(() => import('@/features/frappe/pages/frappe-purchase-receipt-show-page'), 'FrappePurchaseReceiptShowPage')
const FrappeTodoPage = lazyPage(() => import('@/features/frappe/pages/frappe-todo-page'), 'FrappeTodoPage')
const TaskAppWorkspacePage = lazyPage(
  () => import('../../../../task/web/src/pages/task-app-workspace-page.tsx'),
  'TaskAppWorkspacePage',
)
const SystemEnvironmentPage = lazyPage(() => import('@/features/settings/pages/system-environment-page'), 'SystemEnvironmentPage')
const DatabaseManagerPage = lazyPage(() => import('@/features/settings/pages/database-manager-page'), 'DatabaseManagerPage')
const SystemSettingsPage = lazyPage(() => import('@/features/settings/pages/system-settings-page'), 'SystemSettingsPage')
const SystemVersionPage = lazyPage(() => import('@/features/settings/pages/system-version-page'), 'SystemVersionPage')
const EcommerceSettingsPage = lazyPage(() => import('@/features/settings/pages/ecommerce-settings-page'), 'EcommerceSettingsPage')
const UserFormPage = lazyPage(() => import('@/features/users/pages/user-form-page'), 'UserFormPage')
const UserListPage = lazyPage(() => import('@/features/users/pages/user-list-page'), 'UserListPage')
const TaskWorkspacePage = lazyPage(
  () => import('../../../../task/web/src/pages/task-workspace-page.tsx'),
  'TaskWorkspacePage',
)
const TaskGroupListPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-group-list-page.tsx'),
  'TaskGroupListPage',
)
const TaskMilestoneListPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-milestone-list-page.tsx'),
  'TaskMilestoneListPage',
)
const TaskMilestoneDetailPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-milestone-detail-page.tsx'),
  'TaskMilestoneDetailPage',
)
const TaskFormPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-form-page.tsx'),
  'TaskFormPage',
)
const TaskDetailPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-detail-page.tsx'),
  'TaskDetailPage',
)
const TaskTemplateListPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-template-list-page.tsx'),
  'TaskTemplateListPage',
)
const TaskTemplateFormPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-template-form-page.tsx'),
  'TaskTemplateFormPage',
)
const TaskBulkCreatePage = lazyPage(
  () => import('../../../../task/web/src/pages/task-bulk-create-page.tsx'),
  'TaskBulkCreatePage',
)
const TaskInsightsPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-insights-page.tsx'),
  'TaskInsightsPage',
)
const TaskAuditPage = lazyPage(
  () => import('../../../../task/web/src/pages/task-audit-page.tsx'),
  'TaskAuditPage',
)

function LegacyAdminDashboardRedirect() {
  const location = useLocation()
  const { session } = useAuth()

  if (!session) {
    rememberRequestedPath(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (session.user.actorType === 'customer') {
    return <Navigate to={customerPortalRoot} replace />
  }

  const nextPath = location.pathname.replace(/^\/dashboard/, '') || ''
  return <Navigate to={`${buildAdminPortalPath(nextPath)}${location.search}${location.hash}`} replace />
}

function LegacyTaskEditRedirect() {
  const location = useLocation()
  const nextPath = location.pathname.replace('/admin/dashboard/tasks/', '/admin/dashboard/task/tasks/')
  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
}

function LegacyTaskDetailRedirect() {
  const location = useLocation()
  const nextPath = location.pathname.replace('/admin/dashboard/tasks/', '/admin/dashboard/task/tasks/')
  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
}

const adminRoutes = {
  element: <RequireAuth allow={['admin', 'staff', 'vendor']} />,
  children: [
    {
      path: 'admin/dashboard',
      element: renderLazy(AppLayout),
      children: [
        { index: true, element: renderLazy(DashboardPage) },
        { path: 'core', element: renderLazy(CoreWorkspacePage) },
        { path: 'core/settings', element: renderLazy(CoreSettingsPage) },
        { path: 'ecommerce', element: renderLazy(EcommerceWorkspacePage) },
        { path: 'billing', element: renderLazy(BillingWorkspacePage) },
        { path: 'billing/ledgers', element: renderLazy(BillingLedgerListPage) },
        { path: 'billing/ledger-groups', element: renderLazy(BillingLedgerGroupPage) },
        { path: 'billing/voucher-groups', element: renderLazy(BillingVoucherGroupPage) },
        { path: 'billing/vouchers', element: renderLazy(BillingVoucherPage) },
        { path: 'billing/invoices', element: renderLazy(BillingSalesInvoicePage) },
        { path: 'billing/purchases', element: renderLazy(BillingPurchaseVoucherPage) },
        { path: 'billing/receipts', element: renderLazy(BillingReceiptVoucherPage) },
        { path: 'billing/payments', element: renderLazy(BillingPaymentVoucherPage) },
        { path: 'billing/journals', element: renderLazy(BillingJournalVoucherPage) },
        { path: 'billing/contra', element: renderLazy(BillingContraVoucherPage) },
        { path: 'billing/gst', element: renderLazy(BillingGstCenterPage) },
        { path: 'crm', element: renderLazy(CrmWorkspacePage) },
        { path: 'mcp', element: renderLazy(McpWorkspacePage) },
        { path: 'frappe', element: renderLazy(FrappeWorkspacePage) },
        { path: 'frappe/connection', element: renderLazy(FrappeConnectionPage) },
        { path: 'frappe/items', element: renderLazy(FrappeItemPage) },
        { path: 'frappe/purchase-receipts', element: renderLazy(FrappePurchaseReceiptPage) },
        { path: 'frappe/purchase-receipts/:receiptId', element: renderLazy(FrappePurchaseReceiptShowPage) },
        { path: 'frappe/todos', element: renderLazy(FrappeTodoPage) },
        { path: 'task', element: renderLazy(TaskAppWorkspacePage) },
        { path: 'ui', element: renderLazy(UiDocsDesktopPage) },
        { path: 'ui/button', element: renderLazy(UiDocsButtonPage) },
        { path: 'ui/badge', element: renderLazy(UiDocsBadgePage) },
        { path: 'ui/card', element: renderLazy(UiDocsCardPage) },
        { path: 'ui/input', element: renderLazy(UiDocsInputPage) },
        { path: 'task/tasks', element: renderLazy(TaskWorkspacePage) },
        { path: 'task/groups', element: renderLazy(TaskGroupListPage) },
        { path: 'task/milestones', element: renderLazy(TaskMilestoneListPage) },
        { path: 'task/milestones/:milestoneId', element: renderLazy(TaskMilestoneDetailPage) },
        { path: 'task/tasks/new', element: renderLazy(TaskFormPage) },
        { path: 'task/tasks/:taskId', element: renderLazy(TaskDetailPage) },
        { path: 'task/tasks/:taskId/edit', element: renderLazy(TaskFormPage) },
        { path: 'task/templates', element: renderLazy(TaskTemplateListPage) },
        { path: 'task/templates/new', element: renderLazy(TaskTemplateFormPage) },
        { path: 'task/templates/:templateId/edit', element: renderLazy(TaskTemplateFormPage) },
        { path: 'task/bulk', element: renderLazy(TaskBulkCreatePage) },
        { path: 'task/insights', element: renderLazy(TaskInsightsPage) },
        { path: 'task/audit', element: renderLazy(TaskAuditPage) },
        { path: 'site', element: renderLazy(SiteWorkspacePage) },
        { path: 'site/services', element: renderLazy(SiteServicesSnapshotPage) },
        { path: 'site/projects', element: renderLazy(SiteProjectsPage) },
        { path: 'site/templates', element: renderLazy(SiteTemplatesPage) },
        { path: 'site/team', element: renderLazy(SiteTeamPage) },
        { path: 'site/bio', element: renderLazy(SiteBioPage) },
        { path: 'site/enquiries', element: renderLazy(SiteEnquiriesPage) },
        { path: 'orders', element: renderLazy(OrderOperationsPage) },
        { path: 'orders/:orderId', element: renderLazy(OrderShowPage) },
        { path: 'customers', element: renderLazy(CustomerHelpdeskPage) },
        { path: 'customers/:customerId', element: renderLazy(CustomerHelpdeskShowPage) },
        { path: 'companies', element: renderLazy(CompanyListPage) },
        { path: 'companies/new', element: renderLazy(CompanyFormPage) },
        { path: 'companies/:companyId', element: renderLazy(CompanyShowPage) },
        { path: 'companies/:companyId/edit', element: renderLazy(CompanyFormPage) },
        { path: 'contacts', element: renderLazy(ContactListPage) },
        { path: 'contacts/new', element: renderLazy(ContactFormPage) },
        { path: 'contacts/:contactId', element: renderLazy(ContactShowPage) },
        { path: 'contacts/:contactId/edit', element: renderLazy(ContactFormPage) },
        { path: 'media', element: renderLazy(MediaListPage) },
        { path: 'media/new', element: renderLazy(MediaFormPage) },
        { path: 'media/:mediaId/edit', element: renderLazy(MediaFormPage) },
        { path: 'products', element: renderLazy(ProductListPage) },
        { path: 'products/new', element: renderLazy(ProductFormPage) },
        { path: 'products/:productId', element: renderLazy(ProductShowPage) },
        { path: 'products/:productId/edit', element: renderLazy(ProductFormPage) },
        { path: 'product-categories', element: renderLazy(ProductCategoryListPage) },
        { path: 'product-categories/new', element: renderLazy(ProductCategoryFormPage) },
        { path: 'product-categories/:categoryId', element: renderLazy(ProductCategoryShowPage) },
        { path: 'product-categories/:categoryId/edit', element: renderLazy(ProductCategoryFormPage) },
        { path: 'mailbox/messages', element: renderLazy(MailboxMessageListPage) },
        { path: 'mailbox/messages/:messageId', element: renderLazy(MailboxMessageShowPage) },
        { path: 'mailbox/compose', element: renderLazy(MailboxComposePage) },
        { path: 'mailbox/templates', element: renderLazy(MailboxTemplateListPage) },
        { path: 'mailbox/templates/new', element: renderLazy(MailboxTemplateFormPage) },
        { path: 'mailbox/templates/:templateId/edit', element: renderLazy(MailboxTemplateFormPage) },
        { path: 'users', element: renderLazy(UserListPage) },
        { path: 'users/new', element: renderLazy(UserFormPage) },
        { path: 'users/:userId/edit', element: renderLazy(UserFormPage) },
        { path: 'storefront-designer', element: renderLazy(StorefrontTemplateListPage) },
        { path: 'storefront-designer/new', element: renderLazy(StorefrontTemplateFormPage) },
        { path: 'storefront-designer/:templateId', element: renderLazy(StorefrontTemplateShowPage) },
        { path: 'storefront-designer/:templateId/edit', element: renderLazy(StorefrontTemplateFormPage) },
        { path: 'slider-themes', element: renderLazy(SliderThemeListPage) },
        { path: 'slider-themes/new', element: renderLazy(SliderThemeFormPage) },
        { path: 'slider-themes/:themeId', element: renderLazy(SliderThemeShowPage) },
        { path: 'slider-themes/:themeId/edit', element: renderLazy(SliderThemeFormPage) },
        { path: 'ecommerce/settings', element: renderLazy(EcommerceSettingsPage) },
        { path: 'system-update', element: renderLazy(SystemVersionPage) },
        { path: 'version', element: renderLazy(SystemVersionPage) },
        {
          element: <RequireSuperAdmin />,
          children: [
            { path: 'migration-manager', element: renderLazy(DatabaseManagerPage) },
            { path: 'environment', element: renderLazy(SystemEnvironmentPage) },
            { path: 'settings', element: renderLazy(SystemSettingsPage) },
          ],
        },
        { path: 'common', element: renderLazy(CommonModulesHomePage) },
        { path: 'common/:moduleKey', element: renderLazy(CommonModulePage) },
        { path: 'tasks', element: <Navigate to="/admin/dashboard/task/tasks" replace /> },
        { path: 'tasks/new', element: <Navigate to="/admin/dashboard/task/tasks/new" replace /> },
        { path: 'tasks/:taskId', element: <LegacyTaskDetailRedirect /> },
        { path: 'tasks/:taskId/edit', element: <LegacyTaskEditRedirect /> },
        { path: '*', element: renderLazy(DashboardPage) },
      ],
    },
  ],
}

const customerPortalRoutes = {
  element: <RequireAuth allow={['customer']} />,
  children: [
    {
      path: 'dashboard',
      element: renderLazy(CustomerPortalLayout),
      children: [
        { index: true, element: renderLazy(CustomerDashboardPage) },
        {
          path: 'orders',
          element: renderLazy(CustomerOrdersPage),
        },
        {
          path: 'orders/:orderId/track',
          element: renderLazy(CustomerOrderTrackingPage),
        },
        {
          path: 'profile',
          element: renderLazy(CustomerProfilePage),
        },
        {
          path: 'wishlist',
          element: renderLazy(CustomerWishlistPage),
        },
        {
          path: 'cart',
          element: renderLazy(CustomerCartPage),
        },
        {
          path: 'notifications',
          element: renderLazy(CustomerNotificationsPage),
        },
        {
          path: 'support',
          element: renderLazy(CustomerSupportPage),
        },
      ],
    },
  ],
}

const legacyAdminRoutes = {
  element: <RequireAuth allow={['admin', 'staff', 'vendor', 'customer']} />,
  children: [
    {
      path: 'dashboard/*',
      element: <LegacyAdminDashboardRedirect />,
    },
  ],
}

const authRoutes = {
  element: renderLazy(AuthLayout),
  children: [
    { path: 'login', element: renderLazy(LoginPage) },
    { path: 'recovery', element: renderLazy(RecoveryLoginPage) },
    { path: 'forgot-password', element: renderLazy(ForgotPasswordPage) },
    { path: 'register', element: renderLazy(RegisterPage) },
  ],
}

const webRoutes = [
  {
    path: 'setup',
    element: renderLazy(InitialSetupPage),
  },
  {
    element: renderLazy(WebLayout),
    children: [
      { index: true, element: renderLazy(PortfolioHomePage) },
      { path: 'about', element: renderLazy(AboutPage) },
      { path: 'bio', element: renderLazy(BioPage) },
      { path: 'services', element: renderLazy(ServicesPage) },
      { path: 'projects', element: renderLazy(ProjectsPage) },
      { path: 'templates', element: renderLazy(TemplatesPage) },
      { path: 'team', element: renderLazy(TeamPage) },
      { path: 'enquiry', element: renderLazy(EnquiryPage) },
      { path: 'contact', element: renderLazy(ContactPage) },
    ],
  },
  customerPortalRoutes,
  adminRoutes,
  legacyAdminRoutes,
  authRoutes,
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

const shopRoutes = [
  {
    path: 'setup',
    element: renderLazy(InitialSetupPage),
  },
  {
    element: renderLazy(ShopLayout),
    children: [
      { index: true, element: renderLazy(StoreHomePage) },
      { path: 'about', element: renderLazy(AboutPage) },
      { path: 'contact', element: renderLazy(ContactPage) },
      { path: 'search', element: renderLazy(StoreCatalogPage) },
      { path: 'wishlist', element: renderLazy(StoreWishlistPage) },
      { path: 'cart', element: renderLazy(StoreCartPage) },
      {
        element: <RequireAuth allow={['customer']} />,
        children: [
          { path: 'checkout', element: renderLazy(StoreCheckoutPage) },
          { path: 'account', element: <Navigate to={buildCustomerPortalPath()} replace /> },
          { path: 'account/profile', element: <Navigate to={buildCustomerPortalPath('/profile')} replace /> },
          { path: 'account/orders', element: <Navigate to={buildCustomerPortalPath('/orders')} replace /> },
          { path: 'account/notifications', element: <Navigate to={buildCustomerPortalPath('/notifications')} replace /> },
        ],
      },
      { path: 'product/:slug', element: renderLazy(StoreProductPage) },
      { path: 'category/:slug', element: renderLazy(StoreCatalogPage) },
    ],
  },
  customerPortalRoutes,
  adminRoutes,
  legacyAdminRoutes,
  authRoutes,
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

const appRoutes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/setup',
    element: renderLazy(InitialSetupPage),
  },
  customerPortalRoutes,
  adminRoutes,
  legacyAdminRoutes,
  authRoutes,
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]

const recoveryRoutes = [
  {
    path: '/',
    element: <Navigate to="/setup" replace />,
  },
  {
    path: '/setup',
    element: renderLazy(InitialSetupPage),
  },
  {
    element: renderLazy(AuthLayout),
    children: [
      { path: '/login', element: renderLazy(LoginPage) },
      { path: '/recovery', element: renderLazy(RecoveryLoginPage) },
    ],
  },
  {
    element: <RequireAuth allow={['admin', 'staff', 'vendor']} />,
    children: [
      {
        path: '/admin/dashboard',
        element: <Navigate to="/admin/dashboard/migration-manager" replace />,
      },
      {
        path: '/admin/dashboard/migration-manager',
        element: renderLazy(DatabaseManagerPage),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/setup" replace />,
  },
]

export function AppRouter() {
  const { status } = useSetup()
  const shouldUseRecoveryRoutes = frontendTarget === 'app' && status?.status !== 'ready'
  const router = useMemo(() => createBrowserRouter(
    shouldUseRecoveryRoutes
      ? recoveryRoutes
      : (frontendTarget === 'app' ? appRoutes : frontendTarget === 'shop' ? shopRoutes : webRoutes),
  ), [shouldUseRecoveryRoutes])

  return <RouterProvider router={router} />
}
