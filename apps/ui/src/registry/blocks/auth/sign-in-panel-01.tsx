import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignInPanel01() {
  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Continue with the project defaults.
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sign-in-panel-email">Email</Label>
            <Input
              id="sign-in-panel-email"
              type="email"
              placeholder="team@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-in-panel-password">Password</Label>
            <Input id="sign-in-panel-password" type="password" />
          </div>
        </div>
        <Button className="w-full">Sign in</Button>
        <Separator />
        <Button variant="outline" className="w-full">
          Sign in with SSO
        </Button>
      </CardContent>
    </Card>
  )
}
