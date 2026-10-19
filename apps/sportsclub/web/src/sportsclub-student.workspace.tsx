"use client";

import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { useStudentPortalMe } from "./modules/overview/overview.hooks";
import type { SportsclubGateway, SportsclubStudentTab } from "./sportsclub-contract";

export function SportsclubStudentWorkspace({
  gateway: _gateway,
  tab = "profile"
}: {
  gateway?: SportsclubGateway;
  tab?: SportsclubStudentTab;
}) {
  const { data, isLoading, error } = useStudentPortalMe(true);

  if (isLoading || error || !data?.member) {
    return (
      <WorkspacePage title="Student Portal / மாணவர் தளம்" technicalName="sportsclub-student">
        <p role={error ? "alert" : "status"} className="p-6 text-sm text-muted-foreground">
          {error?.message ?? (isLoading ? "Loading your student profile…" : "No student profile is available for this account.")}
        </p>
      </WorkspacePage>
    );
  }

  const { member, assignedMaster, enrolledSessions, recentAttendance, assessments } = data;

  return (
    <WorkspacePage title="Student Portal / மாணவர் தளம்" technicalName="sportsclub-student" className="space-y-4">
      <Card className="space-y-2 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{member.name}</h2>
          <WorkspaceStatusBadge status={member.status ?? "Unknown"} />
        </div>
        <p className="text-sm text-muted-foreground">Member number: {member.memberNo ?? "Not assigned"}</p>
        <p className="text-sm text-muted-foreground">Assigned master: {assignedMaster?.name ?? "Not assigned"}</p>
      </Card>

      {tab === "profile" ? (
        <>
          <Card className="grid gap-3 p-5 text-sm sm:grid-cols-2">
            <p>Email: {member.email}</p>
            <p>Phone: {member.phone || "Not recorded"}</p>
            <p>Date of birth: {member.dateOfBirth ?? "Not recorded"}</p>
            <p>Current stage: {member.progressNote || "Not recorded"}</p>
            <p>Guardian: {member.guardianName ?? "Not recorded"}</p>
            <p>Emergency contact: {member.emergencyContact ?? "Not recorded"}</p>
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="font-semibold">Assessments</h3>
            {assessments.length === 0 ? <p className="text-sm text-muted-foreground">No assessments recorded.</p> : null}
            {assessments.map((assessment) => (
              <div key={assessment.uuid} className="border-t pt-2 text-sm">
                <p>{assessment.stageLevel} · {assessment.gradedAt}</p>
                <p className="text-muted-foreground">{assessment.assessment || "No evaluation note"}</p>
              </div>
            ))}
          </Card>
        </>
      ) : null}

      {tab === "attendance" ? (
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Recent attendance</h3>
          {recentAttendance.length === 0 ? <p className="text-sm text-muted-foreground">No attendance recorded.</p> : null}
          {recentAttendance.map((entry) => (
            <div key={entry.uuid} className="flex justify-between gap-3 border-t pt-2 text-sm">
              <span>{entry.attendanceDate} · Session {entry.sessionUuid}</span>
              <WorkspaceStatusBadge status={entry.status} />
            </div>
          ))}
        </Card>
      ) : null}

      {tab === "batches" || tab === "schedule" ? (
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Enrolled sessions</h3>
          {enrolledSessions.length === 0 ? <p className="text-sm text-muted-foreground">No sessions assigned.</p> : null}
          {enrolledSessions.map((session) => (
            <div key={session.uuid} className="border-t pt-2 text-sm">
              <p className="font-medium">{session.title}</p>
              <p className="text-muted-foreground">{session.daysOfWeek} · {session.startTime}–{session.endTime} · {session.venue}</p>
            </div>
          ))}
        </Card>
      ) : null}

      {tab === "fees" ? (
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Membership</h3>
          <p className="text-sm">Current status: {member.status}</p>
          <p className="text-sm text-muted-foreground">Fee information is not available in this portal.</p>
        </Card>
      ) : null}
    </WorkspacePage>
  );
}
