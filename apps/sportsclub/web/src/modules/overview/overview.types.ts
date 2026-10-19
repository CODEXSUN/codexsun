import type { MemberRecord } from "../member/member.types";
import type { MasterRecord } from "../master/master.types";
import type { SessionRecord } from "../session/session.types";
import type { AttendanceRecord } from "../attendance/attendance.types";
import type { ProgressRecord } from "../progress/progress.types";

export type OverviewSummary = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalMasters: number;
  activeSessions: number;
  upcomingEvents: number;
  todayAttendanceCount: number;
  newEnquiriesCount: number;
};

export type StudentPortalMe = {
  member: MemberRecord;
  assignedMaster?: MasterRecord | null;
  enrolledSessions: SessionRecord[];
  recentAttendance: AttendanceRecord[];
  assessments: ProgressRecord[];
};

export type MasterPortalMe = {
  master: MasterRecord;
  assignedStudents: MemberRecord[];
  sessions: SessionRecord[];
  pendingAssessmentsCount: number;
};

export type SportsclubWorkspaceTab =
  | "overview"
  | "members"
  | "masters"
  | "programs"
  | "sessions"
  | "attendance"
  | "progress"
  | "events"
  | "enquiries";
