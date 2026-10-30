import { useState } from "react";
import { Building2, Package, Inbox, MessagesSquare, FileText } from "lucide-react";
import { TconnectMemberWorkspace, type TconnectMemberTab } from "@codexsun/tconnect-web";
import { AuthGate } from "../../shared/auth/AuthGate";
import { getSessionIdentity, logout } from "../../shared/api/platform-api";
import { tconnectGateway } from "../../modules/tconnect/tconnect-host";
import { TenantMainLayout } from "./TenantMainLayout";
export function TconnectMemberDesk() {
  return (
    <AuthGate desk="tenant">
      <MemberShell />
    </AuthGate>
  );
}
function MemberShell() {
  const [tab, setTab] = useState<TconnectMemberTab>("profile");
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
      title: "Company & branding",
      icon: Building2,
      isActive: tab === "profile",
      onSelect: () => setTab("profile")
    },
    {
      title: "Products",
      icon: Package,
      isActive: tab === "products",
      onSelect: () => setTab("products")
    },
    {
      title: "Buyer requirements",
      icon: Package,
      isActive: tab === "opportunities",
      onSelect: () => setTab("opportunities")
    },
    {
      title: "Buyer enquiries",
      icon: Inbox,
      isActive: tab === "enquiries",
      onSelect: () => setTab("enquiries")
    }
  ];
  return (
    <TenantMainLayout
      appItems={[]}
      brand={{ title: "TConnect", subtitle: "Seller / Member", href: "/app/tconnect/member" }}
      headerTitle={
        tab === "quotations"
          ? "Quotations"
          : tab === "conversations"
            ? "Messages"
            : tab === "profile"
              ? "Company & branding"
              : tab === "products"
                ? "Products"
                : tab === "opportunities"
                  ? "Buyer requirements"
                  : "Buyer enquiries"
      }
      homeHref="/app/tconnect/member"
      menuItems={menu}
      onLogout={async () => {
        await logout("tenant");
        location.assign("/login?app=tconnect");
      }}
      onOpenSettings={() => setTab("profile")}
      settingsActive={tab === "profile"}
      user={{
        email: identity?.email ?? "",
        name: identity?.name ?? "Member",
        fallback: identity?.name?.slice(0, 2).toUpperCase() ?? "TC"
      }}
      versionLabel="TConnect"
      workspaceName="TConnect"
    >
      <TconnectMemberWorkspace gateway={tconnectGateway} tab={tab} />
    </TenantMainLayout>
  );
}
