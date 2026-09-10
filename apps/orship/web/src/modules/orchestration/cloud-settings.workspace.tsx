import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { NativeSelect } from '@codexsun/ui/components/native-select'
import { ArrowLeft, Cloud, GitBranch, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { fetchCloudTarget, saveCloudTarget } from './orchestration.services'
import type { CloudTargetUpdate } from './orchestration.types'

const emptyTarget: CloudTargetUpdate = {
  localWorkspacePath: 'E:/new workspace/codexsun',
  name: 'Local Docker',
  repository: { branch: 'main', url: '' },
  targetType: 'local-docker',
  vps: { deploymentPath: '/srv/codexsun', host: '', port: 22, user: 'root' },
}

export function CloudSettingsWorkspace({ onBack }: { onBack: () => void }) {
  const [target, setTarget] = useState<CloudTargetUpdate>(emptyTarget)
  const [sshKeyConfigured, setSshKeyConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    void fetchCloudTarget()
      .then((cloudTarget) => {
        if (cloudTarget.repository) {
          setTarget({
            localWorkspacePath: cloudTarget.localWorkspacePath ?? emptyTarget.localWorkspacePath,
            name: cloudTarget.name ?? emptyTarget.name,
            repository: cloudTarget.repository,
            targetType: cloudTarget.targetType ?? 'local-docker',
            vps: cloudTarget.vps ?? emptyTarget.vps,
          })
        }
        setSshKeyConfigured(cloudTarget.sshKeyConfigured)
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : 'Could not load cloud settings.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(undefined)
    try {
      const saved = await saveCloudTarget(target)
      setSshKeyConfigured(saved.sshKeyConfigured)
      setMessage('Cloud target saved locally. Configure the server SSH key before deployment.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save cloud settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="size-full overflow-y-auto bg-muted/20">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-3">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Back to live services"
            onClick={onBack}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="font-semibold">Deployment target</h1>
            <p className="text-sm text-muted-foreground">
              Connection and repository settings for a release host.
            </p>
          </div>
        </div>
        <Button disabled={loading || saving} onClick={() => void save()}>
          <Save />
          Save deployment target
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-5 pb-10">
        <section className="rounded-lg border border-border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <Cloud className="size-4" />
                Deployment target
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the host used by reviewed, manual deployments.
              </p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" />
              {sshKeyConfigured
                ? 'Server SSH key configured'
                : 'Set ORSHIP_CLOUD_SSH_KEY_PATH on the server'}
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Target name">
              <Input
                value={target.name}
                onChange={(event) => setTarget({ ...target, name: event.target.value })}
              />
            </Field>
            <Field label="Target type">
              <NativeSelect
                className="w-full"
                value={target.targetType}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    targetType: event.target.value as CloudTargetUpdate['targetType'],
                  })
                }
              >
                <option value="local-docker">Local Docker</option>
                <option value="vps">VPS</option>
              </NativeSelect>
            </Field>
            <Field label="Local workspace path">
              <Input
                value={target.localWorkspacePath}
                onChange={(event) =>
                  setTarget({ ...target, localWorkspacePath: event.target.value })
                }
              />
            </Field>
            <Field label="VPS host">
              <Input
                placeholder="vps.example.com"
                value={target.vps?.host ?? ''}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    vps: { ...(target.vps ?? emptyTarget.vps!), host: event.target.value },
                  })
                }
              />
            </Field>
            <Field label="SSH user">
              <Input
                value={target.vps?.user ?? ''}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    vps: { ...(target.vps ?? emptyTarget.vps!), user: event.target.value },
                  })
                }
              />
            </Field>
            <Field label="SSH port">
              <Input
                max={65535}
                min={1}
                type="number"
                value={target.vps?.port ?? 22}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    vps: { ...(target.vps ?? emptyTarget.vps!), port: Number(event.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Deployment path">
              <Input
                value={target.vps?.deploymentPath ?? ''}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    vps: {
                      ...(target.vps ?? emptyTarget.vps!),
                      deploymentPath: event.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-background p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <GitBranch className="size-4" />
            Repository source
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Repository and branch used by the reviewed deployment scripts.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Repository URL">
              <Input
                placeholder="git@github.com:organization/codexsun.git"
                value={target.repository.url}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    repository: { ...target.repository, url: event.target.value },
                  })
                }
              />
            </Field>
            <Field label="Branch">
              <Input
                value={target.repository.branch}
                onChange={(event) =>
                  setTarget({
                    ...target,
                    repository: { ...target.repository, branch: event.target.value },
                  })
                }
              />
            </Field>
          </div>
        </section>
        {message ? (
          <p className="rounded-md border border-border bg-background px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}
      </main>
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
