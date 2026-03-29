import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import type { AppSuite } from "@framework/application/app-manifest"

import { Button } from "@/components/ui/button"

import PublicShell from "../../layouts/public-shell"
import WorkspaceShell from "../../layouts/workspace-shell"

type HomePageProps = {
  appSuite: AppSuite
}

function HomePage({ appSuite }: HomePageProps) {
  return (
    <PublicShell appCount={appSuite.apps.length}>
      <WorkspaceShell
        eyebrow="codexsun"
        title="Business software, made to work together."
      >
        <section className="max-w-3xl space-y-6 lg:col-span-2">
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Codexsun delivers online shopping ecommerce, CRM, HRMS, accounts,
            and integrations in one connected platform. This framework desk
            opens every workspace from one shared shell.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" asChild>
              <Link to="/login">
                Login
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login?variant=desktop">Desktop Variant</Link>
            </Button>
          </div>
        </section>
      </WorkspaceShell>
    </PublicShell>
  )
}

export default HomePage
