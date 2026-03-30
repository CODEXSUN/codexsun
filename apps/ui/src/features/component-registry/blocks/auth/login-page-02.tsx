import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage02() {
  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(245,245,244,0.86)_100%)] p-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <Badge variant="outline">Workspace Access</Badge>
            <h2 className="pt-2 text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in to continue with governed defaults, shared blocks, and your
              current delivery workspace.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="login-page-02-email">Email</Label>
              <Input
                id="login-page-02-email"
                type="email"
                placeholder="team@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-page-02-password">Password</Label>
              <Input id="login-page-02-password" type="password" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Checkbox id="login-page-02-remember" />
              <Label
                htmlFor="login-page-02-remember"
                className="text-sm font-medium text-foreground"
              >
                Keep me signed in
              </Label>
            </div>
            <Button variant="link" className="h-auto px-0">
              Forgot password
            </Button>
          </div>

          <Button className="w-full">Sign in</Button>
          <Separator />
          <Button variant="outline" className="w-full">
            Continue with SSO
          </Button>
        </CardContent>
      </Card>

      <div className="flex min-h-[340px] flex-col justify-between rounded-[1.25rem] border border-border/70 bg-card/80 p-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Why this block
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            A stronger login surface for multi-project products
          </h3>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            This variant keeps the credential form compact and gives the product
            room to explain context, trust, and shared design-system rules.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Governed defaults</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Project component names and default variants stay predictable for
              every implementation pass.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Reusable blocks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Teams can start from approved page patterns instead of rebuilding
              auth and forms every time.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Future-ready layout</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The split composition works for workspace, partner, and enterprise
              entry pages without changing the shared system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
