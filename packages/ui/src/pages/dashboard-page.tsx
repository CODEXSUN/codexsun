import type { ReactNode } from "react";

export interface DashboardPageProps {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
}

export function DashboardPage({ title, description, children, action }: DashboardPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </div>
  );
}
