import type { LucideIcon } from "lucide-react";

import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/ui/card";

interface ShowcaseCardProps {
  icon?: LucideIcon;
  category?: string;
  title: string;
  description: string;
  tags?: string[];
  metrics?: Array<{ label: string; value: string }>;
  ctaLabel?: string;
  ctaHref?: string;
}

export function ShowcaseCard({
  icon: Icon,
  category,
  title,
  description,
  tags = [],
  metrics = [],
  ctaLabel,
  ctaHref,
}: ShowcaseCardProps) {
  return (
    <Card className="h-full border-border/70 shadow-none">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            {category ? <Badge variant="outline">{category}</Badge> : null}
            <div className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="text-sm leading-7">
                {description}
              </CardDescription>
            </div>
          </div>
          {Icon ? (
            <div className="rounded-2xl border border-border/60 bg-muted/25 p-3">
              <Icon className="size-5 text-muted-foreground" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-border/60 bg-muted/15 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {ctaLabel && ctaHref ? (
          <Button variant="outline" asChild>
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
