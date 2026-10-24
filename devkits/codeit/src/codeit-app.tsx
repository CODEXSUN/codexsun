import { useEffect, useState } from "react";
import { Code2Icon, LayoutDashboardIcon, Settings2Icon } from "lucide-react";
import {
  AppLayout,
  AppHeader,
  SideMenu,
  StatusBar,
  TopMenu,
  WorkspaceCanvas,
  mainLayoutTechnicalNames
} from "@codexsun/ui/layouts/main-layouts";
import { CodeitOverview, CodeitSettings } from "./modules/overview";

export function CodeitApp() {
  const [page, setPage] = useState(pageFromLocation);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const title = page === "settings" ? "Settings" : "Overview";
  const user = { name: "Local developer", email: "Standalone workspace", fallback: "CI" };

  useEffect(() => {
    const onPopState = () => setPage(pageFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function selectPage(next: "overview" | "settings") {
    window.history.pushState(null, "", `/codeit/${next}`);
    setPage(next);
    setSearchOpen(false);
    setSearch("");
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  const navigation = [
    {
      label: "Codeit",
      icon: Code2Icon,
      items: [
        { label: "Overview", icon: LayoutDashboardIcon, onSelect: () => selectPage("overview") },
        { label: "Settings", icon: Settings2Icon, onSelect: () => selectPage("settings") }
      ]
    }
  ];

  return (
    <AppLayout className="h-dvh [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <div data-technical-name={mainLayoutTechnicalNames.topMenu}>
        <TopMenu
          applicationName="Codeit"
          appItems={[
            {
              title: "Codeit",
              description: "Standalone development workspace",
              icon: Code2Icon,
              active: true,
              onSelect: () => selectPage("overview")
            }
          ]}
          notifications={[]}
          user={user}
          onProfile={() => selectPage("settings")}
          search={search}
          searchOpen={searchOpen}
          searchPlaceholder="Search Codeit pages..."
          onSearchChange={setSearch}
          onOpenSearch={() => setSearchOpen(true)}
          onCloseSearch={() => {
            setSearchOpen(false);
            setSearch("");
          }}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          searchItems={navigation[0]!.items.map((item) => ({
            label: item.label,
            icon: item.icon,
            onSelect: item.onSelect
          }))}
        />
      </div>
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen ? (
          <div
            data-technical-name={mainLayoutTechnicalNames.sideBar}
            className="absolute inset-y-0 left-0 z-20 flex bg-background shadow-lg md:static md:shadow-none"
          >
            <SideMenu
              navigation={navigation}
              onSelect={(label) => selectPage(label === "Settings" ? "settings" : "overview")}
              search=""
              selected={title}
              workspaceTitle="Overview"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div data-technical-name={mainLayoutTechnicalNames.appHeader}>
            <AppHeader
              breadcrumbs={[{ label: title }]}
              homeHref="/codeit/overview"
              name={user.name}
            />
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            data-technical-name={mainLayoutTechnicalNames.workspace}
          >
            <WorkspaceCanvas>
              <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
                {page === "settings" ? (
                  <CodeitSettings standaloneUrl={window.location.origin} />
                ) : (
                  <CodeitOverview onOpenSettings={() => selectPage("settings")} />
                )}
              </div>
            </WorkspaceCanvas>
          </div>
        </div>
      </div>
      <div data-technical-name={mainLayoutTechnicalNames.statusBar}>
        <StatusBar status="Local shell · No data connection" workspace={title} />
      </div>
    </AppLayout>
  );
}

function pageFromLocation(): "overview" | "settings" {
  return window.location.pathname === "/codeit/settings" ? "settings" : "overview";
}
