import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { clearRequestedPath, getAuthNavigationState, getRequestedPath } from '@framework-core/web/auth/lib/navigation-state'
import { resolveAuthorizedPath } from '@framework-core/web/auth/lib/portal-routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestRegisterOtp, verifyRegisterOtp } from '@/shared/api/client'
import { showErrorToast, showSuccessToast, showWarningToast } from '@/shared/notifications/toast'
import { cn } from '@/lib/utils'

type StepKey = 'details' | 'otp' | 'password'

type VerificationState = {
  verificationId: string | null
  otp: string
  verified: boolean
  isRequesting: boolean
  isVerifying: boolean
  hasError: boolean
}

const emptyVerificationState: VerificationState = {
  verificationId: null,
  otp: '',
  verified: false,
  isRequesting: false,
  isVerifying: false,
  hasError: false,
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const stepOrder: StepKey[] = ['details', 'otp', 'password']
const stepMeta: Record<StepKey, { order: string; label: string }> = {
  details: {
    order: '1',
    label: 'Details',
  },
  otp: {
    order: '2',
    label: 'OTP',
  },
  password: {
    order: '3',
    label: 'Password',
  },
}

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length !== 10) {
    return ''
  }

  return `+91${digits}`
}

function resetVerificationState() {
  return { ...emptyVerificationState }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  const navigationState = getAuthNavigationState(location.state)
  const requestedPath = getRequestedPath(location.state, '/dashboard') ?? '/dashboard'

  const [currentStep, setCurrentStep] = useState<StepKey>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailVerification, setEmailVerification] = useState<VerificationState>(emptyVerificationState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const normalizedMobileNumber = useMemo(() => normalizePhoneNumber(mobileNumber), [mobileNumber])

  const detailsValid = name.trim().length >= 2 && emailPattern.test(normalizedEmail) && mobileNumber.length === 10
  const otpVerified = emailVerification.verified && Boolean(emailVerification.verificationId)
  const passwordChecks = [
    { label: 'Minimum 8 characters', valid: password.length >= 8 },
    { label: 'Contains a letter', valid: /[A-Za-z]/.test(password) },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Matches confirm password', valid: confirmPassword.length > 0 && password === confirmPassword },
  ]
  const passwordValid = passwordChecks.every((rule) => rule.valid)

  const highestUnlockedStepIndex = otpVerified ? 2 : detailsValid ? 1 : 0
  const currentStepIndex = stepOrder.indexOf(currentStep)

  function handleEmailChange(value: string) {
    setEmail(value)
    setEmailVerification(resetVerificationState())
    if (currentStep === 'password') {
      setCurrentStep('otp')
    }
  }

  function handleMobileChange(value: string) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setMobileNumber(digitsOnly)
  }

  function goToStep(step: StepKey) {
    const targetIndex = stepOrder.indexOf(step)
    if (targetIndex <= highestUnlockedStepIndex) {
      setCurrentStep(step)
      setError(null)
    }
  }

  async function continueToOtp() {
    if (!detailsValid) {
      const message = 'Enter a valid name, email, and mobile number before continuing.'
      setError(message)
      showWarningToast({
        title: 'Customer details incomplete',
        description: message,
      })
      return
    }

    await handleRequestEmailOtp({ advanceToOtp: true })
  }

  function continueToPassword() {
    if (!otpVerified) {
      const message = 'Verify your email OTP before continuing.'
      setError(message)
      showWarningToast({
        title: 'Verification pending',
        description: message,
      })
      return
    }

    setError(null)
    setCurrentStep('password')
  }

  async function handleRequestEmailOtp(options?: { advanceToOtp?: boolean }) {
    if (!detailsValid) {
      showWarningToast({
        title: 'Finish customer details first',
        description: 'Enter valid customer information before requesting OTP.',
      })
      return
    }

    setEmailVerification((current) => ({
      ...current,
      isRequesting: true,
      verified: false,
      verificationId: null,
      otp: '',
      hasError: false,
    }))

    try {
      const response = await requestRegisterOtp({
        channel: 'email',
        destination: normalizedEmail,
      })

      setEmailVerification((current) => ({
        ...current,
        verificationId: response.verificationId,
        verified: false,
        isRequesting: false,
        hasError: false,
      }))
      setError(null)

      if (options?.advanceToOtp) {
        setCurrentStep('otp')
      }

      showSuccessToast({
        title: 'Email OTP sent',
        description: 'Use the verification code sent to your email address.',
      })
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to request OTP right now.'
      setEmailVerification((current) => ({ ...current, isRequesting: false, hasError: true }))
      showErrorToast({
        title: 'Email OTP not sent',
        description: message,
      })
    }
  }

  async function handleVerifyEmailOtp() {
    if (!emailVerification.verificationId) {
      showWarningToast({
        title: 'Request OTP first',
        description: 'Request the email OTP before verifying it.',
      })
      return
    }

    if (emailVerification.otp.trim().length !== 6) {
      showWarningToast({
        title: 'OTP incomplete',
        description: 'Enter the 6-digit OTP before verifying.',
      })
      return
    }

    setEmailVerification((current) => ({
      ...current,
      isVerifying: true,
    }))

    try {
      await verifyRegisterOtp({
        verificationId: emailVerification.verificationId,
        otp: emailVerification.otp.trim(),
      })

      setEmailVerification((current) => ({
        ...current,
        verified: true,
        isVerifying: false,
        hasError: false,
      }))

      showSuccessToast({
        title: 'Email verified',
        description: 'Your email address is ready for account creation.',
      })
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP right now.'
      setEmailVerification((current) => ({
        ...current,
        isVerifying: false,
        verified: false,
        hasError: true,
      }))
      showErrorToast({
        title: 'Email OTP invalid',
        description: message,
      })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!detailsValid) {
      const message = 'Update your customer details before creating the account.'
      setError(message)
      showWarningToast({
        title: 'Customer details incomplete',
        description: message,
      })
      return
    }

    if (!otpVerified) {
      const message = 'Verify your email OTP before creating the account.'
      setError(message)
      showWarningToast({
        title: 'Verification pending',
        description: message,
      })
      return
    }

    if (!passwordValid) {
      const message = 'Make sure the password meets every rule before continuing.'
      setError(message)
      showWarningToast({
        title: 'Password incomplete',
        description: message,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const session = await register({
        displayName: name.trim(),
        email: normalizedEmail,
        phoneNumber: normalizedMobileNumber,
        password,
        actorType: 'customer',
        emailVerificationId: emailVerification.verificationId!,
      })
      const redirectTo = resolveAuthorizedPath(session.user.actorType, requestedPath)

      showSuccessToast({
        title: 'Account created',
        description: redirectTo === '/dashboard'
          ? `Welcome ${name.trim()}. Your workspace is ready.`
          : `Welcome ${name.trim()}. Continue with delivery details and payment.`,
      })
      clearRequestedPath()
      void navigate(redirectTo, { replace: true })
    } catch (submissionError) {
      const message = submissionError instanceof Error
        ? submissionError.message
        : 'Unable to register right now.'
      setError(message)
      showErrorToast({
        title: 'Registration failed',
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-h-[calc(100dvh-7rem)] overflow-hidden sm:max-h-[calc(100dvh-9rem)]">
      <CardHeader className="items-center px-5 pt-5 pb-4 text-center sm:px-8 sm:pt-8 sm:pb-5">
        <CardTitle className="text-2xl sm:text-3xl">Create account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto px-5 pb-5 sm:space-y-6 sm:px-8 sm:pb-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {stepOrder.map((step, index) => {
            const unlocked = index <= highestUnlockedStepIndex
            const active = currentStep === step
            const completed = index < currentStepIndex || (step === 'otp' && otpVerified) || (step === 'details' && detailsValid && currentStep !== 'details')

            return (
              <div key={step} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(step)}
                  disabled={!unlocked}
                  className={cn(
                    'group flex min-w-0 items-center gap-2 text-left transition-colors sm:gap-3',
                    !unlocked ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-9 sm:text-sm',
                      active ? 'border-foreground bg-foreground text-white' : completed ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {completed && !active ? <CheckCircle2 className="size-4" /> : stepMeta[step].order}
                  </span>
                  <span className={cn('truncate text-xs font-medium sm:text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>
                    {stepMeta[step].label}
                  </span>
                </button>
                {index < stepOrder.length - 1 ? (
                  <span className={cn('h-px flex-1 rounded-full transition-colors', index < currentStepIndex ? 'bg-foreground' : 'bg-border')} />
                ) : null}
              </div>
            )
          })}
        </div>

        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="min-h-[360px] overflow-hidden sm:min-h-[430px]">
            <AnimatePresence mode="wait" initial={false}>
              {currentStep === 'details' ? (
                <motion.section
                  key="details"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex min-h-[360px] flex-col justify-between p-1 sm:min-h-[430px] sm:p-3"
                >
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="rounded-2xl border border-border/70 bg-background/85 p-3 sm:p-4">
                      <div className="grid gap-4 sm:gap-5">
                        <div className="grid gap-2">
                          <Label htmlFor="register-name">Name</Label>
                          <Input
                            id="register-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(event) => handleEmailChange(event.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="register-mobile">Mobile number</Label>
                          <Input
                            id="register-mobile"
                            value={mobileNumber}
                            onChange={(event) => handleMobileChange(event.target.value)}
                            inputMode="numeric"
                            maxLength={10}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" className="rounded-full px-6" onClick={continueToOtp}>
                      {emailVerification.isRequesting ? 'Sending OTP...' : 'Continue to send OTP'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.section>
              ) : null}

              {currentStep === 'otp' ? (
                <motion.section
                  key="otp"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex min-h-[360px] flex-col justify-between p-1 sm:min-h-[430px] sm:p-3"
                >
                  <div className="grid gap-3">
                    <div
                      className={cn(
                        'relative h-full space-y-3 rounded-2xl border px-3 pt-6 pb-3 transition-colors sm:px-4',
                        emailVerification.verified
                          ? 'border-emerald-200 bg-emerald-50/90'
                          : emailVerification.hasError
                            ? 'border-destructive/25 bg-destructive/5'
                            : 'border-border/70 bg-background/85',
                      )}
                    >
                      {emailVerification.verified ? (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 bg-white p-1.5 text-emerald-600 shadow-sm">
                          <CheckCircle2 className="size-4" />
                        </div>
                      ) : emailVerification.hasError ? (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-destructive/20 bg-white p-1.5 text-destructive shadow-sm">
                          <CircleAlert className="size-4" />
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Email</div>
                          <div className="text-xs text-muted-foreground">{normalizedEmail}</div>
                        </div>
                        <Button type="button" variant="outline" className="h-9 shrink-0 px-3 text-xs sm:text-sm" disabled={emailVerification.isRequesting || emailVerification.verified} onClick={() => void handleRequestEmailOtp()}>
                          {emailVerification.isRequesting ? 'Sending...' : emailVerification.verificationId ? 'Retry OTP' : 'Send OTP'}
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <Input
                          value={emailVerification.otp}
                          onChange={(event) => setEmailVerification((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          placeholder="Enter email OTP"
                          maxLength={6}
                          inputMode="numeric"
                        />
                      </div>
                      {emailVerification.verified ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-100/90 px-3 py-2 text-sm text-emerald-900">
                          Email OTP verified successfully. Continue to set your password.
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        className={cn(
                          'w-full',
                          emailVerification.verified ? 'bg-emerald-600 text-white hover:bg-emerald-600 disabled:opacity-100' : '',
                        )}
                        disabled={emailVerification.isVerifying || !emailVerification.verificationId || emailVerification.verified}
                        onClick={() => void handleVerifyEmailOtp()}
                      >
                        {emailVerification.verified ? 'Verified' : emailVerification.isVerifying ? 'Verifying...' : 'Verify email OTP'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between gap-3 pt-2">
                    <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => setCurrentStep('details')}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button type="button" className="rounded-full px-6" onClick={continueToPassword}>
                      Continue
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.section>
              ) : null}

              {currentStep === 'password' ? (
                <motion.section
                  key="password"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex min-h-[360px] flex-col justify-between space-y-4 p-1 sm:min-h-[430px] sm:space-y-5 sm:p-3"
                >
                  <div className="space-y-4 rounded-2xl border border-border/70 bg-background/85 p-3 sm:p-4">
                    <div className="grid gap-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Use at least 8 characters"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-confirm-password">Confirm password</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat your password"
                        required
                      />
                    </div>
                    <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                      {passwordChecks.map((rule) => (
                        <div key={rule.label} className="flex items-center gap-3">
                          <CheckCircle2 className={cn('size-4', rule.valid ? 'text-emerald-600' : 'text-muted-foreground')} />
                          <span className={rule.valid ? 'text-foreground' : 'text-muted-foreground'}>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between gap-3">
                    <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => setCurrentStep('otp')}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button className="rounded-full px-6" disabled={isSubmitting || !detailsValid || !otpVerified || !passwordValid}>
                      {isSubmitting ? 'Creating account...' : 'Create account'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" state={navigationState} className="font-medium text-foreground underline underline-offset-4">
            Login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
