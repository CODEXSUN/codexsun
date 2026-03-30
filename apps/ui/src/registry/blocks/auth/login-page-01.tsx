import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage01() {
  return (
    <div className="theme-preview-surface grid gap-4 rounded-[1.5rem] border border-border/70 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="flex min-h-[320px] flex-col justify-between rounded-[1.25rem] border border-border/70 bg-card/80 p-5">
        <div className="space-y-3">
          <Badge variant="outline">Codexsun Workspace</Badge>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to continue
            </h2>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Access your projects, governed design defaults, and reusable
              registry blocks from one workspace shell.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Design defaults</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared component names and variants stay aligned across projects.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Registry blocks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start pages from reusable login, form, and workspace patterns.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Welcome back</h3>
            <p className="text-sm text-muted-foreground">
              Use your workspace credentials or continue with SSO.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="login-page-email">Email</Label>
              <Input
                id="login-page-email"
                type="email"
                placeholder="team@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-page-password">Password</Label>
              <Input id="login-page-password" type="password" />
            </div>
          </div>
          <Button className="w-full">Sign in</Button>
          <Separator />
          <Button variant="outline" className="w-full">
            Continue with SSO
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
