import { Button } from '@codexsun/ui/components/button'
import { Checkbox } from '@codexsun/ui/components/checkbox'
import { Input } from '@codexsun/ui/components/input'
import { NativeSelect } from '@codexsun/ui/components/native-select'
import { Download } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useOrchestrationOverview } from './orchestration.hooks'

const features = ['Docs', 'UX/UI', 'Zetro', 'CRM', 'ERP', 'Chat', 'Email']

export function AppDeployerWorkspace() {
  const [appName, setAppName] = useState('')
  const [databaseName, setDatabaseName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const overview = useOrchestrationOverview()
  const { apiPort, webPort } = useMemo(
    () => findNextPortPair(overview.data?.services ?? []),
    [overview.data?.services],
  )

  const toggleFeature = (feature: string) => {
    setSelected((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-xl font-semibold">App installer</h1>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Repository</h2>
        <div className="mt-4">
          <Field label="Repository">
            <NativeSelect className="w-full">
              <option>CODEXSUN — main</option>
            </NativeSelect>
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Application</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Application name">
            <Input onChange={(event) => setAppName(event.target.value)} value={appName} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="API port">
              <Input readOnly value={apiPort} />
            </Field>
            <Field label="Web port">
              <Input readOnly value={webPort} />
            </Field>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium"
              key={feature}
            >
              <Checkbox
                checked={selected.includes(feature)}
                onCheckedChange={() => toggleFeature(feature)}
              />
              {feature}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">MariaDB</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Database name">
            <Input onChange={(event) => setDatabaseName(event.target.value)} value={databaseName} />
          </Field>
          <Field label="Super administrator">
            <Input readOnly value="sundar@sundar.com" />
          </Field>
          <Field label="Password">
            <Input autoComplete="new-password" type="password" />
          </Field>
        </div>
      </section>

      <Button className="self-start" disabled={!appName || !databaseName || selected.length === 0}>
        <Download />
        Prepare install
      </Button>
    </main>
  )
}

function findNextPortPair(
  services: readonly { pid: number | null; port: number; state: string }[],
) {
  const usedPorts = new Set(
    services
      .filter((service) => service.pid !== null || service.state === 'online')
      .map((service) => service.port),
  )

  for (let apiPort = 6010; apiPort <= 6970; apiPort += 20) {
    const webPort = apiPort + 10
    if (!usedPorts.has(apiPort) && !usedPorts.has(webPort)) return { apiPort, webPort }
  }

  return { apiPort: 6010, webPort: 6020 }
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}
