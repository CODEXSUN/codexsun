import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Forgot password
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your email and we will send a reset link when the auth service is connected.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
            Reset instructions have been staged for <span className="font-medium text-foreground">{email}</span>.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
                Email
              </label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                placeholder="name@example.com"
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
