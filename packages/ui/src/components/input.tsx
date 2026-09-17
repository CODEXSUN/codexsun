import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const inputVariants = cva(
  "flex w-full rounded-md border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: { default: "border-border", error: "border-danger focus-visible:ring-danger" },
      density: { default: "h-9", compact: "h-8" },
    },
    defaultVariants: { state: "default", density: "default" },
  },
);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & VariantProps<typeof inputVariants>>(
  ({ className, state, density, readOnly, ...props }, ref) => (
    <input
      ref={ref}
      readOnly={readOnly}
      aria-invalid={state === "error" || undefined}
      className={cn(inputVariants({ state, density, className }), readOnly && "bg-surface-raised")}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
