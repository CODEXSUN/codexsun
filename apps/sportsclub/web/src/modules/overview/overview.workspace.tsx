"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Shield,
  UserCheck,
  Users
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  useMasterPortalMe,
  useSportsclubOverview,
  useStudentPortalMe
} from "./overview.hooks";
import type { SportsclubWorkspaceTab } from "./overview.types";

export function SportsclubOverviewWorkspace({
  userRole = "admin",
  currentUserName = "Club Administrator",
  onOpenWorkspace
}: {
  userRole?: "admin" | "master" | "student";
  currentUserName?: string;
  onOpenWorkspace?: (tab: SportsclubWorkspaceTab) => void;
}) {
  const [activePortalRole, setActivePortalRole] = useState<"admin" | "master" | "student">(
    userRole
  );

  const overviewQuery = useSportsclubOverview();
  const studentPortalQuery = useStudentPortalMe(activePortalRole === "student");
  const masterPortalQuery = useMasterPortalMe(activePortalRole === "master");

  const overview = overviewQuery.data ?? {
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalMasters: 0,
    activeSessions: 0,
    upcomingEvents: 0,
    todayAttendanceCount: 0,
    newEnquiriesCount: 0
  };

  return (
    <WorkspacePage
      title="Sportsclub Overview / சிவகலை குருகுலம்"
      technicalName="sportsclub-overview"
      className="space-y-6"
    >
      {/* Academy Header & Identity */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-emerald-950/20 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Shield className="size-3.5" />
              <span>Tenkasi Sports Club • Multi-Tenant Gurukulam Desk ({currentUserName})</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலம்
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Veerathamilan Traditional Sivakalai Gurukulam & Sports Academy
            </p>
            <p className="text-xs text-muted-foreground/80">
              Head Asan:{" "}
              <span className="font-semibold text-foreground">
                கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன் (Asan Thiru. Veerapandian)
              </span>{" "}
              • Silambam & Traditional Martial Arts
            </p>
          </div>

          {/* Role View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setActivePortalRole("admin")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePortalRole === "admin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Club Admin Desk
            </button>
            <button
              type="button"
              onClick={() => setActivePortalRole("master")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePortalRole === "master"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Master / ஆசான் Portal
            </button>
            <button
              type="button"
              onClick={() => setActivePortalRole("student")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePortalRole === "student"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Student Portal
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN EXPERIENCE */}
      {activePortalRole === "admin" ? (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <Card
              className="cursor-pointer border-border/80 p-4 transition-colors hover:border-emerald-600/50 hover:bg-muted/10"
              onClick={() => onOpenWorkspace?.("members")}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Students Enrolled</span>
                <Users className="size-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {overview.totalMembers}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-emerald-600">{overview.activeMembers} active</span>
                {overview.pendingMembers > 0 ? (
                  <span>• {overview.pendingMembers} pending</span>
                ) : null}
              </div>
            </Card>

            <Card
              className="cursor-pointer border-border/80 p-4 transition-colors hover:border-emerald-600/50 hover:bg-muted/10"
              onClick={() => onOpenWorkspace?.("masters")}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Club Masters / ஆசான்கள்</span>
                <GraduationCap className="size-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {overview.totalMasters}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Instructors & trainers</p>
            </Card>

            <Card
              className="cursor-pointer border-border/80 p-4 transition-colors hover:border-emerald-600/50 hover:bg-muted/10"
              onClick={() => onOpenWorkspace?.("sessions")}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Scheduled Batches</span>
                <Clock className="size-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {overview.activeSessions}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Active training sessions</p>
            </Card>

            <Card
              className="cursor-pointer border-border/80 p-4 transition-colors hover:border-emerald-600/50 hover:bg-muted/10"
              onClick={() => onOpenWorkspace?.("enquiries")}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Admission Enquiries</span>
                <Mail className="size-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {overview.newEnquiriesCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">New applicant leads</p>
            </Card>
          </div>

          {/* Module Navigation Cards */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Sports Club Operations
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("members")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Student Roster</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enrollments, belt stages, guardian contacts, emergency profiles.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Students Workspace</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("masters")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Asans & Masters</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Profiles, martial arts lineage, specializations, public website listings.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Masters Directory</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("programs")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Disciplines & Syllabus</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Silambam, Varma Kalai, weaponry, curriculum stages, grading standards.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Disciplines</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("sessions")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Batches & Venues</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Daily training timetables, ground venues, instructor assignments.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Batches</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("attendance")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Attendance Register</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Session attendance marking, presence logs, excused absence records.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Attendance</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("progress")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Belt Assessments</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Grading exams, stage certifications, technical notes certified by asans.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Grading</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("events")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Events & Tournaments</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Public demonstrations, district championships, summer training camps.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Events</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>

              <div
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:border-emerald-600/60 hover:shadow"
                onClick={() => onOpenWorkspace?.("enquiries")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-foreground">Admissions Inbox</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Online lead captures, phone consultations, registration status.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 group-hover:underline">
                  <span>Open Admissions</span>
                  <ArrowRight className="ml-1 size-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MASTER / ASAN EXPERIENCE */}
      {activePortalRole === "master" ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">
              Master Desk / ஆசான் பயிற்றுவிப்புப் பிரிவு
            </h2>
            <p className="text-xs text-muted-foreground">
              Supervising assigned students, recording training batch attendance, and grading belt
              progression.
            </p>

            {masterPortalQuery.isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading master portal records...
              </div>
            ) : masterPortalQuery.isError ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="size-4" />
                  <span>Instructor Assignment Verification</span>
                </div>
                <p className="mt-1">
                  Active master portal session will synchronize when logged in as an assigned club
                  asan. You can view all assigned students and grading lists below.
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                onClick={() => onOpenWorkspace?.("members")}
              >
                <Users className="size-4 text-emerald-600" />
                <span>View Assigned Students</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                onClick={() => onOpenWorkspace?.("attendance")}
              >
                <UserCheck className="size-4 text-emerald-600" />
                <span>Mark Batch Attendance</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                onClick={() => onOpenWorkspace?.("progress")}
              >
                <Award className="size-4 text-emerald-600" />
                <span>Evaluate Belt Grading</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* STUDENT SELF-SERVICE EXPERIENCE */}
      {activePortalRole === "student" ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">
              Student Portal / மாணவர் தற்காப்புப் பதிவேடு
            </h2>
            <p className="text-xs text-muted-foreground">
              View your enrolled martial arts disciplines, belt advancement stages, and session attendance.
            </p>

            {studentPortalQuery.isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading student portal records...
              </div>
            ) : studentPortalQuery.isError ? (
              <div className="mt-4 rounded-md border border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Student Self-Service Enabled</span>
                </div>
                <p className="mt-1">
                  Students can safely view their current rank, upcoming practice schedules, and exam
                  eligibility. Guardian details and emergency numbers remain protected and editable
                  only by authorized guardians and club admins.
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border/70 p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Current Training Discipline
                </span>
                <p className="mt-1 text-base font-bold text-foreground">Silambam (சிலம்பக் கலை)</p>
                <p className="text-xs text-muted-foreground">
                  Traditional martial arts handbook & curriculum (Veerathamilan Gurukulam)
                </p>
              </div>

              <div className="rounded-md border border-border/70 p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Safety & Guardian Info
                </span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Emergency contacts registered
                </p>
                <p className="text-xs text-emerald-600">
                  Protected under strict Gurukulam privacy standards
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
