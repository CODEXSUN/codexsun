import { LogInIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { getPortalHomeHref } from "@framework-core/web/auth/lib/portal-routing"
import { BrandMark } from "@/shared/branding/brand-mark"
import { Navbar } from "@/features/marketing/components/navigation/navbar"
import { PortfolioMobileMenu } from "@/features/marketing/components/navigation/portfolio-mobile-menu"
import { ThemeSwitcher } from "@/shared/theme/theme-switcher"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Home", url: "/" },
  { title: "About", url: "/about" },
  { title: "Services", url: "/services" },
  { title: "Projects", url: "/projects" },
  { title: "Templates", url: "/templates" },
  { title: "Team", url: "/team" },
  { title: "Bio", url: "/bio" },
  { title: "Enquiry", url: "/enquiry" },
  { title: "Contact", url: "/contact" },
]

export function PortfolioHeader() {
  const auth = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6">
        <PortfolioMobileMenu links={navItems} />
        <Link to="/" className="shrink-0">
          <BrandMark compact />
        </Link>

        <div className="hidden flex-1 justify-center lg:flex">
          <Navbar items={navItems} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to={getPortalHomeHref(auth.session?.user)}
            className={cn(
              buttonVariants({ className: "rounded-full px-4" }),
              "bg-accent text-accent-foreground hover:bg-accent-light",
            )}
          >
            <LogInIcon className="size-4" />
            {auth.isAuthenticated ? "Dashboard" : "Login"}
          </Link>
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}

