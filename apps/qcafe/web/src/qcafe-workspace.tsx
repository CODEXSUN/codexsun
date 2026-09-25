import type { MdiNavigationSection } from "@codexsun/ui/layouts/main-workspace";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import {
  ArchiveIcon,
  BarChart3Icon,
  BookOpenIcon,
  CalculatorIcon,
  CircleDollarSignIcon,
  CalendarClockIcon,
  ChefHatIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PrinterIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  StoreIcon,
} from "lucide-react";
import type { QcafePageId, QcafeWorkspace, QcafeWorkspacePage } from "./qcafe-api";
import { FoundationSetupPage } from "./foundation-setup-page";
import { MenuPage } from "./menu-page";
import { PosPage } from "./pos-page";
import { KotPage } from "./kot-page";
import { DiningPage } from "./dining-page";
import { BillingPage } from "./billing-page";
import { InventoryPage } from "./inventory-page";
import { DocumentsPage } from "./documents-page";
import { BackupPage } from "./backup-page";
import { SyncPage } from "./sync-page";
import { MarketplacePage } from "./marketplace-page";
import { AccountingPage } from "./accounting-page";
import { ReportsPage } from "./reports-page";

type QcafeWorkspaceViewProps = {
  activePageId: QcafePageId;
  connectionState: "connected" | "connecting" | "failed";
  workspace?: QcafeWorkspace;
  request: typeof fetch;
};

const fallbackPages: QcafeWorkspacePage[] = [
  {
    description: "Review restaurant sales, live service, kitchen load, and bookings from one desk.",
    id: "overview",
    label: "Overview",
    status: "Connecting",
    title: "Restaurant overview",
  },
  {
    description: "Maintain categories, sale items, variants, price books, and effective prices.",
    id: "menu",
    label: "Menu setup",
    status: "Menu module",
    title: "Menu and pricing",
  },
  {
    description:
      "Set the business, outlets, service channels, business days, and document sequences before restaurant service starts.",
    id: "setup",
    label: "Business setup",
    status: "Foundation module",
    title: "Business and location setup",
  },
  {
    description: "Build the touch-first order screen for restaurant sales.",
    id: "pos",
    label: "POS",
    status: "Order workspace",
    title: "Point of sale",
  },
  {
    description: "Track kitchen order tickets and preparation state.",
    id: "kot",
    label: "KOT",
    status: "Kitchen live board",
    title: "Kitchen order tickets",
  },
  {
    description: "Manage table reservations and seated visits.",
    id: "booking",
    label: "Booking",
    status: "Table service",
    title: "Table booking",
  },
  {
    description: "Post bills, collect payments, issue receipts, and settle cash custody.",
    id: "billing",
    label: "Billing",
    status: "Payments and settlement",
    title: "Billing and settlement",
  },
  {
    description: "Track stock levels, recipes, daily plans, reservations, procurement, and consumption.",
    id: "inventory",
    label: "Inventory",
    status: "Stock ledger",
    title: "Inventory and stock",
  },
  {
    description: "Render documents, route print jobs across printers, and deliver receipts by email or WhatsApp.",
    id: "documents",
    label: "Documents",
    status: "Print and delivery",
    title: "Documents and printing",
  },
  {
    description: "Select the desktop data folder, schedule backups, and verify restores before relying on them.",
    id: "backup",
    label: "Backup",
    status: "Data protection",
    title: "Backup and recovery",
  },
  {
    description: "Register devices, review the change log, and resolve sync conflicts with a named decider.",
    id: "sync",
    label: "Sync",
    status: "Devices and conflicts",
    title: "Synchronization",
  },
  {
    description: "Connect marketplace partners, map menus, take in orders, fulfill deliveries, and post settlements.",
    id: "marketplace",
    label: "Marketplace",
    status: "Partner orders",
    title: "Marketplace channels",
  },
  {
    description: "Keep the chart of accounts, post balanced journals, and export posted records for the accountant.",
    id: "accounting",
    label: "Accounting",
    status: "Journals",
    title: "Accounting journals",
  },
  {
    description: "Read posted sales, tax, stock, and event records with location and business-day scope, plus alerts.",
    id: "reports",
    label: "Reports",
    status: "Posted records",
    title: "Reports and alerts",
  },
];

const pageIcons = {
  accounting: CalculatorIcon,
  backup: ArchiveIcon,
  billing: CircleDollarSignIcon,
  booking: CalendarClockIcon,
  documents: PrinterIcon,
  inventory: PackageIcon,
  kot: ChefHatIcon,
  marketplace: ShoppingBagIcon,
  menu: BookOpenIcon,
  overview: LayoutDashboardIcon,
  pos: ReceiptTextIcon,
  reports: BarChart3Icon,
  setup: StoreIcon,
  sync: RefreshCwIcon,
} as const;

export function createQcafeNavigation(
  activePageId: QcafePageId,
  pages: QcafeWorkspacePage[],
  onSelectPage: (pageId: QcafePageId) => void,
): MdiNavigationSection[] {
  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const overview = pageMap.get("overview") ?? fallbackPages[0];
  const setup = pageMap.get("setup") ?? getFallbackPage("setup");
  const cafePages = (["pos", "kot", "booking", "billing"] as const).map(
    (pageId) => pageMap.get(pageId) ?? getFallbackPage(pageId),
  );
  const operationsPages = (["inventory", "documents", "marketplace", "accounting", "reports"] as const).map(
    (pageId) => pageMap.get(pageId) ?? getFallbackPage(pageId),
  );
  const systemPages = (["backup", "sync"] as const).map((pageId) => pageMap.get(pageId) ?? getFallbackPage(pageId));

  return [
    {
      items: [
        {
          active: activePageId === "overview",
          icon: pageIcons.overview,
          label: overview.label,
          onSelect: () => onSelectPage("overview"),
        },
      ],
    },
    {
      defaultOpen: true,
      label: "Foundation",
      items: [
        {
          active: activePageId === "setup",
          icon: pageIcons.setup,
          label: setup.label,
          onSelect: () => onSelectPage("setup"),
        },
        {
          active: activePageId === "menu",
          icon: pageIcons.menu,
          label: (pageMap.get("menu") ?? getFallbackPage("menu")).label,
          onSelect: () => onSelectPage("menu"),
        },
      ],
    },
    {
      defaultOpen: true,
      label: "Cafe",
      items: cafePages.map((page) => ({
        active: activePageId === page.id,
        icon: pageIcons[page.id],
        label: page.label,
        onSelect: () => onSelectPage(page.id),
      })),
    },
    {
      defaultOpen: true,
      label: "Operations",
      items: operationsPages.map((page) => ({
        active: activePageId === page.id,
        icon: pageIcons[page.id],
        label: page.label,
        onSelect: () => onSelectPage(page.id),
      })),
    },
    {
      defaultOpen: false,
      label: "System",
      items: systemPages.map((page) => ({
        active: activePageId === page.id,
        icon: pageIcons[page.id],
        label: page.label,
        onSelect: () => onSelectPage(page.id),
      })),
    },
  ];
}

export function getQcafePages(workspace?: QcafeWorkspace): QcafeWorkspacePage[] {
  return workspace?.pages.length ? workspace.pages : fallbackPages;
}

export function QcafeWorkspaceView({ activePageId, connectionState, request, workspace }: QcafeWorkspaceViewProps) {
  const pages = getQcafePages(workspace);
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const providers = workspace?.providers ?? [];

  return (
    <div className="flex min-h-full flex-col gap-8 bg-background px-6 py-6">
      <header className="flex flex-col gap-3 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Q Cafe</Badge>
          <ConnectionBadge state={connectionState} />
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{activePage.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{activePage.description}</p>
        </div>
      </header>

      {activePage.id === "overview" ? (
        <OverviewPage pages={pages} providers={providers} />
      ) : activePage.id === "setup" ? (
        <FoundationSetupPage request={request} />
      ) : activePage.id === "menu" ? (
        <MenuPage request={request} />
      ) : activePage.id === "pos" ? (
        <PosPage request={request} />
      ) : activePage.id === "kot" ? (
        <KotPage request={request} />
      ) : activePage.id === "booking" ? (
        <DiningPage request={request} />
      ) : activePage.id === "billing" ? (
        <BillingPage request={request} />
      ) : activePage.id === "inventory" ? (
        <InventoryPage request={request} />
      ) : activePage.id === "documents" ? (
        <DocumentsPage request={request} />
      ) : activePage.id === "backup" ? (
        <BackupPage request={request} />
      ) : activePage.id === "sync" ? (
        <SyncPage request={request} />
      ) : activePage.id === "marketplace" ? (
        <MarketplacePage request={request} />
      ) : activePage.id === "accounting" ? (
        <AccountingPage request={request} />
      ) : activePage.id === "reports" ? (
        <ReportsPage request={request} />
      ) : (
        <ScaffoldPage page={activePage} />
      )}
    </div>
  );
}

function OverviewPage({ pages, providers }: { pages: QcafeWorkspacePage[]; providers: string[] }) {
  const cafePages = pages.filter((page) => page.id !== "overview");

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {cafePages.map((page) => {
          const Icon = pageIcons[page.id];
          return (
            <div className="grid min-h-36 gap-3 border bg-card p-4" key={page.id}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{page.label}</h2>
                  <p className="text-xs text-muted-foreground">{page.status}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{page.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3">
        <h2 className="text-base font-semibold">API wiring</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          The sidebar and these page scaffold details come from the Q Cafe workspace API.
        </p>
        <div className="flex flex-wrap gap-2">
          {providers.length ? (
            providers.map((provider) => (
              <Badge key={provider} variant="secondary">
                {provider}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">Waiting for API</Badge>
          )}
        </div>
      </section>
    </div>
  );
}

function ScaffoldPage({ page }: { page: QcafeWorkspacePage }) {
  const Icon = pageIcons[page.id];

  return (
    <section className="grid max-w-3xl gap-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-card">
          <Icon className="size-5" />
        </span>
        <div className="grid gap-2">
          <Badge className="w-fit" variant="secondary">
            {page.status}
          </Badge>
          <h2 className="text-xl font-semibold tracking-tight">{page.label} workspace</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This page is ready for the first Q Cafe implementation pass. It is wired to the workspace API and active
            from the MDI menu.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled variant="outline">
          Add first workflow
        </Button>
        <Button disabled variant="ghost">
          Connect data module
        </Button>
      </div>
    </section>
  );
}

function ConnectionBadge({ state }: { state: QcafeWorkspaceViewProps["connectionState"] }) {
  if (state === "connected") return <Badge>API ready</Badge>;
  if (state === "failed") return <Badge variant="destructive">API failed</Badge>;
  return <Badge variant="secondary">Connecting</Badge>;
}

function getFallbackPage(pageId: QcafePageId): QcafeWorkspacePage {
  return fallbackPages.find((page) => page.id === pageId) ?? fallbackPages[0];
}
