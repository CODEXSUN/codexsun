import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { ArrowRight, ExternalLink, Globe2, Layers3, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@admin-web/components/ui/button'
import { Card, CardContent } from '@admin-web/components/ui/card'
import { Input } from '@admin-web/components/ui/input'
import { Label } from '@admin-web/components/ui/label'
import { showErrorToast, showSuccessToast } from '@admin-web/shared/notifications/toast'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { BrandGlyph } from '@admin-web/shared/branding/brand-mark'
import { useBranding } from '@admin-web/shared/branding/branding-provider'

const codexsunSiteUrl = 'https://codexsun.com'

const codexsunCapabilities = [
  'Online Shopping Ecommerce',
  'CRM',
  'HRMS',
  'Accounts',
  'Integrations',
]

export function BillingLoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login, session, logout } = useAuth()
  const branding = useBranding()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workspaceLabel = searchParams.get('workspace')?.trim() || 'billing'
  const requestedSurface =
    searchParams.get('surface') === 'desktop' || ('codexsunBillingDesktop' in window)
      ? 'Desktop'
      : 'Web'

  useEffect(() => {
    if (!isAuthenticated || !session) {
      return
    }

    if (session.user.actorType === 'customer') {
      logout()
      setError('Customer accounts cannot open the Codexsun operator workspace.')
      return
    }

    void navigate('/dashboard', { replace: true })
  }, [isAuthenticated, logout, navigate, session])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const nextSession = await login({
        email: email.trim().toLowerCase(),
        password,
      })

      if (nextSession.user.actorType === 'customer') {
        throw new Error('Customer accounts cannot open the Codexsun operator workspace.')
      }

      showSuccessToast({
        title: 'Signed in',
        description: `Welcome to the ${workspaceLabel} workspace.`,
      })

      void navigate('/dashboard', { replace: true })
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Unable to sign in right now.'
      setError(message)
      showErrorToast({
        title: 'Sign in failed',
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated && session?.user.actorType !== 'customer') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,#ecd6b5,transparent_28%),linear-gradient(180deg,#f7f1e7_0%,#f5efe8_52%,#ede2d4_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border/60 bg-background/70 shadow-[0_30px_120px_-60px_rgba(15,23,42,0.35)] backdrop-blur md:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between border-b border-border/60 px-6 py-8 md:border-b-0 md:border-r md:px-10 md:py-10">
          <div>
            <div className="flex items-center gap-4">
              <BrandGlyph className="size-14 rounded-[1.2rem]" iconClassName="size-6" shadowless />
              <div className="min-w-0">
                <p className="text-2xl font-semibold uppercase tracking-[0.28em] text-foreground md:text-4xl">
                  {branding.brandName}
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground md:text-base">
                  Software for commerce, operations, and connected business teams
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                One Codexsun workspace for the business systems you run every day.
              </h1>
              <p className="text-base leading-8 text-muted-foreground md:text-lg">
                Codexsun brings online shopping, ecommerce operations, CRM, HRMS, accounts, and integration workflows into one connected platform.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {codexsunCapabilities.map((item) => (
                <div key={item} className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground">
                  {item}
                </div>
              ))}
            </div>

            <Card className="mt-8 border-border/70 bg-background/80">
              <CardContent className="grid gap-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Layers3 className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">What Codexsun is already shaping here</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      A unified business stack with ecommerce, customer workflows, accounts, and app-by-app expansion under one brand.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Operator-first access</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      Sign in with your existing Codexsun account and land directly in the accounts workspace.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <span>Workspace default: {workspaceLabel}</span>
            <span>Surface: {requestedSurface}</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 md:px-10 md:py-10">
          <Card className="w-full max-w-xl border-border/70 bg-background/88">
            <CardContent className="p-8 md:p-10">
              <div className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Codexsun Login
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Sign in to your workspace
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                Use your existing Codexsun operator account. The default workspace is ready for accounts and billing operations.
              </p>

              <form className="mt-8 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl bg-background/90"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs font-medium text-foreground underline underline-offset-4">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl bg-background/90"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-[1.2rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                    {error}
                  </div>
                ) : null}

                <Button className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Open Codexsun Workspace'}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
