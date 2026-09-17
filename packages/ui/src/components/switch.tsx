import * as React from "react";
import { cn } from "../libs/utils";

const Switch = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type"> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      aria-invalid={invalid || undefined}
      className={cn(
        "h-5 w-9 appearance-none rounded-full bg-muted transition-colors before:block before:size-4 before:translate-x-0.5 before:rounded-full before:bg-foreground before:transition-transform checked:bg-primary checked:before:translate-x-4 checked:before:bg-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "focus-visible:ring-danger",
        className,
      )}
      {...props}
    />
  ),
);
Switch.displayName = "Switch";

export { Switch };
