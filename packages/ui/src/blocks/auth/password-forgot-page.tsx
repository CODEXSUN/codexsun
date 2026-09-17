import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Field, FieldGroup, FieldLabel } from '../../components/field'
import { AuthPageLayout } from './auth-page-layout'

export interface PasswordForgotPageProps {
  backHref: string
  embedded?: boolean
  onSubmit(email: string): void
}

export function PasswordForgotPage({
  backHref,
  embedded = false,
  onSubmit,
}: PasswordForgotPageProps) {
  const [email, setEmail] = useState('')
  return (
    <AuthPageLayout embedded={embedded} variant="v1">
      <form
        className="grid gap-6"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onSubmit(email)
        }}
      >
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your email address. The response does not reveal whether an account exists.
          </p>
        </header>
        <div className="border-t" />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="recovery-email">Email</FieldLabel>
            <Input
              className="h-11"
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Button className="w-full" type="submit">
            Request reset
          </Button>
          <a
            className="text-center text-sm text-muted-foreground hover:text-foreground"
            href={backHref}
          >
            Back to sign in
          </a>
        </FieldGroup>
      </form>
    </AuthPageLayout>
  )
}
