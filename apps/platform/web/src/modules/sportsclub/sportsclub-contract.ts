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

export type SportsclubWebModule = {
  SportsclubWorkspace?: ComponentType<{ gateway?: SportsclubGateway }>;
  SportsclubStudentWorkspace?: ComponentType<{
    gateway?: SportsclubGateway;
    tab?: SportsclubStudentTab;
  }>;
};
