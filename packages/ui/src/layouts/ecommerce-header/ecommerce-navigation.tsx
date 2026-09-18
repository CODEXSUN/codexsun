import { ChevronDownIcon, PhoneCallIcon } from "lucide-react";

import { Badge } from "../../components/badge";
import type { EcommerceCategoryItem, EcommerceHeaderProps } from "./ecommerce-header-types";

type EcommerceNavigationProps = {
  categories: readonly EcommerceCategoryItem[];
  quickLinks: NonNullable<EcommerceHeaderProps["quickLinks"]>;
  supportPhone?: string;
};

export function EcommerceNavigation({ categories, quickLinks, supportPhone }: EcommerceNavigationProps) {
  return (
    <div className="border-t border-border/40 bg-muted/20 px-4 py-1.5 text-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-0.5">
          {categories.map((category) => (
            <CategoryMenu category={category} key={category.id} />
          ))}
          <div className="mx-1.5 h-4 w-px bg-border/60" />
          {quickLinks.map((link) => (
            <QuickLink href={link.href} key={link.label} label={link.label} badge={link.badge} />
          ))}
        </div>
        {supportPhone ? <SupportPhone value={supportPhone} /> : null}
      </div>
    </div>
  );
}

function CategoryMenu({ category }: { category: EcommerceCategoryItem }) {
  return (
    <div className="group relative">
      <a
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:bg-muted group-hover:text-primary"
        href={category.href}
      >
        {category.icon}
        <span>{category.label}</span>
        {category.subcategories?.length ? <ChevronDownIcon className="size-3 text-muted-foreground" /> : null}
        {category.isHot ? (
          <Badge className="h-4 px-1 text-[9px] font-bold uppercase" variant="destructive">
            Hot
          </Badge>
        ) : null}
      </a>
      {category.subcategories?.length ? <SubcategoryMenu category={category} /> : null}
    </div>
  );
}

function SubcategoryMenu({ category }: { category: EcommerceCategoryItem }) {
  return (
    <div className="animate-in fade-in-0 zoom-in-95 invisible absolute top-full left-0 z-50 mt-1 w-64 rounded-xl border border-border/80 bg-popover p-3 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {category.label} subcategories
      </p>
      <div className="space-y-1">
        {category.subcategories?.map((subcategory) => (
          <a
            className="flex flex-col rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
            href={subcategory.href}
            key={subcategory.label}
          >
            <span className="text-xs font-medium">{subcategory.label}</span>
            {subcategory.description ? (
              <span className="text-[10px] text-muted-foreground">{subcategory.description}</span>
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ badge, href, label }: { badge?: string; href: string; label: string }) {
  return (
    <a
      className="flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
      href={href}
    >
      <span>{label}</span>
      {badge ? (
        <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[9px] font-semibold text-rose-500">{badge}</span>
      ) : null}
    </a>
  );
}

function SupportPhone({ value }: { value: string }) {
  return (
    <div className="hidden shrink-0 items-center gap-1.5 text-muted-foreground lg:flex">
      <PhoneCallIcon className="size-3.5 text-primary" />
      <span>Need help?</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
