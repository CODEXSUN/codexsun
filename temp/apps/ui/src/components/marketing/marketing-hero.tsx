import type * as React from "react";
import { ArrowRight } from "lucide-react";

import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@ui/components/ui/card";
import { cn } from "@ui/lib/utils";

interface MarketingHeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

interface MarketingHeroProps {
  badge?: string;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: MarketingHeroAction[];
  aside?: React.ReactNode;
  className?: string;
}

export function MarketingHero({
  badge,
  eyebrow,
  title,
  description,
  actions = [],
  aside,
  className,
}: MarketingHeroProps) {
  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[1.12fr_0.88fr]",
        className
      )}
    >
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
        <CardHeader className="gap-5 border-b border-border/60 px-8 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center gap-3">
            {badge ? <Badge className="px-3 py-1">{badge}</Badge> : null}
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </span>
            ) : null}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
        </CardHeader>
        {actions.length > 0 ? (
          <CardContent className="flex flex-wrap gap-3 px-8 py-6 sm:px-10">
            {actions.map((action) => {
              const content = (
                <>
                  {action.label}
                  <ArrowRight className="size-4" />
                </>
              );

              if (action.href) {
                return (
                  <Button
                    key={`${action.label}-${action.href}`}
                    variant={action.variant ?? "default"}
                    asChild
                  >
                    <a href={action.href}>{content}</a>
                  </Button>
                );
              }

              return (
                <Button
                  key={action.label}
                  type="button"
                  variant={action.variant ?? "default"}
                  onClick={action.onClick}
                >
                  {content}
                </Button>
              );
            })}
          </CardContent>
        ) : null}
      </Card>

      {aside ? <div className="grid gap-6">{aside}</div> : null}
    </div>
  );
}
