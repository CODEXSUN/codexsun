import { lazy, Suspense } from "react";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { AuthGate } from "../../shared/auth/AuthGate";

const TenantAppDesk = lazy(() =>
  import("./AppDesk").then((module) => ({ default: module.AppDesk }))
);

export function TenantAppDeskRoute() {
  return (
    <AuthGate desk="tenant">
      <Suspense fallback={<GlobalLoader message="Loading your workspace…" />}>
        <TenantAppDesk />
      </Suspense>
    </AuthGate>
  );
}
