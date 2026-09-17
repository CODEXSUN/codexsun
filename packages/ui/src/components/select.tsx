import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const selectVariants = cva(
  "flex w-full rounded-md border bg-surface px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: { default: "border-border", error: "border-danger focus-visible:ring-danger" },
      density: { default: "h-9", compact: "h-8" },
    },
    defaultVariants: { state: "default", density: "default" },
  },
);

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select"> & VariantProps<typeof selectVariants>
>(({ className, state, density, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={state === "error" || undefined}
    className={cn(selectVariants({ state, density, className }))}
    {...props}
  />
));
Select.displayName = "Select";

export { Select, selectVariants };
