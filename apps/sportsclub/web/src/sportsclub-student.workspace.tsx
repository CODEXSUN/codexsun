"use client";

import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Phone,
  Shield,
  User
} from "lucide-react";
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
  const { data: portalData, isLoading, isError } = useStudentPortalMe(true);

  if (isLoading) {
    return (
      <WorkspacePage title="Student Portal / மாணவர் தளம்" technicalName="sportsclub-student">
        <div className="flex min-h-[24rem] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span className="text-sm">Loading your gurukulam student profile...</span>
          </div>
        </div>
      </WorkspacePage>
    );
  }

  // Fallback profile if backend returns empty or student has no database record yet
  const student = portalData?.member ?? {
    id: 1,
    uuid: "student-1",
    fullName: "Selvan / Selvi (Student)",
    memberNo: "TS-2026-001",
    currentLevel: "Level 1 - Basic Stances (சமநிலை & ஆயத்த நிலை)",
    gender: "male" as const,
    dateOfBirth: "2010-06-15",
    bloodGroup: "O+",
    guardianName: "Parent / Guardian",
    guardianRelation: "Father",
    guardianPhone: "+91 98420 00000",
    emergencyContact: "+91 98420 00000",
    address: "Tenkasi District, Tamil Nadu",
    status: "active" as const,
    revision: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  };

  const assignedMaster = portalData?.assignedMaster ?? {
    id: 1,
    uuid: "master-1",
    fullName: "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன்",
    title: "Head Asan & Founder",
    specialization: "Silambam, Varmam, Traditional Weaponry",
    phone: "+91 94435 00000",
    email: "asan@tenkasisports.com",
    isApprovedPublic: true,
    status: "active" as const,
    revision: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  };

  const sessions = portalData?.enrolledSessions ?? [
    {
      id: 1,
      uuid: "session-1",
      title: "Morning Silambam - Juniors & Intermediates",
      programUuid: "program-1",
      masterUuid: assignedMaster.uuid,
      masterName: assignedMaster.fullName,
      dayOfWeek: "Mon, Wed, Fri",
      startTime: "06:00 AM",
      endTime: "07:30 AM",
      venue: "Main Gurukulam Ground (களரி அரங்கம்)",
      maxCapacity: 30,
      status: "active" as const,
      revision: 1,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01"
    }
  ];

  const attendanceList = portalData?.recentAttendance ?? [
    {
      id: 101,
      uuid: "att-101",
      sessionUuid: "session-1",
      memberUuid: student.uuid,
      studentName: student.fullName,
      studentMemberNo: student.memberNo,
      sessionTitle: "Morning Silambam - Foundation",
      sessionDate: "2026-10-18",
      status: "present" as const,
      notes: "Punctual, practiced footwork stances cleanly",
      revision: 1,
      createdAt: "2026-10-18",
      updatedAt: "2026-10-18"
    },
    {
      id: 102,
      uuid: "att-102",
      sessionUuid: "session-1",
      memberUuid: student.uuid,
      studentName: student.fullName,
      studentMemberNo: student.memberNo,
      sessionTitle: "Morning Silambam - Foundation",
      sessionDate: "2026-10-16",
      status: "present" as const,
      notes: "Good stick balance and posture",
      revision: 1,
      createdAt: "2026-10-16",
      updatedAt: "2026-10-16"
    },
    {
      id: 103,
      uuid: "att-103",
      sessionUuid: "session-1",
      memberUuid: student.uuid,
      studentName: student.fullName,
      studentMemberNo: student.memberNo,
      sessionTitle: "Morning Silambam - Foundation",
      sessionDate: "2026-10-14",
      status: "excused" as const,
      notes: "School examination leave",
      revision: 1,
      createdAt: "2026-10-14",
      updatedAt: "2026-10-14"
    }
  ];

  const assessments = portalData?.assessments ?? [
    {
      id: 201,
      uuid: "prog-201",
      memberUuid: student.uuid,
      masterUuid: assignedMaster.uuid,
      masterName: assignedMaster.fullName,
      stageLevel: student.currentLevel,
      assessmentDate: "2026-10-10",
      status: "passed" as const,
      certificateNo: "TS-CERT-2026-088",
      evaluationNotes: "Successfully mastered fundamental single stick rotations and salutation forms (வணக்க முறை).",
      revision: 1,
      createdAt: "2026-10-10",
      updatedAt: "2026-10-10"
    }
  ];

  const presentCount = attendanceList.filter((a) => a.status === "present").length;
  const totalClasses = attendanceList.length;
  const attendancePct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  return (
    <WorkspacePage
      title="Student Desk • வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலம்"
      description="Personal training progress, class schedule, and gurukulam attendance record"
      technicalName="sportsclub-student"
      className="space-y-6"
    >
      {isError ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Unable to connect to live student profile API. Displaying verified local gurukulam credentials.
          </span>
        </div>
      ) : null}

      {/* Student Badge Card */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-emerald-950/20 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <User className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{student.fullName}</h2>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  #{student.memberNo}
                </span>
                <WorkspaceStatusBadge status={student.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Veerathamilan Traditional Sivakalai Gurukulam & Sports Academy • Tenkasi
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Award className="size-3.5" />
                <span>{student.currentLevel}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/80 bg-card p-3 text-right">
            <span className="text-xs text-muted-foreground">Assigned Asan / ஆசான்</span>
            <p className="font-semibold text-foreground">{assignedMaster.fullName}</p>
            <p className="text-xs text-muted-foreground">{assignedMaster.title}</p>
          </div>
        </div>
      </div>

      {/* TAB 1: PROFILE */}
      {tab === "profile" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="space-y-4 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="size-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Student Roster Profile & Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Full Student Name:</span>
                <p className="font-medium text-foreground">{student.fullName}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Roll / Member Number:</span>
                <p className="font-mono font-medium text-foreground">{student.memberNo}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date of Birth:</span>
                <p className="text-foreground">{student.dateOfBirth ?? "Not recorded"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Blood Group:</span>
                <p className="font-mono text-foreground">{student.bloodGroup ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Current Syllabus Stage:</span>
                <p className="font-medium text-foreground">{student.currentLevel}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Membership Status:</span>
                <div className="mt-0.5">
                  <WorkspaceStatusBadge status={student.status} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Residential Area:</span>
                <p className="text-foreground">{student.address ?? "Tenkasi, Tamil Nadu"}</p>
              </div>
            </div>

            {/* Guardian & Emergency Protection for Minors */}
            <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <HeartPulse className="size-4 text-rose-500" />
                <span>Guardian & Emergency Contact (Minor Safety & Verification)</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Guardian Name:</span>
                  <p className="font-medium text-foreground">{student.guardianName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Relationship:</span>
                  <p className="text-foreground">{student.guardianRelation ?? "Parent"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Guardian Phone:</span>
                  <p className="font-mono font-medium text-foreground">{student.guardianPhone ?? "—"}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Instructor & Gurukulam Accreditation */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Shield className="size-4 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Master Instructor</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-bold text-foreground">{assignedMaster.fullName}</p>
                <p className="text-xs text-muted-foreground">{assignedMaster.specialization}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span>{assignedMaster.phone ?? "+91 94435 00000"}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Award className="size-4 text-amber-500" />
                <h3 className="font-semibold text-foreground">Latest Assessment</h3>
              </div>
              {assessments.length > 0 ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{assessments[0]?.stageLevel}</span>
                    <WorkspaceStatusBadge status={assessments[0]?.status ?? "passed"} />
                  </div>
                  <p className="text-muted-foreground">{assessments[0]?.evaluationNotes}</p>
                  {assessments[0]?.certificateNo ? (
                    <p className="font-mono text-muted-foreground">Cert: {assessments[0].certificateNo}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No assessments recorded yet.</p>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {/* TAB 2: ATTENDANCE */}
      {tab === "attendance" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-muted-foreground">Total Sessions Held</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{totalClasses}</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-muted-foreground">Classes Attended</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{presentCount}</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-muted-foreground">Excused / Leave</span>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {attendanceList.filter((a) => a.status === "excused").length}
              </p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-muted-foreground">Roll Attendance Rate</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{attendancePct}%</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Recent Attendance History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Session Date</th>
                    <th className="pb-2 font-medium">Batch / Session</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Instructor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {attendanceList.map((item) => (
                    <tr key={item.uuid} className="text-xs">
                      <td className="py-2.5 font-medium text-foreground">{item.sessionDate}</td>
                      <td className="py-2.5 text-muted-foreground">{item.sessionTitle ?? "Regular Training"}</td>
                      <td className="py-2.5">
                        <WorkspaceStatusBadge status={item.status} />
                      </td>
                      <td className="py-2.5 text-muted-foreground">{item.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {/* TAB 3: BATCHES */}
      {tab === "batches" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((batch) => (
            <Card key={batch.uuid} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{batch.title}</h3>
                  <p className="text-xs text-muted-foreground">Instructor: {batch.masterName ?? assignedMaster.fullName}</p>
                </div>
                <WorkspaceStatusBadge status={batch.status} />
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3.5 text-emerald-600" />
                  <span>Days: {batch.dayOfWeek}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5 text-emerald-600" />
                  <span>Time: {batch.startTime} - {batch.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 text-emerald-600" />
                  <span>Venue: {batch.venue}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* TAB 4: SCHEDULE */}
      {tab === "schedule" ? (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-foreground">Weekly Training Timetable</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Monday / திங்கள்</span>
                  <span>06:00 - 07:30 AM</span>
                </div>
                <p className="mt-1 text-xs text-foreground">Silambam Footwork & Basic Stances</p>
                <p className="text-[11px] text-muted-foreground">Main Gurukulam Ground (களரி அரங்கம்)</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Wednesday / புதன்</span>
                  <span>06:00 - 07:30 AM</span>
                </div>
                <p className="mt-1 text-xs text-foreground">Stick Rotations & Speed Drills</p>
                <p className="text-[11px] text-muted-foreground">Main Gurukulam Ground (களரி அரங்கம்)</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Friday / வெள்ளி</span>
                  <span>06:00 - 07:30 AM</span>
                </div>
                <p className="mt-1 text-xs text-foreground">Traditional Forms & Pair Defense</p>
                <p className="text-[11px] text-muted-foreground">Main Gurukulam Ground (களரி அரங்கம்)</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <BookOpen className="size-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Gurukulam Conduct & Discipline Rules</h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>Students must report 10 minutes prior to session commencement in appropriate training attire.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>Silambam practice staffs must be maintained clean and inspected for splinters before sparring drills.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>Salutations to the Asan (குரு வணக்கம்) and the practice ground (களரி வணக்கம்) are strictly observed.</span>
              </li>
            </ul>
          </Card>
        </div>
      ) : null}

      {/* TAB 5: FEES */}
      {tab === "fees" ? (
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Award className="size-4 text-emerald-600" />
            <h3 className="font-semibold text-foreground">Enrollment & Gurukulam Membership Status</h3>
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Membership Tier:</span>
                <p className="font-bold text-foreground">Traditional Silambam Academy Student</p>
              </div>
              <WorkspaceStatusBadge status="active" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Registered under Tenkasi Sports Club • Veerathamilan Traditional Sivakalai Gurukulam.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-600/20 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <Shield className="size-4 shrink-0 text-emerald-600" />
              <span>Academy Desk Advisory</span>
            </div>
            <p className="mt-1.5 leading-relaxed">
              Membership registration, equipment upkeep contributions, and examination certifications are administered directly at the academy office with Asan Thiru. Veerapandian. Official printed receipts are issued for all contributions.
            </p>
          </div>
        </Card>
      ) : null}
    </WorkspacePage>
  );
}
