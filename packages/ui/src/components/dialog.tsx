import type { ReactNode } from "react";
import { cn } from "../libs/utils";
import { Button } from "./button";

export interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onOpenChange: (open: boolean) => void;
  readonly variant?: "default" | "confirmation" | "destructive" | "full-screen";
}

function Dialog({ open, title, children, onOpenChange, variant = "default" }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-canvas/80 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-2xl",
          variant === "destructive" && "border-danger/50",
          variant === "full-screen" && "h-full max-w-none",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export { Dialog };
