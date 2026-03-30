import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

import { HttpError } from "../auth/auth-api"
import { useAuth } from "../auth/auth-provider"

const stepLabels = ["Details", "OTP", "Password"] as const

export function RequestAccessPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  function goBack() {
    setError(null)
    setStep((current) => Math.max(current - 1, 1))
  }

  async function handleRetryOtp() {
    setError(null)
    setIsWorking(true)

    try {
      const response = await auth.requestRegisterOtp({
        channel: "email",
        destination: form.email.trim().toLowerCase(),
      })
      setVerificationId(response.verificationId)
      setDebugOtp(response.debugOtp)
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to send OTP right now."
      )
    } finally {
      setIsWorking(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (step === 1) {
      setIsWorking(true)

      try {
        const response = await auth.requestRegisterOtp({
          channel: "email",
          destination: form.email.trim().toLowerCase(),
        })
        setVerificationId(response.verificationId)
        setDebugOtp(response.debugOtp)
        setStep(2)
      } catch (nextError) {
        setError(
          nextError instanceof HttpError
            ? nextError.message
            : "Unable to send OTP right now."
        )
      } finally {
        setIsWorking(false)
      }

      return
    }

    if (step === 2) {
      if (!verificationId) {
        setError("Start again and request a new OTP.")
        return
      }

      setIsWorking(true)

      try {
        await auth.verifyRegisterOtp({
          verificationId,
          otp: form.otp.trim(),
        })
        setStep(3)
      } catch (nextError) {
        setError(
          nextError instanceof HttpError
            ? nextError.message
            : "Unable to verify OTP right now."
        )
      } finally {
        setIsWorking(false)
      }

      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Password confirmation does not match.")
      return
    }

    if (!verificationId) {
      setError("Start again and request a new OTP.")
      return
    }

    setIsWorking(true)

    try {
      const response = await auth.register({
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.mobile.trim(),
        password: form.password,
        displayName: form.name.trim(),
        actorType: "staff",
        emailVerificationId: verificationId,
        organizationName: "codexsun",
      })
      const isAdmin =
        response.user.isSuperAdmin || response.user.actorType === "admin"
      setSubmitted(true)
      window.setTimeout(() => {
        void navigate(isAdmin ? "/dashboard/admin" : "/dashboard")
      }, 900)
    } catch (nextError) {
      setError(
        nextError instanceof HttpError
          ? nextError.message
          : "Unable to complete registration right now."
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
            Create account
          </h1>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1
            const isComplete = step > stepNumber || submitted
            const isCurrent = step === stepNumber && !submitted

            return (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isCurrent
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="size-4" /> : stepNumber}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                {stepNumber < stepLabels.length ? (
                  <div className="h-px flex-1 bg-border" />
                ) : null}
              </div>
            )
          })}
        </div>

        {submitted ? (
          <div className="min-h-[19rem] rounded-[1.5rem] border border-border/70 bg-muted/50 px-4 py-5 text-sm leading-6 text-muted-foreground">
            Account registration completed for{" "}
            <span className="font-medium text-foreground">{form.email}</span>.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="min-h-[19rem] rounded-[1.5rem] border border-border/70 bg-background px-5 py-5 shadow-sm">
              {step === 1 ? (
                <div className="flex min-h-[calc(19rem-2.5rem)] flex-col justify-center gap-6 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-name">
                      Name
                    </label>
                    <Input
                      id="request-name"
                      value={form.name}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-email">
                      Email
                    </label>
                    <Input
                      id="request-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-mobile">
                      Mobile number
                    </label>
                    <Input
                      id="request-mobile"
                      value={form.mobile}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          mobile: event.target.value,
                        }))
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="flex min-h-[calc(19rem-2.5rem)] flex-col justify-center gap-6 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {form.email || "name@example.com"}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleRetryOtp()}>
                      Retry OTP
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-otp">
                      Enter OTP
                    </label>
                    <Input
                      id="request-otp"
                      value={form.otp}
                      className="h-12 text-lg md:text-lg"
                      placeholder="Enter OTP"
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          otp: event.target.value,
                        }))
                      }}
                    />
                    {debugOtp ? (
                      <p className="text-xs text-muted-foreground">
                        Debug OTP: <span className="font-medium text-foreground">{debugOtp}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="flex min-h-[calc(19rem-2.5rem)] flex-col justify-center gap-6 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-password">
                      Password
                    </label>
                    <Input
                      id="request-password"
                      type="password"
                      value={form.password}
                      placeholder="Create your password"
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="request-confirm-password">
                      Confirm password
                    </label>
                    <Input
                      id="request-confirm-password"
                      type="password"
                      value={form.confirmPassword}
                      placeholder="Confirm your password"
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button type="button" variant="outline" size="lg" className="gap-2 rounded-full" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step === 1 ? (
                <Button type="submit" size="lg" className="gap-2 rounded-full">
                  {isWorking ? "Sending OTP..." : "Continue to send OTP"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}

              {step === 2 ? (
                <Button type="submit" size="lg" className="gap-2 rounded-full">
                  {isWorking ? "Verifying OTP..." : "Continue"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}

              {step === 3 ? (
                <Button type="submit" size="lg" className="gap-2 rounded-full">
                  {isWorking ? "Registering..." : "Register"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
