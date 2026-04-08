import { ArrowLeft, ArrowRight, CheckCircle2, MailCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { StorefrontLayout } from "../components/storefront-layout"
import { consumeStorefrontPostAuthRedirect } from "../lib/storefront-auth-redirect"
import { storefrontPaths } from "../lib/storefront-routes"

const stepLabels = ["Details", "OTP", "Password"] as const
const OTP_SUCCESS_ADVANCE_DELAY_MS = 900

const stepDescriptions = {
  1: {
    eyebrow: "Customer details",
    title: "Start with your identity",
    description: "Use your name, email, and mobile number to begin a verified customer account.",
  },
  2: {
    eyebrow: "Email verification",
    title: "Confirm your inbox",
    description: "Enter the one-time password sent to your email address before creating the account.",
  },
  3: {
    eyebrow: "Password setup",
    title: "Complete your account",
    description: "Set your password and confirm it to finish creating your customer account.",
  },
} as const

export function StorefrontAccountRegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const [step, setStep] = useState(1)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [isOtpConfirmed, setIsOtpConfirmed] = useState(false)
  const [formState, setFormState] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const locationState =
    typeof location.state === "object" && location.state
      ? (location.state as { postAuthPath?: string | null })
      : null
  const postAuthPath =
    typeof locationState?.postAuthPath === "string"
      ? locationState.postAuthPath
      : null
  const activeStep = stepDescriptions[step as keyof typeof stepDescriptions]
  const otpAdvanceTimeoutRef = useRef<number | null>(null)
  const otpSlotClassName = `size-12 text-base md:size-14 md:text-lg ${
    isOtpConfirmed
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-200"
      : ""
  }`

  useEffect(() => {
    return () => {
      if (otpAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(otpAdvanceTimeoutRef.current)
      }
    }
  }, [])

  function updateField<Key extends keyof typeof formState>(
    key: Key,
    value: (typeof formState)[Key]
  ) {
    if (key === "otp" && isOtpConfirmed) {
      setIsOtpConfirmed(false)
    }

    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSendOtp() {
    if (otpAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(otpAdvanceTimeoutRef.current)
      otpAdvanceTimeoutRef.current = null
    }

    setIsOtpConfirmed(false)
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await customerAuth.requestRegisterOtp({
        email: formState.email,
        displayName: formState.displayName,
      })
      setVerificationId(response.verificationId)
      setDebugOtp(response.debugOtp)
      setStep(2)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to send email verification OTP."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyOtp() {
    if (!verificationId) {
      setError("Start again and request a new OTP.")
      return
    }

    if (otpAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(otpAdvanceTimeoutRef.current)
      otpAdvanceTimeoutRef.current = null
    }

    setIsSubmitting(true)
    setError(null)
    let shouldAdvance = false

    try {
      await customerAuth.verifyRegisterOtp({
        verificationId,
        otp: formState.otp,
      })
      setIsOtpConfirmed(true)
      shouldAdvance = true
      otpAdvanceTimeoutRef.current = window.setTimeout(() => {
        setIsOtpConfirmed(false)
        setStep(3)
        setIsSubmitting(false)
        otpAdvanceTimeoutRef.current = null
      }, OTP_SUCCESS_ADVANCE_DELAY_MS)
    } catch (submitError) {
      setIsOtpConfirmed(false)
      setError(
        submitError instanceof Error ? submitError.message : "Failed to verify OTP."
      )
    } finally {
      if (!shouldAdvance) {
        setIsSubmitting(false)
      }
    }
  }

  async function handleRegister() {
    if (!verificationId) {
      setError("Verify your email before creating the customer account.")
      return
    }

    if (!formState.password.trim()) {
      setError("Enter a password to create the customer account.")
      return
    }

    if (formState.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (formState.password !== formState.confirmPassword) {
      setError("Password and confirm password must match.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await customerAuth.register({
        displayName: formState.displayName,
        email: formState.email,
        phoneNumber: formState.phoneNumber,
        password: formState.password,
        emailVerificationId: verificationId,
        companyName: null,
        gstin: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        country: null,
        pincode: null,
      })
      void navigate(
        postAuthPath ??
          consumeStorefrontPostAuthRedirect() ??
          storefrontPaths.account(),
        { replace: true }
      )
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create customer account."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="mx-auto w-full max-w-3xl px-5 py-10 md:py-14">
        <div className="space-y-6 rounded-[2rem] border border-border/70 bg-background/92 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Customer sign up
          </p>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-semibold tracking-tight text-foreground">
              Create account
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Set up your customer account in three steps with email verification before checkout access.
            </p>
          </div>
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
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                {stepNumber < stepLabels.length ? <div className="h-px flex-1 bg-border" /> : null}
              </div>
            )
          })}
        </div>

        <form className="space-y-4" onSubmit={(event) => void event.preventDefault()}>
          <div className="rounded-[1.5rem] border border-border/70 bg-background px-5 py-5 shadow-sm">
            <div className="space-y-1 pb-4 text-center">
              <p className="text-lg font-semibold text-foreground">{activeStep.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{activeStep.description}</p>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="min-h-[18rem] rounded-[1.5rem] border border-border/70 bg-background px-4 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              {step === 1 ? (
                <div className="flex min-h-[calc(18rem-2.5rem)] flex-col justify-center gap-6 py-2">
                  {(
                    [
                      ["displayName", "Name"],
                      ["email", "Email"],
                      ["phoneNumber", "Mobile number"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`customer-register-${key}`}>{label}</Label>
                      <Input
                        id={`customer-register-${key}`}
                        type={key === "email" ? "email" : "text"}
                        value={formState[key]}
                        placeholder=""
                        onChange={(event) => updateField(key, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="flex min-h-[calc(18rem-2.5rem)] flex-col justify-center gap-6 py-2">
                  <div
                    className={`rounded-[1.2rem] border p-4 transition-colors duration-300 ${
                      isOtpConfirmed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border/70 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-full border p-2 transition-colors duration-300 ${
                          isOtpConfirmed
                            ? "border-emerald-200 bg-white text-emerald-600"
                            : "border-border/70 bg-background text-muted-foreground"
                        }`}
                      >
                        {isOtpConfirmed ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <MailCheck className="size-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className={`font-medium ${isOtpConfirmed ? "text-emerald-700" : "text-foreground"}`}>
                          {isOtpConfirmed ? "OTP verified successfully" : "OTP sent to your email"}
                        </p>
                        <p
                          className={`text-sm leading-6 ${
                            isOtpConfirmed ? "text-emerald-700/90" : "text-muted-foreground"
                          }`}
                        >
                          {isOtpConfirmed
                            ? "Your email is confirmed. Moving you to the password step."
                            : `Use the code sent to ${formState.email || "name@example.com"} to verify your email and continue.`}
                        </p>
                        {debugOtp ? (
                          <p
                            className={`text-xs ${
                              isOtpConfirmed ? "text-emerald-700/80" : "text-muted-foreground"
                            }`}
                          >
                            Debug OTP: <span className="font-medium text-foreground">{debugOtp}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <Label htmlFor="customer-register-otp">Enter OTP</Label>
                    <InputOTP
                      id="customer-register-otp"
                      maxLength={6}
                      value={formState.otp}
                      onChange={(value) => updateField("otp", value)}
                      containerClassName="justify-center gap-3"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className={otpSlotClassName} />
                        <InputOTPSlot index={1} className={otpSlotClassName} />
                        <InputOTPSlot index={2} className={otpSlotClassName} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className={otpSlotClassName} />
                        <InputOTPSlot index={4} className={otpSlotClassName} />
                        <InputOTPSlot index={5} className={otpSlotClassName} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSendOtp()}
                      disabled={isSubmitting}
                    >
                      Retry OTP
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mx-auto flex min-h-[calc(18rem-2.5rem)] w-full max-w-md flex-col justify-center gap-5 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer-register-password">Password</Label>
                    <Input
                      id="customer-register-password"
                      type="password"
                      value={formState.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-register-confirm-password">Confirm password</Label>
                    <Input
                      id="customer-register-confirm-password"
                      type="password"
                      value={formState.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-full"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step === 1 ? (
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 rounded-full"
                  onClick={() => void handleSendOtp()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending OTP..." : "Continue to send OTP"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
              {step === 2 ? (
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 rounded-full"
                  onClick={() => void handleVerifyOtp()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Verifying OTP..." : "Continue"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
              {step === 3 ? (
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 rounded-full"
                  onClick={() => void handleRegister()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create account"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to={storefrontPaths.accountLogin()}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </StorefrontLayout>
  )
}
