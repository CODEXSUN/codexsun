import { Link, Outlet, useLocation } from "react-router-dom";
import { ScrollArea } from "@ui/components/ui/scroll-area";
import { cn } from "@ui/lib/utils";

const NAV_ITEMS = [
  { title: "Introduction", href: "/" },
  { title: "Button", href: "/button" },
  { title: "Badge", href: "/badge" },
  { title: "Card", href: "/card" },
  { title: "Input", href: "/input" },
];

export function DocsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold sm:inline-block">UI</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-4 md:px-8">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block border-r border-border pr-6">
          <ScrollArea className="h-full py-6 pr-6 lg:py-8">
            <div className="w-full">
              <div className="pb-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">Components</h4>
                <div className="grid grid-flow-row auto-rows-max text-sm">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground",
                        pathname === item.href && "font-medium text-foreground underline"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0 pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
