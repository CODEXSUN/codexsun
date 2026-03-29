import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [email, setEmail] = useState("admin@codexsun.local")
  const [password, setPassword] = useState("")
  const [actorType, setActorType] = useState<"platform-admin" | "operator">(
    "platform-admin"
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isSuperAdmin = actorType === "platform-admin"

    onLogin({
      actorType,
      displayName: isSuperAdmin ? "Admin Operator" : "Workspace Operator",
      email,
      isSuperAdmin,
    })

    void navigate(isSuperAdmin ? "/dashboard/admin" : "/dashboard")
  }

  return (
    <AuthLayout variant={variant}>
      <Card className="border-none bg-transparent shadow-none ring-0">
        <CardHeader className="px-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {variant === "desktop" ? "Desktop Variant" : "Web Variant"}
          </p>
          <CardTitle className="text-3xl">
            Sign in to continue to the dashboard
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            This is the current shell handoff. Sign in as admin to open the admin
            dashboard, or continue as operator for the standard workspace desk.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 px-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Dashboard mode</span>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    actorType === "platform-admin"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground"
                  }`}
                  onClick={() => {
                    setActorType("platform-admin")
                  }}
                >
                  <p className="font-semibold">Admin</p>
                  <p className="mt-1 text-sm opacity-80">
                    Opens the admin dashboard with framework oversight.
                  </p>
                </button>
                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    actorType === "operator"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground"
                  }`}
                  onClick={() => {
                    setActorType("operator")
                  }}
                >
                  <p className="font-semibold">Operator</p>
                  <p className="mt-1 text-sm opacity-80">
                    Opens the standard workspace dashboard.
                  </p>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" type="submit">
                Login
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
