import type { ReactNode } from "react";
import { DashboardPage } from "./dashboard-page";

export interface SettingsPageProps {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

export function SettingsPage({ title, description, children }: SettingsPageProps) {
  return (
    <DashboardPage title={title} description={description}>
      {children}
    </DashboardPage>
  );
}
