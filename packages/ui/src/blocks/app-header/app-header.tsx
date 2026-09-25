import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckIcon, CopyIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/breadcrumb";
import { Button } from "../../components/button";
import { cn } from "../../lib/utils";

export type AppHeaderVariant = "breadcrumb-actions" | "title-actions" | "resource-actions";

export type AppHeaderBreadcrumb = { label: string; href?: string };

export type AppHeaderAction = {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
};

export type AppHeaderProps = {
  variant?: AppHeaderVariant;
  breadcrumbs?: readonly AppHeaderBreadcrumb[];
  title?: ReactNode;
  titleIcon?: LucideIcon;
  profile?: ReactNode;
  filter?: ReactNode;
  primaryAction?: AppHeaderAction;
  resourceLabel?: string;
  resourceHref?: string;
  copyValue?: string;
  copyLabel?: string;
  onCopy?: (value: string) => void;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
};

/** Shared page-level header with three common workspace arrangements. */
export function AppHeader({
  variant = "breadcrumb-actions",
  breadcrumbs = [],
  title,
  titleIcon: TitleIcon,
  profile,
  filter,
  primaryAction,
  resourceLabel,
  resourceHref,
  copyValue,
  copyLabel = "Copy resource",
  onCopy,
  start,
  end,
  className,
}: AppHeaderProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copyResource = async () => {
    if (!copyValue) return;
    try {
      if (onCopy) onCopy(copyValue);
      else await navigator.clipboard.writeText(copyValue);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const ActionIcon = primaryAction?.icon;

  return (
    <header
      aria-label="Application header"
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-4 border-b border-border bg-background px-4 py-2",
        className,
      )}
      data-ui-component="AppHeader"
      data-variant={variant}
    >
      <div className="flex min-w-0 items-center gap-3">
        {start}
        {variant === "breadcrumb-actions" ? <AppBreadcrumbs items={breadcrumbs} /> : null}
        {variant === "title-actions" ? (
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            {TitleIcon ? <TitleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
            <span className="truncate">{title}</span>
          </div>
        ) : null}
        {variant === "resource-actions" ? (
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
        ) : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        {variant === "title-actions" ? filter : null}
        {variant === "breadcrumb-actions" ? profile : null}
        {variant === "resource-actions" && resourceLabel ? (
          <a
            className="max-w-[min(45vw,32rem)] truncate rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            href={resourceHref}
          >
            {resourceLabel}
          </a>
        ) : null}
        {variant === "resource-actions" && copyValue ? (
          <Button
            aria-label={copyState === "copied" ? "Copied" : copyLabel}
            onClick={copyResource}
            size="icon-sm"
            variant="ghost"
          >
            {copyState === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          </Button>
        ) : null}
        {end}
        {primaryAction ? (
          <Button disabled={primaryAction.disabled} onClick={primaryAction.onClick} size="sm">
            {ActionIcon ? <ActionIcon aria-hidden="true" /> : null}
            {primaryAction.label}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function AppBreadcrumbs({ items }: { items: readonly AppHeaderBreadcrumb[] }) {
  if (items.length === 0) return null;
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-xs">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
