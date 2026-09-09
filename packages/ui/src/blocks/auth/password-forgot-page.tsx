import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Label } from '../../components/label'
import { AuthShell } from './auth-shell'

export interface PasswordForgotPageProps {
  backHref: string
  onSubmit(email: string): void
}

export function PasswordForgotPage({ backHref, onSubmit }: PasswordForgotPageProps) {
  const [email, setEmail] = useState('')
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email address. The response does not reveal whether an account exists."
    >
      <form
        className="space-y-5"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onSubmit(email)
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email</Label>
          <Input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button className="w-full" type="submit">
          Request reset
        </Button>
        <a className="block text-center text-sm text-muted-foreground" href={backHref}>
          Back to sign in
        </a>
      </form>
    </AuthShell>
  )
}
