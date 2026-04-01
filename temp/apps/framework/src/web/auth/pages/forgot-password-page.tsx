import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { confirmPasswordReset, requestPasswordResetOtp } from '@/shared/api/client'
import { getAuthNavigationState } from '@framework-core/web/auth/lib/navigation-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

export function ForgotPasswordPage() {
  const location = useLocation()
  const navigationState = getAuthNavigationState(location.state)
  const [email, setEmail] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter the account email before requesting password reset.')
      return
    }

    setIsRequestingOtp(true)
    setError(null)

    try {
      const response = await requestPasswordResetOtp({
        email: email.trim().toLowerCase(),
      })

      setVerificationId(response.verificationId)
      showSuccessToast({
        title: 'Password reset OTP sent',
        description: 'Check the account email for the password reset code.',
      })
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to request password reset right now.'
      setError(message)
      showErrorToast({
        title: 'Password reset unavailable',
        description: message,
      })
    } finally {
      setIsRequestingOtp(false)
    }
  }

  async function handleConfirmReset() {
    if (!verificationId || otp.trim().length !== 6) {
      setError('Enter the 6-digit password reset OTP before continuing.')
      return
    }

    if (!newPassword.trim() || newPassword !== confirmPassword) {
      setError('Enter matching new password values before finishing the reset.')
      return
    }

    setIsResettingPassword(true)
    setError(null)

    try {
      await confirmPasswordReset({
        email: email.trim().toLowerCase(),
        verificationId,
        otp: otp.trim(),
        newPassword,
      })

      setOtp('')
      setVerificationId(null)
      setNewPassword('')
      setConfirmPassword('')

      showSuccessToast({
        title: 'Password updated',
        description: 'Password reset is complete. Return to login and continue with the new password.',
      })
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : 'Unable to complete the password reset right now.'
      setError(message)
      showErrorToast({
        title: 'Password reset failed',
        description: message,
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-center p-8 text-center">
        <CardTitle className="text-3xl">Forgot Password</CardTitle>
        <CardDescription>
          Reset access using an OTP sent to the existing account email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <form className="space-y-6" onSubmit={(event) => void handleRequestOtp(event)}>
          <div className="grid gap-2">
            <Label htmlFor="forgot-password-email">Account email</Label>
            <Input
              id="forgot-password-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={isRequestingOtp}>
            {isRequestingOtp ? 'Sending reset OTP...' : 'Send password reset OTP'}
            <KeyRound className="size-4" />
          </Button>
        </form>

        {verificationId ? (
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Complete password reset</p>
              <p className="text-sm text-muted-foreground">
                Enter the OTP from the customer email and choose the replacement password.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="forgot-password-otp">Password reset OTP</Label>
              <Input
                id="forgot-password-otp"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="forgot-password-new">New password</Label>
              <Input
                id="forgot-password-new"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Set a new password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="forgot-password-confirm">Confirm new password</Label>
              <Input
                id="forgot-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat the new password"
              />
            </div>
            <Button type="button" className="w-full" onClick={() => void handleConfirmReset()} disabled={isResettingPassword}>
              {isResettingPassword ? 'Resetting password...' : 'Confirm password reset'}
            </Button>
          </div>
        ) : null}

        <div className="text-center">
          <Link to="/login" state={navigationState} className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4">
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
