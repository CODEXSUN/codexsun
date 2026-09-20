import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { InterfaceTopologySection } from "../../features/interface-topology";
import type { AgentWorkspaceProps } from "../agent-workspace";

export type MdiFeatures = {
  appSwitcher: boolean;
  ito: boolean;
  notifications: boolean;
  primaryActivityRail: boolean;
  profileMenu: boolean;
  secondaryUtilityRail: boolean;
  statusBar: boolean;
  topMenu: boolean;
};

export type MdiFeatureKey = keyof MdiFeatures;

export type MdiAppItem = {
  active?: boolean;
  href?: string;
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
};

export type MdiNavigationItem = {
  active?: boolean;
  badge?: string | number;
  children?: MdiNavigationItem[];
  defaultOpen?: boolean;
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

export type MdiPrimaryAction = {
  icon?: LucideIcon;
  label: string;
  onSelect?: () => void;
};

export type MdiNotification = {
  description?: string;
  id: string;
  read?: boolean;
  severity?: "info" | "success" | "warning" | "error";
  time?: string;
  title: string;
  onRead?: () => void;
  onSelect?: () => void;
};

export type MdiUser = {
  avatarUrl?: string;
  email?: string;
  initials: string;
  name: string;
  onManageProfile?: () => void;
  onSignOut?: () => void;
};

export type MainWorkspaceProps = {
  agentWorkspace?: Omit<AgentWorkspaceProps, "children" | "showPrimaryRail" | "showSecondaryRail">;
  applicationIcon?: LucideIcon;
  applicationLogoUrl?: string;
  applicationId?: string;
  applicationName?: string;
  applicationHeaderStart?: ReactNode;
  applicationHeaderEnd?: ReactNode;
  applicationHeaderMeta?: ReactNode;
  applicationHeaderBelow?: ReactNode;
  applicationHeaderStatus?: ReactNode;
  applicationHeaderTitle?: ReactNode;
  showApplicationIdentity?: boolean;
  showApplicationHeader?: boolean;
  showWorkspaceTitleInHeader?: boolean;
  apps?: MdiAppItem[];
  children?: ReactNode;
  defaultFeatures?: Partial<MdiFeatures>;
  requiredFeatures?: Partial<MdiFeatures>;
  defaultSidebarOpen?: boolean;
  deskRegionId?: string;
  embedded?: boolean;
  navigation?: MdiNavigationSection[];
  notificationCount?: number;
  notifications?: readonly MdiNotification[];
  primaryAction?: MdiPrimaryAction | null;
  searchPlaceholder?: string;
  searchValue?: string;
  showMdiOverview?: boolean;
  showTopologyTools?: boolean;
  settingsContent?: (props: MdiSettingsContentProps) => ReactNode;
  sidebarContent?: ReactNode;
  sidebarContentClassName?: string;
  sidebarFooter?: ReactNode | null;
  sidebarFooterClassName?: string;
  sidebarStateKey?: string;
  statusLabel?: string;
  statusEnd?: ReactNode;
  topologySections?: readonly InterfaceTopologySection[];
  user?: MdiUser;
  workspaceTitle?: string;
  onSearchChange?: (value: string) => void;
};

export type MdiSettingsContentProps = {
  features: MdiFeatures;
  onBack: () => void;
  onFeatureChange: (feature: MdiFeatureKey, enabled: boolean) => void;
};

export const defaultMdiFeatures: MdiFeatures = {
  appSwitcher: true,
  ito: true,
  notifications: true,
  primaryActivityRail: true,
  profileMenu: true,
  secondaryUtilityRail: true,
  statusBar: true,
  topMenu: true,
};
