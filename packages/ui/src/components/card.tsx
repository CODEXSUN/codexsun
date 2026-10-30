import * as React from "react";

import { cn } from "../lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    action?: React.ReactNode;
    description?: React.ReactNode;
    title?: React.ReactNode;
    size?: "default" | "sm";
  }
>(({ action, children, className, description, size = "default", title, ...props }, ref) => (
  <div
    ref={ref}
    data-size={size}
    className={cn("rounded-xl border bg-card text-card-foreground shadow", size === "sm" && "[&_[data-slot=card-header]]:p-3 [&_[data-slot=card-content]]:px-3 [&_[data-slot=card-footer]]:px-3", className)}
    {...props}
  >
    {title || description ? (
      <CardHeader
        className={action ? "flex-row items-start justify-between gap-4 space-y-0" : undefined}
      >
        <div className="space-y-1.5">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
    ) : null}
    {title || description ? <CardContent>{children}</CardContent> : children}
  </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="card-action" className={cn("ml-auto shrink-0", className)} {...props} />
  )
);
CardAction.displayName = "CardAction";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction };
