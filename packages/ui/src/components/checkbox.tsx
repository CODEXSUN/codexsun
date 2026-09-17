import * as React from "react";
import { cn } from "../libs/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type"> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    aria-invalid={invalid || undefined}
    className={cn(
      "size-4 rounded border-border bg-surface accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
      invalid && "accent-danger focus-visible:ring-danger",
      className,
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
