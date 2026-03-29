import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AppBrand } from "./app-brand"

type PublicTopbarProps = {
  className?: string
}

const portfolioLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#apps", label: "Apps" },
  { href: "/#contact", label: "Contact" },
]

export function PublicTopbar({ className }: PublicTopbarProps) {
  return (
    <header
      className={cn(
        "border-b border-border/70 bg-background/85 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <AppBrand compact />
        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            {portfolioLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login?variant=desktop">Desktop</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
