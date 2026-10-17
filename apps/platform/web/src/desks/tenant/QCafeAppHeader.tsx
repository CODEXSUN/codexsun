import {
  CalendarDays,
  Coffee,
  House,
  ReceiptText,
  Settings2,
  ShoppingBag,
  UtensilsCrossed
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@codexsun/ui/components/breadcrumb";
import { cn } from "@codexsun/ui/lib/utils";

const pages = {
  "qcafe.overview": { label: "POS", icon: Coffee, color: "bg-blue-600 text-white" },
  "qcafe.kot": { label: "KOT", icon: ReceiptText, color: "bg-green-700 text-white" },
  "qcafe.take-away": {
    label: "Parcel - Take away",
    icon: ShoppingBag,
    color: "bg-purple-700 text-white"
  },
  "qcafe.booking": { label: "Booking", icon: CalendarDays, color: "bg-amber-700 text-white" },
  "qcafe.menu": { label: "Master", icon: UtensilsCrossed, color: "bg-background text-foreground" },
  "qcafe.settings": { label: "Settings", icon: Settings2, color: "bg-background text-foreground" }
};

export function QCafeAppHeader({ page }: { page: string }) {
  const current = pages[page as keyof typeof pages];
  if (!current) return null;
  const Icon = current.icon;
  return (
    <header className={cn("flex min-h-11 shrink-0 items-center border-b px-4", current.color)}>
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap text-base text-inherit">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/app/qcafe"
              aria-label="Go to QCafe POS"
              className="rounded-sm text-inherit hover:text-inherit hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            >
              <House aria-hidden="true" className="size-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-inherit opacity-75" />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2 text-base font-semibold text-inherit">
              <Icon aria-hidden="true" className="size-[18px]" />
              {current.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
