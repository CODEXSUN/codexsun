import { useState } from "react";
import { Building2, Package, Inbox, MessagesSquare, FileText } from "lucide-react";
import { TconnectBuyerWorkspace, type TconnectBuyerTab } from "@codexsun/tconnect-web";
import { AuthGate } from "../../shared/auth/AuthGate";
import { getSessionIdentity, logout } from "../../shared/api/platform-api";
import { tconnectGateway } from "../../modules/tconnect/tconnect-host";
import { TenantMainLayout } from "./TenantMainLayout";
export function TconnectBuyerDesk() {
  return (
    <AuthGate desk="tenant">
      <BuyerShell />
    </AuthGate>
  );
}
function BuyerShell() {
  const [tab, setTab] = useState<TconnectBuyerTab>("catalog");
  const identity = getSessionIdentity();
  const menu = [
    {
      title: "Quotations",
      icon: FileText,
      isActive: tab === "quotations",
      onSelect: () => setTab("quotations")
    },
    {
      title: "Messages",
      icon: MessagesSquare,
      isActive: tab === "conversations",
      onSelect: () => setTab("conversations")
    },
    {
      title: "Find products",
      icon: Building2,
      isActive: tab === "catalog",
      onSelect: () => setTab("catalog")
    },
    {
      title: "My requirements",
      icon: Package,
      isActive: tab === "requirements",
      onSelect: () => setTab("requirements")
    },
    {
      title: "Sent enquiries",
      icon: Inbox,
      isActive: tab === "enquiries",
      onSelect: () => setTab("enquiries")
    }
  ];
  return (
    <TenantMainLayout
      appItems={[]}
      brand={{ title: "TConnect", subtitle: "Buyer", href: "/app/tconnect/buyer" }}
      headerTitle={
        tab === "quotations"
          ? "Quotations"
          : tab === "conversations"
            ? "Messages"
            : tab === "catalog"
              ? "Find products"
              : tab === "requirements"
                ? "My requirements"
                : tab === "account"
                  ? "Buyer account"
                  : "Sent enquiries"
      }
      homeHref="/app/tconnect/buyer"
      menuItems={menu}
      onLogout={async () => {
        await logout("tenant");
        location.assign("/login?app=tconnect&account=buyer");
      }}
      onOpenSettings={() => setTab("account")}
      settingsActive={tab === "account"}
      user={{
        email: identity?.email ?? "",
        name: identity?.name ?? "Buyer",
        fallback: identity?.name?.slice(0, 2).toUpperCase() ?? "TC"
      }}
      versionLabel="TConnect"
      workspaceName="TConnect"
    >
      <TconnectBuyerWorkspace gateway={tconnectGateway} tab={tab} />
    </TenantMainLayout>
  );
}
