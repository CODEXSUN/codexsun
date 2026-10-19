"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Trophy,
  Users
} from "lucide-react";
import { SportsclubOverviewWorkspace } from "./modules/overview/overview.workspace";
import { MemberWorkspace } from "./modules/member/member.workspace";
import { MasterWorkspace } from "./modules/master/master.workspace";
import { ProgramWorkspace } from "./modules/program/program.workspace";
import { SessionWorkspace } from "./modules/session/session.workspace";
import { AttendanceWorkspace } from "./modules/attendance/attendance.workspace";
import { ProgressWorkspace } from "./modules/progress/progress.workspace";
import { EventWorkspace } from "./modules/event/event.workspace";
import { EnquiryWorkspace } from "./modules/enquiry/enquiry.workspace";
import type { SportsclubGateway, SportsclubWorkspaceTab } from "./sportsclub-contract";

export type SportsclubWorkspaceProps = {
  gateway?: SportsclubGateway;
  initialTab?: SportsclubWorkspaceTab;
  activeTab?: SportsclubWorkspaceTab;
  onTabChange?: (tab: SportsclubWorkspaceTab) => void;
  userRole?: "admin" | "master" | "student";
  currentUserName?: string;
};

const TABS: Array<{
  id: SportsclubWorkspaceTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Students", icon: Users },
  { id: "masters", label: "Masters / ஆசான்கள்", icon: GraduationCap },
  { id: "programs", label: "Curriculum", icon: BookOpen },
  { id: "sessions", label: "Batches", icon: Calendar },
  { id: "attendance", label: "Attendance", icon: CheckSquare },
  { id: "progress", label: "Assessments", icon: Award },
  { id: "events", label: "Events", icon: Trophy },
  { id: "enquiries", label: "Admissions", icon: MessageSquare }
];

export function SportsclubWorkspace({
  gateway: _gateway,
  initialTab = "overview",
  activeTab: controlledTab,
  onTabChange,
  userRole = "admin",
  currentUserName = "Club Administrator"
}: SportsclubWorkspaceProps) {
  const [internalTab, setInternalTab] = useState<SportsclubWorkspaceTab>(initialTab);

  const currentTab = controlledTab ?? internalTab;

  const handleSelectTab = (tab: SportsclubWorkspaceTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation bar for full multi-leaf Sportsclub access */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/80 bg-card p-1.5 shadow-xs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-600 dark:text-white"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render active module workspace */}
      <div>
        {currentTab === "overview" ? (
          <SportsclubOverviewWorkspace
            onOpenWorkspace={handleSelectTab}
            userRole={userRole}
            currentUserName={currentUserName}
          />
        ) : null}
        {currentTab === "members" ? <MemberWorkspace /> : null}
        {currentTab === "masters" ? <MasterWorkspace /> : null}
        {currentTab === "programs" ? <ProgramWorkspace /> : null}
        {currentTab === "sessions" ? <SessionWorkspace /> : null}
        {currentTab === "attendance" ? <AttendanceWorkspace /> : null}
        {currentTab === "progress" ? <ProgressWorkspace /> : null}
        {currentTab === "events" ? <EventWorkspace /> : null}
        {currentTab === "enquiries" ? <EnquiryWorkspace /> : null}
      </div>
    </div>
  );
}
