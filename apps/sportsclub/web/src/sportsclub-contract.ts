import type { ComponentType } from "react";

export type SportsclubGateway = {
  attendance?: {
    list: () => Promise<unknown>;
  };
  batches?: {
    list: () => Promise<unknown>;
  };
  session?: () => Promise<unknown>;
  students?: {
    get: (uuid: string) => Promise<unknown>;
    list: () => Promise<unknown>;
  };
  [key: string]: unknown;
};

export type SportsclubStudentTab = "profile" | "attendance" | "batches" | "schedule" | "fees";

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

export type SportsclubWebModule = {
  SportsclubWorkspace?: ComponentType<{
    gateway?: SportsclubGateway;
    initialTab?: SportsclubWorkspaceTab;
  }>;
  SportsclubStudentWorkspace?: ComponentType<{
    gateway?: SportsclubGateway;
    tab?: SportsclubStudentTab;
  }>;
};
