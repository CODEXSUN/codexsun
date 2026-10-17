import { lazy, Suspense, useEffect } from "react";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { AuthGate } from "../../shared/auth/AuthGate";

let deskRequest: ReturnType<typeof importDesk> | undefined;
function importDesk() {
  return import("./AppDesk").then((module) => ({ default: module.AppDesk }));
}
function loadDesk() {
  return (deskRequest ??= importDesk());
}
const TenantAppDesk = lazy(loadDesk);

export function TenantAppDeskRoute() {
  useEffect(() => {
    // Download code alongside session verification. AuthGate still controls rendering.
    void loadDesk().catch(() => undefined);
  }, []);
  return (
    <AuthGate desk="tenant">
      <Suspense fallback={<GlobalLoader message="Loading your workspace…" />}>
        <TenantAppDesk />
      </Suspense>
    </AuthGate>
  );
}
