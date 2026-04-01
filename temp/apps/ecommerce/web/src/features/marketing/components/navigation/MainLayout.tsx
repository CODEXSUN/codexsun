import { Outlet } from "react-router-dom"

import { FloatingContactButton } from "@/components/shared/floating-contact-button"
import { PortfolioFooter } from "./portfolio-footer"
import { PortfolioHeader } from "./portfolio-header"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef3f9,transparent_35%),linear-gradient(180deg,#fbfcfd_0%,#eef3f7_100%)] text-foreground">
      <PortfolioHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <PortfolioFooter />
      <FloatingContactButton />
    </div>
  )
}
