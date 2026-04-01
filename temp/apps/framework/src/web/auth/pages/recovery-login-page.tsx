import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

const recoveryAccessQueryKey = 'access'
const recoveryAccessSecret = 'admin@codexsun.com'

export function RecoveryLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { recoveryLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (searchParams.get(recoveryAccessQueryKey) !== recoveryAccessSecret) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await recoveryLogin({ email, password })
      showSuccessToast({
        title: 'Recovery access granted',
        description: 'Recovery admin is signed in. Open the migration manager to repair the database.',
      })
      void navigate(buildAdminPortalPath('/migration-manager'), { replace: true })
    } catch (submissionError) {
      const message = submissionError instanceof Error
        ? submissionError.message
        : 'Unable to sign in to recovery mode.'
      setError(message)
      showErrorToast({
        title: 'Recovery sign in failed',
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-center p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-900">
          <ShieldAlert className="size-4" />
          Recovery Login
        </div>
        <CardTitle className="text-3xl">Database recovery access</CardTitle>
        <CardDescription>
          Hidden recovery login for manual database and maintenance access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2">
            <Label htmlFor="recovery-email">Email</Label>
            <Input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recovery-password">Password</Label>
            <Input
              id="recovery-password"
              type="password"
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
            {isSubmitting ? 'Signing in...' : 'Open recovery workspace'}
            <ArrowRight className="size-4" />
          </Button>
        </form>
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          If the database server needs to be reconfigured, open the setup page and save the server connection details first.
          <div className="mt-3">
            <Button asChild type="button" variant="outline">
              <Link to="/setup">Connect to server</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
