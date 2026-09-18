import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export type MdiProps = {
  children?: ReactNode;
  className?: string;
  label?: string;
};

export function Mdi({ children, className, label = "MDI" }: MdiProps) {
  return (
    <section
      aria-label={label}
      className={cn("grid size-full min-h-0 place-items-center bg-background text-foreground", className)}
    >
      {children ?? <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </section>
  );
}
