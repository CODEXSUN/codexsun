import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  requestAccountRecoveryOtp,
  restoreAccount,
} from '@/shared/api/client'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { clearRequestedPath, getAuthNavigationState, getRequestedPath } from '@framework-core/web/auth/lib/navigation-state'
import { resolveAuthorizedPath } from '@framework-core/web/auth/lib/portal-routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const navigationState = getAuthNavigationState(location.state)
  const requestedPath = getRequestedPath(location.state)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recoveryOtp, setRecoveryOtp] = useState('')
  const [recoveryVerificationId, setRecoveryVerificationId] = useState<string | null>(null)
  const [isRequestingRecoveryOtp, setIsRequestingRecoveryOtp] = useState(false)
  const [isRestoringAccount, setIsRestoringAccount] = useState(false)

  const canRecoverDisabledAccount = error?.startsWith('The account is disabled.') ?? false

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const session = await login({ email, password })
      const redirectTo = resolveAuthorizedPath(session.user.actorType, requestedPath)
      showSuccessToast({
        title: 'Signed in',
        description: redirectTo === '/checkout'
          ? 'You are now authenticated and redirected to checkout.'
          : 'You are now authenticated and redirected to your workspace.',
      })
      clearRequestedPath()
      void navigate(redirectTo, { replace: true })
    } catch (submissionError) {
      const message = submissionError instanceof Error
        ? submissionError.message
        : 'Unable to login right now.'
      setError(message)
      showErrorToast({
        title: 'Sign in failed',
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRequestRecoveryOtp() {
    if (!email.trim()) {
      setError('Enter the account email before requesting recovery.')
      return
    }

    setIsRequestingRecoveryOtp(true)

    try {
      const recovery = await requestAccountRecoveryOtp({
        email: email.trim().toLowerCase(),
      })

      setRecoveryVerificationId(recovery.verificationId)
      showSuccessToast({
        title: 'Recovery OTP sent',
        description: 'Check the account email for the recovery code.',
      })
    } catch (recoveryError) {
      const message = recoveryError instanceof Error ? recoveryError.message : 'Unable to request recovery OTP right now.'
      setError(message)
      showErrorToast({
        title: 'Recovery unavailable',
        description: message,
      })
    } finally {
      setIsRequestingRecoveryOtp(false)
    }
  }

  async function handleRestoreAccount() {
    if (!recoveryVerificationId || recoveryOtp.trim().length !== 6) {
      setError('Enter the 6-digit recovery OTP before restoring the account.')
      return
    }

    setIsRestoringAccount(true)

    try {
      await restoreAccount({
        email: email.trim().toLowerCase(),
        verificationId: recoveryVerificationId,
        otp: recoveryOtp.trim(),
      })

      showSuccessToast({
        title: 'Account restored',
        description: 'Your customer account is active again. Sign in continues now.',
      })

      const session = await login({ email, password })
      const redirectTo = resolveAuthorizedPath(session.user.actorType, requestedPath)
      clearRequestedPath()
      void navigate(redirectTo, { replace: true })
    } catch (restoreError) {
      const message = restoreError instanceof Error ? restoreError.message : 'Unable to restore the account right now.'
      setError(message)
      showErrorToast({
        title: 'Recovery failed',
        description: message,
      })
    } finally {
      setIsRestoringAccount(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-center p-8 text-center">
        <CardTitle className="text-3xl">Welcome</CardTitle>
        <CardDescription>
          Access your workspace securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" state={navigationState} className="text-xs font-medium text-foreground underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
            <ArrowRight className="size-4" />
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Need an account?{' '}
          <Link to="/register" state={navigationState} className="font-medium text-foreground underline underline-offset-4">
            Request access
          </Link>
        </p>

        {canRecoverDisabledAccount ? (
          <div className="space-y-4 rounded-[1.5rem] border border-amber-300/70 bg-amber-50/80 p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Recover disabled account</p>
              <p className="text-sm text-muted-foreground">
                Confirm the email with OTP to re-enable the account while the 15-day recovery window is still open.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recovery-email">Recovery email</Label>
              <Input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => void handleRequestRecoveryOtp()} disabled={isRequestingRecoveryOtp}>
                {isRequestingRecoveryOtp ? 'Sending OTP...' : 'Send recovery OTP'}
              </Button>
            </div>

            {recoveryVerificationId ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="recovery-otp">Recovery OTP</Label>
                  <Input
                    id="recovery-otp"
                    inputMode="numeric"
                    value={recoveryOtp}
                    onChange={(event) => setRecoveryOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
                <Button type="button" onClick={() => void handleRestoreAccount()} disabled={isRestoringAccount}>
                  {isRestoringAccount ? 'Restoring account...' : 'Restore account'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

