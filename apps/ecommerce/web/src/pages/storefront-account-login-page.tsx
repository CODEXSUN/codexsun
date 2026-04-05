import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "@cxapp/web/src/auth/auth-surface"

import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontAccountLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath =
    new URLSearchParams(location.search).get("next") ?? storefrontPaths.account()

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await auth.login({
        email: email.trim().toLowerCase(),
        password,
      })
      void navigate(
        isCustomerSurfaceUser(response.user)
          ? nextPath
          : resolveAuthenticatedHomePath(response.user),
        { replace: true }
      )
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to sign in."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid min-h-[70vh] w-full max-w-xl place-items-center px-5 py-10">
        <Card className="w-full rounded-[2rem] border-border/70 py-0 shadow-lg">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Customer portal
            </p>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
              Sign in
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="rounded-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <Link
                to={storefrontPaths.accountRegister()}
                className="text-foreground underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  )
}
