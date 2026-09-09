import { useState, type FormEvent } from 'react'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Label } from '../../components/label'
import { AuthShell } from './auth-shell'

export function RegisterPage({
  onSubmit,
}: {
  onSubmit(name: string, email: string, password: string): void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <AuthShell
      eyebrow="Client portal"
      title="Create an account"
      description="Register a regular workspace account."
    >
      <form
        className="space-y-5"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onSubmit(name, email, password)
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="register-name">Name</Label>
          <Input
            id="register-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button className="w-full" type="submit">
          Create account
        </Button>
        <a className="block text-center text-sm text-muted-foreground" href="/login">
          Back to sign in
        </a>
      </form>
    </AuthShell>
  )
}
