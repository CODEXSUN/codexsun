import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Label } from '../../components/label'

export interface AuthLoginFormProps {
  busy?: boolean
  devLoginEnabled?: boolean
  error?: string
  forgotHref: string
  onDevLogin?: () => void
  onSubmit(email: string, password: string): void
  registerHref?: string
}

export function AuthLoginForm(props: AuthLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    props.onSubmit(email, password)
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="identity-email">Email</Label>
        <Input
          id="identity-email"
          autoComplete="username"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="identity-password">Password</Label>
          <a
            className="text-sm text-muted-foreground hover:text-foreground"
            href={props.forgotHref}
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="identity-password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      {props.error ? (
        <p className="text-sm text-destructive" role="alert">
          {props.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={props.busy} type="submit">
        {props.busy ? 'Signing in…' : 'Sign in'}
      </Button>
      {props.devLoginEnabled && props.onDevLogin ? (
        <Button className="w-full" type="button" variant="outline" onClick={props.onDevLogin}>
          Development sign in
        </Button>
      ) : null}
      {props.registerHref ? (
        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <a className="font-medium text-foreground" href={props.registerHref}>
            Create an account
          </a>
        </p>
      ) : null}
    </form>
  )
}
