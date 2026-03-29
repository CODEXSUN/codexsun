import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/AuthLayout"

const stepLabels = ["Details", "OTP", "Password"] as const

export function RequestAccessPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [submitted, setSubmitted] = useState(false)

  function goNext() {
    setStep((current) => Math.min(current + 1, 3))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step < 3) {
      goNext()
      return
    }

    setSubmitted(true)
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
            const isComplete = step > stepNumber
            const isCurrent = step === stepNumber

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
            Account registration staged for{" "}
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
                    <Button type="button" variant="outline" size="sm">
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
                  </div>
                  <Button type="button" className="w-full" onClick={goNext}>
                    Verify email OTP
                  </Button>
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
                  Continue to send OTP
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}

              {step === 2 ? (
                <Button type="submit" size="lg" className="gap-2 rounded-full">
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}

              {step === 3 ? (
                <Button type="submit" size="lg" className="gap-2 rounded-full">
                  Register
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
