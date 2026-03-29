import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

type LoginPageProps = {
  onLogin: (payload: {
    actorType: "platform-admin" | "operator"
    displayName: string
    email: string
    isSuperAdmin: boolean
  }) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const variant = searchParams.get("variant") === "desktop" ? "desktop" : "web"
  const next = searchParams.get("next")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const isSuperAdmin =
      normalizedEmail.startsWith("admin@") || normalizedEmail.includes("admin")
    const actorType = isSuperAdmin ? "platform-admin" : "operator"

    onLogin({
      actorType,
      displayName: isSuperAdmin ? "Admin Operator" : "Workspace Operator",
      email: normalizedEmail,
      isSuperAdmin,
    })

    void navigate(next ?? (isSuperAdmin ? "/dashboard/admin" : "/dashboard"))
  }

  return (
    <AuthLayout variant={variant}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Welcome
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Access your workspace securely.
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
          <Button type="submit" size="lg" className="mt-2 w-full gap-2">
            Login
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link
            to="/request-access"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Request access
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
