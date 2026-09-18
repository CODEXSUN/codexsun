import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type UiBrowserFrameProps = {
  children: ReactNode;
  className?: string;
  title: string;
};

export function UiBrowserFrame({ children, className, title }: UiBrowserFrameProps) {
  return (
    <section
      aria-label={`${title} preview`}
      className={cn("overflow-hidden rounded-xl border border-border bg-background shadow-sm", className)}
    >
      <header className="flex h-9 items-center justify-between gap-4 border-b bg-muted/20 px-3">
        <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
        <span className="truncate text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">{title}</span>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
