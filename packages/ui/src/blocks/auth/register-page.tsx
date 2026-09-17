import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import { Field, FieldGroup, FieldLabel } from '../../components/field'
import { Input } from '../../components/input'
import { AuthPageLayout, AuthVisualPanel, type AuthPageVariant } from './auth-page-layout'

export function RegisterPage({
  embedded = false,
  onSubmit,
  variant = 'v1',
}: {
  embedded?: boolean
  onSubmit(name: string, email: string, password: string, username?: string, mobile?: string): void
  variant?: AuthPageVariant
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [mobile, setMobile] = useState('')
  return (
    <AuthPageLayout
      aside={
        <AuthVisualPanel
          description="Create one trusted identity for projects, agents, and connected application desks."
          title="Start with a secure workspace."
        />
      }
      embedded={embedded}
      variant={variant}
    >
      <form
        className="grid gap-6"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onSubmit(name, email, password, username || undefined, mobile || undefined)
        }}
      >
        <header className={variant === 'v2' ? 'grid gap-1.5 text-center' : 'grid gap-2'}>
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Register your CODEXSUN workspace identity.
          </p>
        </header>
        {variant === 'v1' ? <div className="border-t" /> : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`register-${variant}-name`}>Name</FieldLabel>
            <Input
              className="h-11"
              id={`register-${variant}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`register-${variant}-email`}>Email</FieldLabel>
            <Input
              className="h-11"
              id={`register-${variant}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`register-${variant}-password`}>Password</FieldLabel>
            <Input
              className="h-11"
              id={`register-${variant}-password`}
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {variant === 'v2' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="register-v2-username">Username (optional)</FieldLabel>
                <Input
                  className="h-11"
                  id="register-v2-username"
                  minLength={3}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="register-v2-mobile">Mobile number (optional)</FieldLabel>
                <Input
                  className="h-11"
                  id="register-v2-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                />
              </Field>
            </div>
          ) : null}
          <Button className="w-full" type="submit">
            Create account
          </Button>
          <a
            className="text-center text-sm text-muted-foreground hover:text-foreground"
            href="/login"
          >
            Back to sign in
          </a>
        </FieldGroup>
      </form>
    </AuthPageLayout>
  )
}
