import { AppleIcon, Globe2Icon, LogInIcon, OrbitIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '../../components/field'
import { Input } from '../../components/input'
import { AuthPageLayout, AuthVisualPanel, type AuthPageVariant } from './auth-page-layout'

export type LoginPageProps = {
  brandName?: string
  busy?: boolean
  description?: string
  devLoginEnabled?: boolean
  embedded?: boolean
  error?: string
  forgotHref?: string
  onSubmit(identifier: string, password: string): void
  onDevLogin?: () => void
  registerHref?: string
  title?: string
  variant?: AuthPageVariant
}

export function LoginPage({
  brandName,
  busy = false,
  description,
  devLoginEnabled = false,
  embedded = false,
  error,
  forgotHref = '/password/forgot',
  onSubmit,
  onDevLogin,
  registerHref = '/register',
  title,
  variant = 'v1',
}: LoginPageProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit(identifier, password)
  }

  return (
    <AuthPageLayout
      aside={
        <AuthVisualPanel
          description="Keep projects, people, and trusted application access in one connected workspace."
          title="One workspace. Every application."
        />
      }
      brandName={brandName}
      embedded={embedded}
      variant={variant}
    >
      <form className="grid gap-6" onSubmit={submit}>
        <header className={variant === 'v2' ? 'grid gap-1.5 text-center' : 'grid gap-2'}>
          <h1 className="text-2xl font-semibold tracking-tight">
            {title ?? (variant === 'v2' ? 'Welcome back' : 'Welcome')}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description ??
              (variant === 'v2'
                ? 'Sign in to continue to your CODEXSUN workspace.'
                : 'Use your admin email and password for this desk.')}
          </p>
        </header>
        {variant === 'v1' ? <div className="border-t" /> : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`login-${variant}-email`}>Email</FieldLabel>
            <Input
              autoComplete="username"
              className="h-11"
              id={`login-${variant}-email`}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={variant === 'v2' ? 'name@company.com' : undefined}
              required
              type="email"
              value={identifier}
            />
          </Field>
          {devLoginEnabled && onDevLogin ? (
            <Button className="w-full" onClick={onDevLogin} type="button" variant="outline">
              Development sign in
            </Button>
          ) : null}
          <Field>
            <div className={variant === 'v2' ? 'flex items-center gap-4' : ''}>
              <FieldLabel htmlFor={`login-${variant}-password`}>Password</FieldLabel>
              {variant === 'v2' ? (
                <a className="ml-auto text-sm underline-offset-4 hover:underline" href={forgotHref}>
                  Forgot your password?
                </a>
              ) : null}
            </div>
            <Input
              autoComplete="current-password"
              className="h-11"
              id={`login-${variant}-password`}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Field>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {variant === 'v1' ? (
            <a className="text-center text-sm font-medium hover:underline" href={forgotHref}>
              Forgot password?
            </a>
          ) : null}
          <Field>
            <Button
              className="w-full"
              disabled={busy}
              type="submit"
              variant={variant === 'v1' ? 'success' : 'default'}
            >
              {variant === 'v1' ? <LogInIcon /> : null}
              {busy ? 'Signing in…' : variant === 'v2' ? 'Login' : 'Sign in'}
            </Button>
          </Field>
          {variant === 'v2' ? <ProviderActions /> : null}
          {registerHref ? (
            <FieldDescription className="text-center">
              Don&apos;t have an account? <a href={registerHref}>Sign up</a>
            </FieldDescription>
          ) : null}
        </FieldGroup>
      </form>
    </AuthPageLayout>
  )
}

function ProviderActions() {
  return (
    <>
      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
        Or continue with
      </FieldSeparator>
      <Field className="grid grid-cols-3 gap-3">
        <Button aria-label="Login with Apple" size="icon" type="button" variant="outline">
          <AppleIcon />
        </Button>
        <Button aria-label="Login with Google" size="icon" type="button" variant="outline">
          <Globe2Icon />
        </Button>
        <Button
          aria-label="Login with another provider"
          size="icon"
          type="button"
          variant="outline"
        >
          <OrbitIcon />
        </Button>
      </Field>
    </>
  )
}
