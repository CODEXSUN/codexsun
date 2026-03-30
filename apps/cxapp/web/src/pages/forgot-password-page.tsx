import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

import { HttpError } from "../auth/auth-api"
import { useAuth } from "../auth/auth-context"

export function ForgotPasswordPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<"password-reset" | "account-recovery">(
    "password-reset"
  )
  const [step, setStep] = useState<"request" | "confirm" | "done">("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsWorking(true)

    try {
      if (mode === "password-reset") {
        const response = await auth.requestPasswordResetOtp({
          email: email.trim().toLowerCase(),
        })
        setVerificationId(response.verificationId)
        setDebugOtp(response.debugOtp)
      } else {
        const response = await auth.requestAccountRecoveryOtp({
          email: email.trim().toLowerCase(),
        })
        setVerificationId(response.verificationId)
        setDebugOtp(response.debugOtp)
      }

      setStep("confirm")
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to continue right now."
      )
    } finally {
      setIsWorking(false)
    }
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!verificationId) {
      setError("Request a new OTP and try again.")
      return
    }

    setError(null)
    setIsWorking(true)

    try {
      if (mode === "password-reset") {
        await auth.confirmPasswordReset({
          email: email.trim().toLowerCase(),
          verificationId,
          otp: otp.trim(),
          newPassword,
        })
      } else {
        await auth.restoreAccount({
          email: email.trim().toLowerCase(),
          verificationId,
          otp: otp.trim(),
        })
      }

      setStep("done")
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to complete the request right now."
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
            {mode === "password-reset" ? "Forgot password" : "Recover account"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {mode === "password-reset"
              ? "Request an OTP and confirm your new password."
              : "Request an OTP to restore a disabled account."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-muted/30 p-1">
          <Button
            type="button"
            variant={mode === "password-reset" ? "default" : "ghost"}
            onClick={() => {
              setMode("password-reset")
              setStep("request")
              setError(null)
            }}
          >
            Password reset
          </Button>
          <Button
            type="button"
            variant={mode === "account-recovery" ? "default" : "ghost"}
            onClick={() => {
              setMode("account-recovery")
              setStep("request")
              setError(null)
            }}
          >
            Account recovery
          </Button>
        </div>

        {step === "done" ? (
          <div className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
            {mode === "password-reset" ? "Password updated" : "Account restored"} for{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </div>
        ) : step === "request" ? (
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
              {isWorking ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleConfirm}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="forgot-otp">
                OTP
              </label>
              <Input
                id="forgot-otp"
                value={otp}
                placeholder="Enter OTP"
                onChange={(event) => {
                  setOtp(event.target.value)
                }}
              />
              {debugOtp ? (
                <p className="text-xs text-muted-foreground">
                  Debug OTP: <span className="font-medium text-foreground">{debugOtp}</span>
                </p>
              ) : null}
            </div>
            {mode === "password-reset" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="forgot-password">
                  New password
                </label>
                <Input
                  id="forgot-password"
                  type="password"
                  value={newPassword}
                  placeholder="Enter new password"
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                  }}
                />
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button type="submit" size="lg" className="w-full">
              {isWorking
                ? mode === "password-reset"
                  ? "Updating password..."
                  : "Restoring account..."
                : mode === "password-reset"
                  ? "Confirm reset"
                  : "Restore account"}
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
