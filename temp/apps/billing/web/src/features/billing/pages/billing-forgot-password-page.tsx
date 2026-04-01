import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Globe2, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@admin-web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'
import { Input } from '@admin-web/components/ui/input'
import { Label } from '@admin-web/components/ui/label'
import { showErrorToast, showSuccessToast } from '@admin-web/shared/notifications/toast'
import { requestPasswordResetOtp, confirmPasswordReset } from '@ecommerce-web/shared/api/client'
import { BrandGlyph } from '@admin-web/shared/branding/brand-mark'
import { useBranding } from '@admin-web/shared/branding/branding-provider'

const codexsunSiteUrl = 'https://codexsun.com'

export function BillingForgotPasswordPage() {
  const branding = useBranding()
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
      setError('Enter the account email before requesting a password reset.')
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
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,#ecd6b5,transparent_28%),linear-gradient(180deg,#f7f1e7_0%,#f5efe8_52%,#ede2d4_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border/60 bg-background/70 shadow-[0_30px_120px_-60px_rgba(15,23,42,0.35)] backdrop-blur md:grid-cols-[1.02fr_0.98fr]">
        <section className="flex flex-col justify-between border-b border-border/60 px-6 py-8 md:border-b-0 md:border-r md:px-10 md:py-10">
          <div>
            <div className="flex items-center gap-4">
              <BrandGlyph className="size-14 rounded-[1.2rem]" iconClassName="size-6" shadowless />
              <div className="min-w-0">
                <p className="text-2xl font-semibold uppercase tracking-[0.28em] text-foreground md:text-4xl">
                  {branding.brandName}
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground md:text-base">
                  Secure account recovery for the Codexsun operator workspace
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                Recover access and return to the Codexsun accounts workspace.
              </h1>
              <p className="text-base leading-8 text-muted-foreground md:text-lg">
                Request a password reset OTP for your existing operator account, then set a new password and continue into the billing workspace.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <a
              href={codexsunSiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 font-medium text-foreground transition hover:border-accent/40 hover:bg-background"
            >
              <Globe2 className="size-4" />
              Learn more at codexsun.com
              <ExternalLink className="size-4" />
            </a>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 md:px-10 md:py-10">
          <Card className="w-full max-w-xl border-border/70 bg-background/88">
            <CardHeader className="p-8 pb-0 md:p-10 md:pb-0">
              <CardTitle className="text-3xl tracking-tight md:text-4xl">Reset your password</CardTitle>
              <CardDescription className="pt-2 text-sm leading-7 md:text-base">
                Use the email linked to your Codexsun operator account. We will send a one-time password reset code first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 md:p-10">
              <form className="space-y-6" onSubmit={(event) => void handleRequestOtp(event)}>
                <div className="grid gap-2">
                  <Label htmlFor="forgot-password-email">Account email</Label>
                  <Input
                    id="forgot-password-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl bg-background/90"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-[1.2rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                    {error}
                  </div>
                ) : null}

                <Button className="h-12 w-full rounded-2xl text-base" disabled={isRequestingOtp}>
                  {isRequestingOtp ? 'Sending reset OTP...' : 'Send password reset OTP'}
                  <KeyRound className="size-4" />
                </Button>
              </form>

              {verificationId ? (
                <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/60 p-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Complete password reset</p>
                    <p className="text-sm text-muted-foreground">
                      Enter the OTP from your email and choose the replacement password.
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
                      className="h-12 rounded-2xl bg-background/90"
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
                      className="h-12 rounded-2xl bg-background/90"
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
                      className="h-12 rounded-2xl bg-background/90"
                    />
                  </div>
                  <Button type="button" className="h-12 w-full rounded-2xl text-base" onClick={() => void handleConfirmReset()} disabled={isResettingPassword}>
                    {isResettingPassword ? 'Resetting password...' : 'Confirm password reset'}
                  </Button>
                </div>
              ) : null}

              <div className="text-center">
                <Link to="/login?workspace=billing" className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4">
                  <ArrowLeft className="size-4" />
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
