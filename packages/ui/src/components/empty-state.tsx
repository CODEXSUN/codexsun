import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const emptyStateVariants = cva("rounded-lg border border-dashed border-border p-8 text-center", {
  variants: {
    variant: {
      default: "bg-surface text-muted-foreground",
      error: "border-danger/40 bg-danger/10 text-danger",
      "no-results": "bg-surface text-muted-foreground",
      "no-access": "border-warning/40 bg-warning/10 text-warning",
    },
  },
  defaultVariants: { variant: "default" },
});

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

function EmptyState({ title, description, action, className, variant }: EmptyStateProps) {
  return (
    <section className={cn(emptyStateVariants({ variant, className }))}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 text-sm">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  );
}

export { EmptyState, emptyStateVariants };
