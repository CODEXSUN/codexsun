import { databaseSetupPayloadSchema, type DatabaseSetupPayload } from '@shared/index'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DatabaseZap, LoaderCircle, RefreshCcw, ServerCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { HttpError } from '@/shared/api/client'
import { useSetup } from '../components/setup-provider'

const initialFormState: DatabaseSetupPayload = {
  host: 'mariadb',
  port: 3306,
  user: 'root',
  password: 'DbPass1@@',
  name: 'codexsun_db',
}

function formatSetupMode(status: ReturnType<typeof useSetup>['status']) {
  if (!status) {
    return 'Checking setup state'
  }

  if (status.status === 'ready') {
    return 'Setup complete'
  }

  if (status.status === 'error') {
    return 'Connection failed'
  }

  return 'Setup required'
}

export function InitialSetupPage() {
  const { isSubmitting, refresh, saveDatabaseConfig, status } = useSetup()
  const [formValues, setFormValues] = useState(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)

  const connectionHint = useMemo(() => {
    if (!status?.database.configured) {
      return 'Enter the MariaDB host, database name, and login that should hold the codexsun schema.'
    }

    return `Current source: ${status.database.source === 'env_file' ? '.env file' : 'not configured yet'}.`
  }, [status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsedPayload = databaseSetupPayloadSchema.safeParse(formValues)

    if (!parsedPayload.success) {
      const firstIssue = parsedPayload.error.issues[0]
      setFormError(firstIssue?.message ?? 'Enter valid database settings.')
      return
    }

    try {
      const nextStatus = await saveDatabaseConfig(parsedPayload.data)

      if (nextStatus.status !== 'ready') {
        setFormError(nextStatus.detail)
      }
    } catch (error) {
      if (error instanceof HttpError) {
        setFormError(error.message)
        return
      }

      setFormError(error instanceof Error ? error.message : 'Unable to save database settings.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-slate-300/80 bg-slate-950 px-8 py-10 text-white shadow-[0_30px_120px_-50px_rgba(15,23,42,0.9)]">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
              <ServerCog className="size-4" />
              {formatSetupMode(status)}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Finish the first-run database setup before codexsun opens the workspace.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                The API is online in setup mode. If the target database does not exist yet, codexsun
                will create it automatically after the credentials are verified.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Step 1</p>
              <p className="mt-3 text-lg font-medium">Enter MariaDB access</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Step 2</p>
              <p className="mt-3 text-lg font-medium">Save .env file</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Step 3</p>
              <p className="mt-3 text-lg font-medium">Migrate and open app</p>
            </div>
          </div>
        </section>

        <Card className="self-center border-slate-300/80 bg-white/92 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.5)]">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900">
              <DatabaseZap className="size-4" />
              Database Setup
            </div>
            <CardTitle>Connect codexsun to MariaDB</CardTitle>
            <CardDescription>{connectionHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                void handleSubmit(event)
              }}
            >
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="db-host">Host</FieldLabel>
                  <FieldContent>
                    <Input
                      id="db-host"
                      value={formValues.host}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, host: event.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="db-port">Port</FieldLabel>
                  <FieldContent>
                    <Input
                      id="db-port"
                      type="number"
                      value={String(formValues.port)}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          port: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="db-user">User</FieldLabel>
                  <FieldContent>
                    <Input
                      id="db-user"
                      value={formValues.user}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, user: event.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="db-password">Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="db-password"
                      type="password"
                      value={formValues.password}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="db-name">Database name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="db-name"
                      value={formValues.name}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>

              {formError ? <FieldError>{formError}</FieldError> : null}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-900">Status</p>
                <p>{status?.detail ?? 'Checking the API setup state.'}</p>
                <p className="mt-2">
                  Suggested Docker Compose host: <span className="font-medium text-slate-900">mariadb</span>
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="sm:flex-1" disabled={isSubmitting} type="submit">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Save and initialize
                </Button>
                <Button
                  className="sm:flex-1"
                  disabled={isSubmitting}
                  onClick={() => {
                    void refresh()
                  }}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" />
                  Retry status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
