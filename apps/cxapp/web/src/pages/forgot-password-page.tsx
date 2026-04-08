import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

import { HttpError } from "../auth/auth-api"
import { useAuth } from "../auth/auth-context"

export function ForgotPasswordPage() {
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [debugUrl, setDebugUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsWorking(true)

    try {
      const response = await auth.requestPasswordResetLink({
        email: email.trim().toLowerCase(),
      })
      setDebugUrl(response.debugUrl)
      setIsSubmitted(true)
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to send the reset link right now."
      )
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Forgot password
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your email and we&apos;ll send a secure password reset link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/40 px-4 py-4 text-sm leading-6 text-muted-foreground">
            <p>
              If an active account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>, the
              reset email is on its way.
            </p>
            {debugUrl ? (
              <p>
                Debug link:{" "}
                <a
                  href={debugUrl}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Open password setup
                </a>
              </p>
            ) : null}
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleRequest}>
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
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button type="submit" size="lg" className="w-full">
              {isWorking ? "Sending reset link..." : "Send reset link"}
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
