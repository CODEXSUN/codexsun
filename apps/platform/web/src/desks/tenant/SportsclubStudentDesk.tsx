import { lazy, useState } from "react";
import { User, Calendar, CheckSquare, Clock, Award } from "lucide-react";
import { AuthGate } from "../../shared/auth/AuthGate";
import { getSessionIdentity, logout } from "../../shared/api/platform-api";
import {
  sportsclubGateway,
  type SportsclubStudentTab
} from "../../modules/sportsclub/sportsclub-host";
import { TenantMainLayout } from "./TenantMainLayout";

const SportsclubStudentWorkspace = lazy(() =>
  import("@codexsun/sportsclub-web").then((module) => ({
    default: module.SportsclubStudentWorkspace
  }))
);

export function SportsclubStudentDesk() {
  return (
    <AuthGate desk="tenant">
      <StudentShell />
    </AuthGate>
  );
}

function StudentShell() {
  const [tab, setTab] = useState<SportsclubStudentTab>("profile");
  const identity = getSessionIdentity();
  const menu = [
    {
      title: "Profile",
      icon: User,
      isActive: tab === "profile",
      onSelect: () => setTab("profile")
    },
    {
      title: "Attendance",
      icon: CheckSquare,
      isActive: tab === "attendance",
      onSelect: () => setTab("attendance")
    },
    {
      title: "Batches & Training",
      icon: Calendar,
      isActive: tab === "batches",
      onSelect: () => setTab("batches")
    },
    {
      title: "Schedule",
      icon: Clock,
      isActive: tab === "schedule",
      onSelect: () => setTab("schedule")
    },
    {
      title: "Fee Status",
      icon: Award,
      isActive: tab === "fees",
      onSelect: () => setTab("fees")
    }
  ];

  return (
    <TenantMainLayout
      appItems={[]}
      brand={{
        title: "Tenkasi Sports",
        subtitle: "Student Portal",
        href: "/app/sportsclub/student"
      }}
      headerTitle={
        tab === "profile"
          ? "Student Profile"
          : tab === "attendance"
            ? "Attendance Record"
            : tab === "batches"
              ? "Batches & Training"
              : tab === "schedule"
                ? "Class Schedule"
                : "Fee Status"
      }
      homeHref="/app/sportsclub/student"
      menuItems={menu}
      onLogout={async () => {
        await logout("tenant");
        location.assign("/login?app=sportsclub");
      }}
      onOpenSettings={() => setTab("profile")}
      settingsActive={tab === "profile"}
      user={{
        email: identity?.email ?? "",
        name: identity?.name ?? "Student",
        fallback: identity?.name?.slice(0, 2).toUpperCase() ?? "TS"
      }}
      versionLabel="Tenkasi Sports"
      workspaceName="Tenkasi Sports"
    >
      <SportsclubStudentWorkspace gateway={sportsclubGateway} tab={tab} />
    </TenantMainLayout>
  );
}
