import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

import { HttpError } from "../auth/auth-api"
import { useAuth } from "../auth/auth-context"

export function PasswordSetupPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verificationId = searchParams.get("verificationId")?.trim() ?? ""
  const token = searchParams.get("token")?.trim() ?? ""
  const hasValidLink = verificationId.length > 0 && token.length > 0
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const title =
    searchParams.get("intent") === "reset" ? "Reset password" : "Create password"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasValidLink) {
      setError("This password link is incomplete. Request a new email and try again.")
      return
    }

    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.")
      return
    }

    setError(null)
    setIsWorking(true)

    try {
      await auth.completePasswordLink({
        verificationId,
        token,
        newPassword: password,
      })
      setIsSubmitted(true)
      window.setTimeout(() => {
        void navigate("/login", { replace: true })
      }, 900)
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to set the password right now."
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
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Choose a new password to activate access from this secure email link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
            Password updated. Redirecting you to login.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!hasValidLink ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                This password link is invalid or incomplete.
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password-setup-password">
                Password
              </label>
              <Input
                id="password-setup-password"
                type="password"
                value={password}
                placeholder="Create your password"
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password-setup-confirm">
                Confirm password
              </label>
              <Input
                id="password-setup-confirm"
                type="password"
                value={confirmPassword}
                placeholder="Confirm your password"
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                }}
              />
            </div>
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={!hasValidLink || isWorking}>
              {isWorking ? "Saving password..." : "Save password"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Back to{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
