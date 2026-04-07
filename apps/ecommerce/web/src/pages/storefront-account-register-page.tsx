import { ArrowLeft, ArrowRight, CheckCircle2, MailCheck } from "lucide-react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { StorefrontLayout } from "../components/storefront-layout"
import { consumeStorefrontPostAuthRedirect } from "../lib/storefront-auth-redirect"
import { storefrontPaths } from "../lib/storefront-routes"

const stepLabels = ["Details", "Verify", "Profile"] as const

export function StorefrontAccountRegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const [step, setStep] = useState(1)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    otp: "",
    password: "",
    companyName: "",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
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

  function updateField<Key extends keyof typeof formState>(
    key: Key,
    value: (typeof formState)[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSendOtp() {
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

    setIsSubmitting(true)
    setError(null)

    try {
      await customerAuth.verifyRegisterOtp({
        verificationId,
        otp: formState.otp,
      })
      setStep(3)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to verify OTP."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegister() {
    if (!verificationId) {
      setError("Verify your email before creating the customer account.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await customerAuth.register({
        ...formState,
        emailVerificationId: verificationId,
        companyName: formState.companyName || null,
        gstin: formState.gstin || null,
        addressLine2: formState.addressLine2 || null,
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
      <div className="mx-auto grid min-h-[70vh] w-full max-w-4xl place-items-center px-5 py-10">
        <Card className="w-full rounded-[2rem] border-border/70 py-0 shadow-lg">
          <CardHeader className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Customer registration
            </p>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1
                const isComplete = step > stepNumber
                const isCurrent = step === stepNumber

                return (
                  <div key={label} className="flex min-w-0 items-center gap-3">
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
                  </div>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ["displayName", "Full name"],
                    ["email", "Email"],
                    ["phoneNumber", "Phone number"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={`customer-register-${key}`}>{label}</Label>
                    <Input
                      id={`customer-register-${key}`}
                      type={key === "email" ? "email" : "text"}
                      value={formState[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full border border-border/70 bg-background p-2">
                      <MailCheck className="size-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Verify your email</p>
                      <p className="text-sm text-muted-foreground">
                        We sent a six-digit OTP to {formState.email}.
                      </p>
                      {debugOtp ? (
                        <p className="text-xs text-muted-foreground">
                          Debug OTP: <span className="font-medium text-foreground">{debugOtp}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-register-otp">Email OTP</Label>
                  <InputOTP
                    id="customer-register-otp"
                    maxLength={6}
                    value={formState.otp}
                    onChange={(value) => updateField("otp", value)}
                    containerClassName="justify-start"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ["password", "Password"],
                    ["companyName", "Company name"],
                    ["gstin", "GSTIN"],
                    ["addressLine1", "Address line 1"],
                    ["addressLine2", "Address line 2"],
                    ["city", "City"],
                    ["state", "State"],
                    ["country", "Country"],
                    ["pincode", "Pincode"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className={
                      key === "addressLine1" || key === "addressLine2" ? "md:col-span-2" : ""
                    }
                  >
                    <Label htmlFor={`customer-register-${key}`}>{label}</Label>
                    <Input
                      id={`customer-register-${key}`}
                      type={key === "password" ? "password" : "text"}
                      value={formState[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={storefrontPaths.accountLogin()}
                  className="text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
              <div className="flex items-center justify-end gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 rounded-full"
                    onClick={() => setStep((current) => Math.max(1, current - 1))}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                ) : null}
                {step === 1 ? (
                  <Button
                    className="gap-2 rounded-full"
                    onClick={() => void handleSendOtp()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending OTP..." : "Continue"}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : null}
                {step === 2 ? (
                  <Button
                    className="gap-2 rounded-full"
                    onClick={() => void handleVerifyOtp()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying..." : "Verify OTP"}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : null}
                {step === 3 ? (
                  <Button
                    className="gap-2 rounded-full"
                    onClick={() => void handleRegister()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create account"}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  )
}
