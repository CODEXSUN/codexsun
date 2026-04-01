import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  url: string
}

export function Navbar({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <nav className="hidden items-center justify-center gap-1.5 xl:flex">
      {items.map((item) => {
        const isActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)

        return (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "rounded-full px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
