import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { MainLayout, type MainLayoutNavigationItem } from "../main-layouts";

export type MdiNavigationItem = {
  active?: boolean;
  children?: MdiNavigationItem[];
  href?: string;
  icon?: LucideIcon;
  label: string;
  onSelect?: () => void;
};

export type MdiNavigationSection = {
  defaultOpen?: boolean;
  icon?: LucideIcon;
  items: MdiNavigationItem[];
  label?: string;
};

export type MainWorkspaceProps = {
  applicationIcon?: LucideIcon;
  applicationId?: string;
  applicationName?: string;
  children?: ReactNode;
  navigation?: MdiNavigationSection[];
  primaryAction?: { label: string; onSelect?: () => void } | null;
  searchPlaceholder?: string;
  sidebarContentClassName?: string;
  sidebarStateKey?: string;
  statusLabel?: string;
  user?: { email?: string; initials: string; name: string; onSignOut?: () => void };
  workspaceTitle?: string;
};

function toNavigationItem(item: MdiNavigationItem): MainLayoutNavigationItem {
  return {
    label: item.label,
    ...(item.icon ? { icon: item.icon } : {}),
    onSelect: () => {
      item.onSelect?.();
      if (item.href) window.location.assign(item.href);
    }
  };
}

/** Compatibility entry for copied desk blocks using the current main layout. */
export function MainWorkspace({
  applicationIcon,
  applicationId = "workspace",
  applicationName = "Workspace",
  children,
  navigation = [],
  searchPlaceholder,
  statusLabel = "Ready",
  user,
  workspaceTitle = "Overview"
}: MainWorkspaceProps) {
  return (
    <MainLayout
      appItems={applicationIcon ? [{ title: applicationName, description: applicationName, icon: applicationIcon, active: true }] : []}
      applicationName={applicationName}
      className="h-screen w-full"
      homeHref={`/${applicationId}`}
      navigation={navigation.map((section) => ({
        label: section.label ?? "Navigation",
        ...(section.icon ? { icon: section.icon } : {}),
        items: section.items.flatMap((item) => [toNavigationItem(item), ...(item.children ?? []).map(toNavigationItem)])
      }))}
      {...(user?.onSignOut ? { onLogout: user.onSignOut } : {})}
      {...(searchPlaceholder ? { searchPlaceholder } : {})}
      statusLabel={statusLabel}
      user={{ name: user?.name ?? applicationName, email: user?.email ?? "", fallback: user?.initials ?? applicationName.slice(0, 2) }}
      workspaceTitle={workspaceTitle}
    >
      {children}
    </MainLayout>
  );
}

export function useMdiTopology() {
  return undefined;
}
