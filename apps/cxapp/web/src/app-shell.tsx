import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

import type { AppSuite } from "@framework/application/app-manifest";
import { createFrameworkBrowserContainer } from "@framework/di/browser-container";
import { FRAMEWORK_TOKENS } from "@framework/di/tokens";
import type { AuthUser } from "@cxapp/shared";
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader";
import { RuntimeBrandProvider } from "@/features/branding/runtime-brand-provider";
import { ProjectDefaultsProvider } from "@/design-system/context/project-defaults-provider";
import { Toaster } from "@/components/ui/sonner";
import type { DashboardUser } from "@/features/dashboard/types";
import { StorefrontCartProvider } from "@ecommerce/web/src/cart/storefront-cart";
import { StorefrontRouteMetadata } from "@ecommerce/web/src/components/storefront-route-metadata";
import {
  clearStorefrontPostAuthRedirect,
  consumeStorefrontPostAuthRedirect,
} from "@ecommerce/web/src/lib/storefront-auth-redirect";
import { storefrontPaths } from "@ecommerce/web/src/lib/storefront-routes";

import { useAuth } from "./auth/auth-context";
import { AuthProvider } from "./auth/auth-provider";
import {
  isAdminSurfaceUser,
  isCustomerSurfaceUser,
  isDeskSurfaceUser,
  isWebSurfaceUser,
  resolveAuthenticatedHomePath,
  resolvePostAuthPath,
} from "./auth/auth-surface";
import {
  isAppFrontendSurface,
  isShopFrontendSurface,
} from "./config/frontend-surface";
import { DeskProvider } from "./desk/desk-provider";
import {
  RuntimeAppSettingsProvider,
  useRuntimeAppSettings,
} from "./features/runtime-app-settings/runtime-app-settings-provider";
import { AppQueryProvider } from "./query/query-provider";
import { useAppSessionStore } from "./state/app-session-store";

function lazyNamed<
  TModule extends Record<string, unknown>,
  TKey extends keyof TModule,
>(
  load: () => Promise<TModule>,
  exportName: TKey,
): LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => {
    const module = await load();

    return {
      default: module[exportName] as ComponentType<any>,
    };
  });
}

const SiteHomePage = lazy(() => import("@site/web/src/pages/home"));
const DashboardPage = lazyNamed(
  () => import("@/features/dashboard/pages/dashboard-page"),
  "DashboardPage",
);
const BaseAdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const StorefrontAccountOrderPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-order-page"),
  "StorefrontAccountOrderPage",
);
const StorefrontAccountPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-page"),
  "StorefrontAccountPage",
);
const StorefrontAccountRegisterPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-register-page"),
  "StorefrontAccountRegisterPage",
);
const StorefrontCartPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-cart-page"),
  "StorefrontCartPage",
);
const StorefrontCatalogPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-catalog-page"),
  "StorefrontCatalogPage",
);
const StorefrontCheckoutPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-checkout-page"),
  "StorefrontCheckoutPage",
);
const StorefrontHomePage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-home-page"),
  "StorefrontHomePage",
);
const StorefrontLegalPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-legal-page"),
  "StorefrontLegalPage",
);
const StorefrontProductPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-product-page"),
  "StorefrontProductPage",
);
const StorefrontTrackOrderPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-track-order-page"),
  "StorefrontTrackOrderPage",
);
const BillingVoucherSectionPage = lazyNamed(
  () => import("./pages/billing-voucher-section-page"),
  "BillingVoucherSectionPage",
);
const BillingWorkspacePage = lazyNamed(
  () => import("./pages/billing-workspace-page"),
  "BillingWorkspacePage",
);
const CoreCompanyDetailPage = lazyNamed(
  () => import("./pages/core-company-detail-page"),
  "CoreCompanyDetailPage",
);
const CoreCompanyFormPage = lazyNamed(
  () => import("./pages/core-company-form-page"),
  "CoreCompanyFormPage",
);
const CoreContactDetailPage = lazyNamed(
  () => import("./pages/core-contact-detail-page"),
  "CoreContactDetailPage",
);
const CoreContactFormPage = lazyNamed(
  () => import("./pages/core-contact-form-page"),
  "CoreContactFormPage",
);
const CoreProductDetailPage = lazyNamed(
  () => import("./pages/core-product-detail-page"),
  "CoreProductDetailPage",
);
const CoreProductFormPage = lazyNamed(
  () => import("./pages/core-product-form-page"),
  "CoreProductFormPage",
);
const EcommerceProductDetailPage = lazyNamed(
  () => import("./pages/ecommerce-product-detail-page"),
  "EcommerceProductDetailPage",
);
const EcommerceProductFormPage = lazyNamed(
  () => import("./pages/ecommerce-product-form-page"),
  "EcommerceProductFormPage",
);
const BillingCategoryFormPage = lazyNamed(
  () => import("./pages/billing-category-form-page"),
  "BillingCategoryFormPage",
);
const BillingCreditNoteFormPage = lazyNamed(
  () => import("./pages/billing-credit-note-form-page"),
  "BillingCreditNoteFormPage",
);
const BillingDebitNoteFormPage = lazyNamed(
  () => import("./pages/billing-debit-note-form-page"),
  "BillingDebitNoteFormPage",
);
const BillingLedgerFormPage = lazyNamed(
  () => import("./pages/billing-ledger-form-page"),
  "BillingLedgerFormPage",
);
const BillingPaymentFormPage = lazyNamed(
  () => import("./pages/billing-payment-form-page"),
  "BillingPaymentFormPage",
);
const BillingPurchaseFormPage = lazyNamed(
  () => import("./pages/billing-purchase-form-page"),
  "BillingPurchaseFormPage",
);
const BillingReceiptFormPage = lazyNamed(
  () => import("./pages/billing-receipt-form-page"),
  "BillingReceiptFormPage",
);
const BillingSalesFormPage = lazyNamed(
  () => import("./pages/billing-sales-form-page"),
  "BillingSalesFormPage",
);
const BillingSalesReturnFormPage = lazyNamed(
  () => import("./pages/billing-sales-return-form-page"),
  "BillingSalesReturnFormPage",
);
const BillingPurchaseReturnFormPage = lazyNamed(
  () => import("./pages/billing-purchase-return-form-page"),
  "BillingPurchaseReturnFormPage",
);
const FrameworkAppWorkspacePage = lazyNamed(
  () => import("./pages/framework-app-workspace-page"),
  "FrameworkAppWorkspacePage",
);
const DesignSystemInlineEditableTablePage = lazyNamed(
  () => import("@/design-system/pages/design-system-workbench-page"),
  "DesignSystemInlineEditableTablePage",
);
const FrameworkMediaManagerPage = lazyNamed(
  () => import("./pages/framework-media-manager-page"),
  "FrameworkMediaManagerPage",
);
const FrameworkMailServicePage = lazyNamed(
  () => import("./pages/framework-mail-service-page"),
  "FrameworkMailServicePage",
);
const FrameworkMailTemplatePage = lazyNamed(
  () => import("./pages/framework-mail-template-page"),
  "FrameworkMailTemplatePage",
);
const FrameworkMailTemplateFormPage = lazyNamed(
  () => import("./pages/framework-mail-template-form-page"),
  "FrameworkMailTemplateFormPage",
);
const FrameworkMailComposePage = lazyNamed(
  () => import("./pages/framework-mail-compose-page"),
  "FrameworkMailComposePage",
);
const FrameworkMailMessagePage = lazyNamed(
  () => import("./pages/framework-mail-message-page"),
  "FrameworkMailMessagePage",
);
const FrameworkActivityLogPage = lazyNamed(
  () => import("./pages/framework-activity-log-page"),
  "FrameworkActivityLogPage",
);
const FrameworkAlertsDashboardPage = lazyNamed(
  () => import("./pages/framework-alerts-dashboard-page"),
  "FrameworkAlertsDashboardPage",
);
const FrameworkDataBackupPage = lazyNamed(
  () => import("./pages/framework-data-backup-page"),
  "FrameworkDataBackupPage",
);
const FrameworkRbacPage = lazyNamed(
  () => import("./pages/framework-rbac-page"),
  "FrameworkRbacPage",
);
const FrameworkSecurityReviewPage = lazyNamed(
  () => import("./pages/framework-security-review-page"),
  "FrameworkSecurityReviewPage",
);
const FrameworkPermissionFormPage = lazyNamed(
  () => import("./pages/framework-permission-form-page"),
  "FrameworkPermissionFormPage",
);
const FrameworkRoleFormPage = lazyNamed(
  () => import("./pages/framework-role-form-page"),
  "FrameworkRoleFormPage",
);
const FrameworkSystemUpdatePage = lazyNamed(
  () => import("./pages/framework-system-update-page"),
  "FrameworkSystemUpdatePage",
);
const FrameworkUserDetailPage = lazyNamed(
  () => import("./pages/framework-user-detail-page"),
  "FrameworkUserDetailPage",
);
const FrameworkUserFormPage = lazyNamed(
  () => import("./pages/framework-user-form-page"),
  "FrameworkUserFormPage",
);
const FrameworkUsersPage = lazyNamed(
  () => import("./pages/framework-users-page"),
  "FrameworkUsersPage",
);
const ForgotPasswordPage = lazyNamed(
  () => import("./pages/forgot-password-page"),
  "ForgotPasswordPage",
);
const LoginPage = lazyNamed(() => import("./pages/login-page"), "LoginPage");
const RequestAccessPage = lazyNamed(
  () => import("./pages/request-access-page"),
  "RequestAccessPage",
);
const WebUserDashboardPage = lazyNamed(
  () => import("./pages/web-user-dashboard-page"),
  "WebUserDashboardPage",
);

const container = createFrameworkBrowserContainer();
const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite);
const adminDashboardPath = "/admin/dashboard";
const guestUser: DashboardUser = {
  displayName: "Guest Operator",
  email: "guest@codexsun.local",
  avatarUrl: null,
  actorType: "guest",
  isSuperAdmin: false,
};

function toDashboardUser(user: AuthUser | null | undefined): DashboardUser {
  if (!user) {
    return guestUser;
  }

  return {
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    actorType: user.actorType,
    isSuperAdmin: user.isSuperAdmin,
  };
}

function FrameworkUtilityPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div className="border-border bg-background/90 rounded-3xl border p-6 shadow-sm">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
          Framework
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-7">
          {description}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Core Setup",
            href: "/dashboard/settings/core-setup",
            summary: "Bootstrap and readiness foundations for the shared suite.",
          },
          {
            title: "Core Settings",
            href: "/dashboard/settings/core-settings",
            summary: "Runtime environment settings and operational controls.",
          },
          {
            title: "Activity Log",
            href: "/dashboard/settings/activity-log",
            summary: "Validate framework activity and audit records from the admin shell.",
          },
          {
            title: "Alerts Dashboard",
            href: "/dashboard/settings/alerts-dashboard",
            summary: "Operational alert coverage and monitoring entry point for production flows.",
          },
          {
            title: "Data Backup",
            href: "/dashboard/settings/data-backup",
            summary: "Backup cadence, restore drills, retention, and off-machine backup controls.",
          },
          {
            title: "Security Review",
            href: "/dashboard/settings/security-review",
            summary: "OWASP-aligned checklist, evidence capture, and security review signoff history.",
          },
          {
            title: "Companies",
            href: "/dashboard/settings/companies",
            summary: "Organization records, branding, and company masters.",
          },
          {
            title: "Users",
            href: "/dashboard/settings/users",
            summary: "Framework-authenticated user administration and access review.",
          },
          {
            title: "Permissions",
            href: "/dashboard/settings/permissions",
            summary: "Permission definitions and role mapping controls.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
          >
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
  allow,
  preserveNext = true,
}: {
  children: React.ReactNode;
  allow?: (user: AuthUser) => boolean;
  preserveNext?: boolean;
}) {
  const location = useLocation();
  const auth = useAuth();
  const homePath = useAppSessionStore((state) => state.homePath);

  if (auth.isLoading) {
    return <GlobalLoader size="md" />;
  }

  if (!auth.isAuthenticated) {
    const next = preserveNext
      ? `?next=${encodeURIComponent(location.pathname)}`
      : "";

    return <Navigate to={`/login${next}`} replace />;
  }

  if (auth.user) {
    const isAllowed = allow ? allow(auth.user) : isDeskSurfaceUser(auth.user);

    if (!isAllowed) {
      return (
        <Navigate
          to={homePath || resolveAuthenticatedHomePath(auth.user)}
          replace
        />
      );
    }
  }

  if (!auth.user) {
    return (
      <Navigate
        to={homePath || resolveAuthenticatedHomePath(auth.user)}
        replace
      />
    );
  }

  return children;
}

function LoginRouteMiddleware() {
  const auth = useAuth();
  const location = useLocation();
  const homePath = useAppSessionStore((state) => state.homePath);

  if (auth.isLoading || (auth.isAuthenticated && !auth.user)) {
    return <GlobalLoader size="md" />;
  }

  if (auth.isAuthenticated) {
    const nextPath = new URLSearchParams(location.search).get("next");
    const locationState =
      typeof location.state === "object" && location.state
        ? (location.state as { postAuthPath?: string | null })
        : null;
    const locationPostAuthPath =
      typeof locationState?.postAuthPath === "string"
        ? locationState.postAuthPath
        : null;
    const pendingStorefrontRedirect =
      !nextPath && !locationPostAuthPath && isCustomerSurfaceUser(auth.user)
        ? consumeStorefrontPostAuthRedirect()
        : null;

    if (
      !nextPath &&
      !locationPostAuthPath &&
      !isCustomerSurfaceUser(auth.user)
    ) {
      clearStorefrontPostAuthRedirect();
    }

    return (
      <Navigate
        to={
          resolvePostAuthPath(
            auth.user,
            nextPath ?? locationPostAuthPath ?? pendingStorefrontRedirect,
          ) ||
          homePath ||
          "/dashboard"
        }
        replace
      />
    );
  }

  return <LoginPage />;
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeBrandProvider>
      <RuntimeAppSettingsProvider>
        <ProjectDefaultsProvider>
          <StorefrontCartProvider>
            <AppToastLayer />
            {children}
          </StorefrontCartProvider>
        </ProjectDefaultsProvider>
      </RuntimeAppSettingsProvider>
    </RuntimeBrandProvider>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <DeskProvider
      appSuite={appSuite}
      user={toDashboardUser(auth.user)}
      onLogout={() => {
        void auth.logout();
      }}
    >
      <BaseAdminLayout>{children}</BaseAdminLayout>
    </DeskProvider>
  );
}

function AuthenticatedAppShell() {
  const auth = useAuth();

  return (
    <AppProviders>
      <StorefrontRouteMetadata />
      <Suspense fallback={<GlobalLoader size="md" />}>
        <Routes>
          <Route
            path="/"
            element={
              isShopFrontendSurface ? (
                <StorefrontHomePage />
              ) : isAppFrontendSurface ? (
                <Navigate to="/login" replace />
              ) : (
                <SiteHomePage appSuite={appSuite} />
              )
            }
          />
          {isShopFrontendSurface ? (
            <>
              <Route path="/catalog" element={<StorefrontCatalogPage />} />
              <Route
                path="/products/:slug"
                element={<StorefrontProductPage />}
              />
              <Route path="/cart" element={<StorefrontCartPage />} />
              <Route path="/checkout" element={<StorefrontCheckoutPage />} />
              <Route path="/shipping" element={<StorefrontLegalPage pageId="shipping" />} />
              <Route path="/returns" element={<StorefrontLegalPage pageId="returns" />} />
              <Route path="/privacy" element={<StorefrontLegalPage pageId="privacy" />} />
              <Route path="/terms" element={<StorefrontLegalPage pageId="terms" />} />
              <Route path="/contact" element={<StorefrontLegalPage pageId="contact" />} />
              <Route
                path="/track-order"
                element={<StorefrontTrackOrderPage />}
              />
              <Route
                path="/customer/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/customer/register"
                element={<StorefrontAccountRegisterPage />}
              />
              <Route
                path="/customer"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/:sectionId"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/orders/:orderId"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/profile/register"
                element={
                  <Navigate to={storefrontPaths.accountRegister()} replace />
                }
              />
              <Route
                path="/profile"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/profile/:sectionId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/profile/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/account/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/account/register"
                element={
                  <Navigate to={storefrontPaths.accountRegister()} replace />
                }
              />
              <Route
                path="/account"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/account/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route path="/shop" element={<StorefrontHomePage />} />
              <Route path="/shop/catalog" element={<StorefrontCatalogPage />} />
              <Route
                path="/shop/products/:slug"
                element={<StorefrontProductPage />}
              />
              <Route path="/shop/cart" element={<StorefrontCartPage />} />
              <Route
                path="/shop/checkout"
                element={<StorefrontCheckoutPage />}
              />
              <Route
                path="/shop/shipping"
                element={<StorefrontLegalPage pageId="shipping" />}
              />
              <Route
                path="/shop/returns"
                element={<StorefrontLegalPage pageId="returns" />}
              />
              <Route
                path="/shop/privacy"
                element={<StorefrontLegalPage pageId="privacy" />}
              />
              <Route
                path="/shop/terms"
                element={<StorefrontLegalPage pageId="terms" />}
              />
              <Route
                path="/shop/contact"
                element={<StorefrontLegalPage pageId="contact" />}
              />
              <Route
                path="/shop/track-order"
                element={<StorefrontTrackOrderPage />}
              />
              <Route
                path="/shop/customer/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/shop/customer/register"
                element={<StorefrontAccountRegisterPage />}
              />
              <Route
                path="/shop/customer"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/customer/:sectionId"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/customer/orders/:orderId"
                element={
                  <ProtectedRoute
                    allow={isCustomerSurfaceUser}
                    preserveNext={false}
                  >
                    <StorefrontAccountOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/profile/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/shop/profile/register"
                element={
                  <Navigate to={storefrontPaths.accountRegister()} replace />
                }
              />
              <Route
                path="/shop/profile"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/shop/profile/:sectionId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/shop/profile/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/shop/account/login"
                element={
                  <Navigate to={storefrontPaths.accountLogin()} replace />
                }
              />
              <Route
                path="/shop/account/register"
                element={
                  <Navigate to={storefrontPaths.accountRegister()} replace />
                }
              />
              <Route
                path="/shop/account"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route
                path="/shop/account/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
            </>
          ) : null}
          <Route path="/login" element={<LoginRouteMiddleware />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allow={(user) =>
                  isDeskSurfaceUser(user) || isWebSurfaceUser(user)
                }
              >
                {isWebSurfaceUser(auth.user) ? (
                  <WebUserDashboardPage />
                ) : (
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path={adminDashboardPath}
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <DashboardPage variant="admin" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={<Navigate to={adminDashboardPath} replace />}
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUtilityPage
                    title="Settings"
                    description="Framework-level configuration, audit visibility, and cross-app governance modules are staged here for the shared admin shell."
                  />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/core-setup"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage appId="core" sectionId="setup" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/core-settings"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage
                    appId="core"
                    sectionId="core-settings"
                  />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/activity-log"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkActivityLogPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/alerts-dashboard"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAlertsDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/data-backup"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkDataBackupPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/security-review"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkSecurityReviewPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage
                    appId="core"
                    sectionId="companies"
                  />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/:companyId"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/:companyId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/:userId"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/:userId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRbacPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles/:roleId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="list" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="form" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions/:permissionId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="form" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRbacPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac/:roleId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/setup"
            element={<Navigate to="/dashboard/settings/core-setup" replace />}
          />
          <Route
            path="/dashboard/apps/core/core-settings"
            element={
              <Navigate to="/dashboard/settings/core-settings" replace />
            }
          />
          <Route
            path="/dashboard/mail-service"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailServicePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mail-service/templates"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailTemplatePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mail-service/templates/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailTemplateFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mail-service/templates/:templateId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailTemplateFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mail-service/compose"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailComposePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mail-service/messages/:messageId"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMailMessagePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/media"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMediaManagerPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/system-update"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkSystemUpdatePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="chart-of-accounts" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-register"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-register" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-groups"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-groups" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-types"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-types" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="payment-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPaymentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPaymentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="receipt-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingReceiptFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingReceiptFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="sales-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="purchase-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-return"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="purchase-return" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-return/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseReturnFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-return/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseReturnFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/contra-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="contra-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/journal-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="journal-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-return"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="sales-return" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-return/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesReturnFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-return/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesReturnFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="categories" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCategoryFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories/:categoryId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCategoryFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/credit-note"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="credit-note" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/credit-note/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCreditNoteFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/credit-note/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCreditNoteFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/debit-note"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="debit-note" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/debit-note/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingDebitNoteFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/debit-note/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingDebitNoteFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/stock"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="stock" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/statements"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="statements" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/gst-sales-register"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="gst-sales-register" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/gst-purchase-register"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="gst-purchase-register" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/input-output-tax-summary"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="input-output-tax-summary" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/day-book"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="day-book" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/double-entry"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="double-entry" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingLedgerFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts/:ledgerId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingLedgerFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/bank-book"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="bank-book" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/cash-book"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="cash-book" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/bank-reconciliation"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="bank-reconciliation" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/trial-balance"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="trial-balance" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/profit-and-loss"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="profit-and-loss" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/balance-sheet"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="balance-sheet" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/bill-outstanding"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="bill-outstanding" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/support/ledger-guide"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="support-ledger-guide" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ui/table-12-full"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <DesignSystemInlineEditableTablePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/:appId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkAppWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/:contactId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/:contactId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/:productId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/:productId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ecommerce/products/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ecommerce/products/:productId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ecommerce/products/:productId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/:appId/:sectionId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkAppWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProviders>
  );
}

function AppToastLayer() {
  const { settings } = useRuntimeAppSettings();

  return (
    <Toaster
      position={settings?.uiFeedback.toast.position ?? "top-right"}
      tone={settings?.uiFeedback.toast.tone ?? "soft"}
      closeButton
    />
  );
}

function AppShell() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppQueryProvider>
          <AuthenticatedAppShell />
        </AppQueryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppShell;
