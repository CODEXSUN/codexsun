import { CafeOverview } from "./CafeOverview";
import { OrderKitchenWorkspace } from "../modules/order/order.kitchen-workspace";
import { useEffect, useState, type ReactNode } from "react";
import { Coffee, LayoutGrid, UtensilsCrossed, ShoppingBag, CalendarDays } from "lucide-react";
import { MainLayout } from "@codexsun/ui/layouts/main-layouts";
import { Button } from "@codexsun/ui/components/button";
import { SettingsWorkspace } from "../modules/settings";
import { PosWorkspace } from "../modules/pos";
import { MasterWorkspace } from "./MasterWorkspace";
import { cloudRequest } from "./transport";
import "./web.css";

type Context = {
  email: string;
  tenantId: string;
  tenantName: string;
  userName: string;
  canCreate: boolean;
  canPay: boolean;
  canManageMenu: boolean;
  canKitchen: boolean;
  canManageTables: boolean;
  canManageWaiters: boolean;
};
type SalePage = "pos" | "kot" | "take-away" | "booking";
export function WebApp({
  workspace,
  onWorkspaceChange,
  appearanceSettings
}: {
  appearanceSettings?: ReactNode;
  workspace?: SalePage | "menu" | "settings" | "kitchen" | "overview";
  onWorkspaceChange?: (page: SalePage) => void;
} = {}) {
  const [openBillUuid, setOpenBillUuid] = useState<string | undefined>();
  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState<SalePage | "menu" | "settings" | "kitchen" | "overview">("pos");
  const current = workspace ?? page;
  useEffect(() => {
    if (
      current === "menu" ||
      current === "settings" ||
      current === "kitchen" ||
      current === "overview"
    )
      return;
    const switchPage = (event: KeyboardEvent) => {
      if (event.key !== "F1" || event.repeat || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      const next =
        current === "pos"
          ? "kot"
          : current === "kot"
            ? "take-away"
            : current === "take-away"
              ? "booking"
              : "pos";
      if (onWorkspaceChange) onWorkspaceChange(next);
      else setPage(next);
    };
    window.addEventListener("keydown", switchPage);
    return () => window.removeEventListener("keydown", switchPage);
  }, [current, onWorkspaceChange]);
  useEffect(() => {
    let active = true;
    void cloudRequest<Context>("/api/app/qcafe/context")
      .then((value) => {
        if (active) setContext(value);
      })
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : "Unable to open QCafe.");
      });
    return () => {
      active = false;
    };
  }, []);
  if (!context)
    return (
      <main className="grid min-h-[20rem] place-content-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">QCafe</h1>
        <p role={error ? "alert" : "status"}>{error || "Opening your Platform workspace…"}</p>
        {error && (
          <>
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <a href="/login" target="_top" className="underline">
              Sign in to Platform
            </a>
          </>
        )}
      </main>
    );
  const content = (
    <>
      <div
        className={
          current === "menu" ||
          current === "settings" ||
          current === "kitchen" ||
          current === "overview"
            ? "hidden"
            : ""
        }
      >
        <PosWorkspace
          openBillUuid={openBillUuid}
          active={
            current !== "menu" &&
            current !== "settings" &&
            current !== "kitchen" &&
            current !== "overview"
          }
          serviceMode={
            current === "booking"
              ? "BOOKING"
              : current === "kot"
                ? "KOT"
                : current === "take-away"
                  ? "TAKE AWAY"
                  : "POS"
          }
          canCreate={context.canCreate}
          canPay={context.canPay}
          canKitchen={context.canKitchen}
          canManageTables={context.canManageTables}
          restaurantName={context.tenantName}
        />
      </div>
      {current === "overview" && (
        <CafeOverview
          onOpen={(page) => {
            if (onWorkspaceChange) onWorkspaceChange(page);
            else setPage(page);
          }}
        />
      )}
      {current === "kitchen" && (
        <OrderKitchenWorkspace
          canKitchen={context.canKitchen}
          canDeliver={context.canCreate}
          onBill={(uuid) => {
            setOpenBillUuid(uuid);
            if (onWorkspaceChange) onWorkspaceChange("pos");
            else setPage("pos");
          }}
        />
      )}
      {current === "settings" && (
        <SettingsWorkspace
          appearanceSettings={appearanceSettings}
          canManage={context.canManageMenu}
          canManageWaiters={context.canManageWaiters}
          tenantId={context.tenantId}
          tenantName={context.tenantName}
          email={context.email}
        />
      )}
      {(workspace ?? page) === "menu" && (
        <MasterWorkspace
          canManageMenu={context.canManageMenu}
          canManageTables={context.canManageTables}
        />
      )}
    </>
  );
  if (workspace) return content;
  return (
    <MainLayout
      applicationName="QCafe"
      workspaceTitle={current === "settings" ? "Settings" : "POS"}
      homeHref="/app/application/overview"
      appItems={[
        {
          title: "Platform apps",
          description: "Return to your application launcher",
          icon: Coffee,
          onSelect: () => {
            window.top!.location.href = "/app/application/overview";
          }
        }
      ]}
      navigation={[
        {
          label: "Restaurant",
          items: [
            { label: "POS", icon: LayoutGrid, onSelect: () => setPage("pos") },
            { label: "KOT", icon: UtensilsCrossed, onSelect: () => setPage("kot") },
            { label: "Kitchen", icon: UtensilsCrossed, onSelect: () => setPage("kitchen") },
            {
              label: "Parcel - Take away",
              icon: ShoppingBag,
              onSelect: () => setPage("take-away")
            },
            { label: "Booking", icon: CalendarDays, onSelect: () => setPage("booking") },
            { label: "Master", icon: UtensilsCrossed, onSelect: () => setPage("menu") },
            { label: "Settings", icon: UtensilsCrossed, onSelect: () => setPage("settings") }
          ]
        }
      ]}
      user={{
        name: context.userName,
        email: context.email,
        fallback: context.email.slice(0, 2).toUpperCase()
      }}
      statusLabel={`Online · ${context.tenantName}`}
      onLogout={async () => {
        await cloudRequest("/api/app/auth/logout", { method: "POST", body: "{}" });
        sessionStorage.removeItem("codexsun.auth.slot");
        window.top!.location.href = "/login";
      }}
    >
      {content}
    </MainLayout>
  );
}
