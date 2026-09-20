import type { MdiNavigationSection } from "@codexsun/ui/layouts/main-workspace";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { BookOpenIcon, CalendarClockIcon, ChefHatIcon, LayoutDashboardIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import type { QcafePageId, QcafeWorkspace, QcafeWorkspacePage } from "./qcafe-api";
import { FoundationSetupPage } from "./foundation-setup-page";
import { MenuPage } from "./menu-page";

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
    status: "Scaffold",
    title: "Point of sale",
  },
  {
    description: "Track kitchen order tickets and preparation state.",
    id: "kot",
    label: "KOT",
    status: "Scaffold",
    title: "Kitchen order tickets",
  },
  {
    description: "Manage table reservations and seated visits.",
    id: "booking",
    label: "Booking",
    status: "Scaffold",
    title: "Table booking",
  },
];

const pageIcons = {
  booking: CalendarClockIcon,
  kot: ChefHatIcon,
  menu: BookOpenIcon,
  overview: LayoutDashboardIcon,
  pos: ReceiptTextIcon,
  setup: StoreIcon,
} as const;

export function createQcafeNavigation(
  activePageId: QcafePageId,
  pages: QcafeWorkspacePage[],
  onSelectPage: (pageId: QcafePageId) => void,
): MdiNavigationSection[] {
  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const overview = pageMap.get("overview") ?? fallbackPages[0];
  const setup = pageMap.get("setup") ?? getFallbackPage("setup");
  const cafePages = (["pos", "kot", "booking"] as const).map(
    (pageId) => pageMap.get(pageId) ?? getFallbackPage(pageId),
  );

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
