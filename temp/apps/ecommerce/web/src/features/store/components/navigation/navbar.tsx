import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  url: string
}

export function Navbar({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
      {items.map((item) => {
        const isActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)

        return (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "min-w-28 rounded-full px-4 py-2 text-center text-sm font-medium transition",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
