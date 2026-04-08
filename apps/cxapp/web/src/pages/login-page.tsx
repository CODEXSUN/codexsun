import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

import { HttpError } from "../auth/auth-api"
import { useAuth } from "../auth/auth-context"
import { resolvePostAuthPath } from "../auth/auth-surface"

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const variant = searchParams.get("variant") === "desktop" ? "desktop" : "web"
  const next = searchParams.get("next")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await auth.login({
        email: email.trim().toLowerCase(),
        password,
      })
      if (next) {
        void navigate(resolvePostAuthPath(response.user, next))
      }
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to sign in right now."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout variant={variant}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Welcome
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use one sign in for customer, staff, and admin access. Customer registration happens on the storefront, and staff or admin access is provisioned by your administrator.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              placeholder="name@example.com"
              onChange={(event) => {
                setEmail(event.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(event) => {
                setPassword(event.target.value)
              }}
            />
          </div>
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button type="submit" size="lg" className="mt-2 w-full gap-2">
            {isSubmitting ? "Signing in..." : "Login"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
