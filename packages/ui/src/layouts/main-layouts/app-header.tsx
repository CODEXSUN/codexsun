import { Fragment, type ReactNode } from "react";
import { HouseIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "../../components/breadcrumb";
import { cn } from "../../lib/utils";

export type AppHeaderBreadcrumb = {
  label: string;
  href?: string;
};

export type AppHeaderProps = {
  actionsAlignment?: "edge" | "workspace" | "form";
  actions?: ReactNode;
  breadcrumbs: AppHeaderBreadcrumb[];
  homeHref: string;
  name?: string;
  className?: string;
};

export function AppHeader({
  actionsAlignment = "edge",
  actions,
  breadcrumbs,
  homeHref,
  name,
  className
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-h-10 shrink-0 items-center justify-between gap-4 border-b bg-background px-4",
        className
      )}
    >
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink aria-label="Go to overview" href={homeHref}>
              <HouseIcon aria-hidden="true" className="size-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0 flex-nowrap">
                {crumb.href ? (
                  <BreadcrumbLink className="truncate" href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : index < breadcrumbs.length - 1 ? (
                  <span className="truncate">{crumb.label}</span>
                ) : (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {name || actions ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2",
            actionsAlignment === "workspace" &&
              "mr-4 lg:mr-[max(2rem,calc((100%-92rem)/2+0.5rem))]",
            actionsAlignment === "form" && "mr-4 lg:mr-[max(2rem,calc((100%-72rem)/2))]"
          )}
        >
          {name ? <span className="text-sm font-medium text-muted-foreground">{name}</span> : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
