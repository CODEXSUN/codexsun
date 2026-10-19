import type { ComponentType } from "react";

declare module "@codexsun/sportsclub-web" {
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
  };

  export type SportsclubStudentTab = "profile" | "attendance" | "batches" | "schedule" | "fees";

  export const SportsclubWorkspace: ComponentType<{
    gateway?: SportsclubGateway;
  }>;

  export const SportsclubStudentWorkspace: ComponentType<{
    gateway?: SportsclubGateway;
    tab?: SportsclubStudentTab;
  }>;
}
