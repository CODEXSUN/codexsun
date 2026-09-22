import type { ReactNode } from "react";
import { cn } from "@codexsun/ui/lib/utils";

export function SpecimenStage({
  children,
  className,
  compact,
}: {
  children: ReactNode;
  className?: string;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        compact
          ? "mx-auto flex min-h-44 max-w-2xl items-center justify-center p-4"
          : "mx-auto flex min-h-64 max-w-4xl items-center justify-center rounded-xl border bg-background p-8 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
