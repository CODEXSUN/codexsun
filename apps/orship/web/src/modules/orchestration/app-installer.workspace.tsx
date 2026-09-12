import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Checkbox } from '@codexsun/ui/components/checkbox'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@codexsun/ui/components/select'
import { AlertCircle, ArrowRight, Box, CheckCircle2, Download, Loader2, Package, Server, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useAvailableApplications,
  useInstallApplication,
  useDeployApplication,
} from './orchestration.hooks'
import type { AvailableApplication } from './orchestration.types'

interface AddonOption {
  id: string
  label: string
  version: string
  targetApp: string
}

export function AppInstallerWorkspace() {
  const applications = useAvailableApplications()
  const installApp = useInstallApplication()
  const deployApp = useDeployApplication()

  const [selectedApp, setSelectedApp] = useState<AvailableApplication | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [environment, setEnvironment] = useState<'development' | 'production'>('development')
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [portOverrides, setPortOverrides] = useState<Record<string, number>>({})
  const [message, setMessage] = useState<string>()
  const [installStep, setInstallStep] = useState<'select' | 'configure' | 'installing' | 'deploying' | 'done'>('select')

  const allAddons: AddonOption[] = applications.data?.applications.flatMap((app) =>
    app.availableAddons.map((addon) => ({
      id: addon.id,
      label: `${addon.id} (for ${addon.targetApplication})`,
      version: addon.version,
      targetApp: addon.targetApplication,
    })),
  ) ?? []

  const filteredAddons = selectedApp
    ? allAddons.filter((a) => a.targetApp === selectedApp.id)
    : []

  const requiredApps = selectedApp
    ? getRequiredApps(selectedApp, applications.data?.applications ?? [])
    : []

  useEffect(() => {
    if (applications.data?.applications.length === 1 && !selectedApp) {
      setSelectedApp(applications.data.applications[0])
    }
  }, [applications.data, selectedApp])

  const handleInstall = async () => {
    if (!selectedApp || !customerId) {
      setMessage('Please select an application and enter a customer ID')
      return
    }

    setMessage(undefined)
    setInstallStep('installing')

    try {
      const result = await installApp.mutateAsync({
        applicationId: selectedApp.id,
        customerId,
        selectedAddons: [...selectedAddons],
        portOverrides,
        environment,
      })

      if (result.success) {
        setMessage(`Installation prepared: ${result.message}`)
        setInstallStep('deploying')
      } else {
        setMessage(`Installation failed: ${result.message}`)
        setInstallStep('configure')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not install application')
      setInstallStep('configure')
    }
  }

  const handleDeploy = async () => {
    if (!selectedApp || !customerId) return

    setMessage(undefined)

    try {
      const profileId = `client-${customerId}-${selectedApp.id}`
      const result = await deployApp.mutateAsync(profileId)

      if (result.success) {
        setMessage(`Deployment started: ${result.message}`)
        setInstallStep('done')
      } else {
        setMessage(`Deployment failed: ${result.message}`)
        setInstallStep('configure')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not deploy application')
      setInstallStep('configure')
    }
  }

  const reset = () => {
    setSelectedApp(null)
    setCustomerId('')
    setEnvironment('development')
    setSelectedAddons(new Set())
    setPortOverrides({})
    setMessage(undefined)
    setInstallStep('select')
  }

  useEffect(() => {
    if (installStep === 'deploying') {
      handleDeploy()
    }
  }, [installStep, selectedApp, customerId])

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">App Installer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Install and configure applications for clients using the shared prerequisites stack.
          </p>
        </div>
        {installStep !== 'select' && (
          <Button variant="outline" onClick={reset} disabled={installApp.isPending || deployApp.isPending}>
            <XCircle className="mr-2 h-4 w-4" />Start Over
          </Button>
        )}
      </header>

      {message && (
        <div className="rounded-md bg-muted p-4 text-sm">
          {message}
        </div>
      )}

      {installStep === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4" />Select Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(applications.data?.applications ?? []).map((app) => (
                <Card
                  key={app.id}
                  className={`cursor-pointer transition-all ${selectedApp?.id === app.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => { setSelectedApp(app); setInstallStep('configure'); }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Box className="size-4" />{app.id}
                      </span>
                      <Badge variant="secondary">{app.version}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>{app.components.length} components</p>
                    <p>{app.requires.length > 0 ? `Requires: ${app.requires.join(', ')}` : 'No dependencies'}</p>
                    <p>{app.availableAddons.length} available addons</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {applications.isLoading && <p className="text-sm text-muted-foreground">Loading applications...</p>}
          </CardContent>
        </Card>
      )}

      {installStep === 'configure' && selectedApp && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="size-4" />Configure Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Customer ID</Label>
                  <Input
                    placeholder="client-acme"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Environment</Label>
                  <Select value={environment} onValueChange={(v) => v && setEnvironment(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {requiredApps.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Package className="size-4" />Required Applications (auto-installed)
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {requiredApps.map((app) => (
                      <Badge key={app.id} variant="outline">{app.id}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {filteredAddons.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Server className="size-4" />Available Addons
                  </Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {filteredAddons.map((addon) => (
                      <label key={addon.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedAddons.has(addon.id)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedAddons)
                            checked ? next.add(addon.id) : next.delete(addon.id)
                            setSelectedAddons(next)
                          }}
                        />
                        <span className="text-sm">{addon.label} <span className="text-muted-foreground">v{addon.version}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.components.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Server className="size-4" />Port Overrides (optional)
                  </Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
{selectedApp.components.map((comp: AvailableApplication['components'][0]) => (
                      <div key={comp.id} className="grid gap-2">
                        <Label className="text-sm">{comp.id} (default: {comp.defaultPort})</Label>
                        <Input
                          type="number"
                          min={6000}
                          max={6999}
                          placeholder="Override port"
                          value={portOverrides[comp.id] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setPortOverrides((prev) => {
                              const next = { ...prev }
                              if (val) {
                                next[comp.id] = Number(val)
                              } else {
                                delete next[comp.id]
                              }
                              return next
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={installApp.isPending || !customerId}
                  onClick={handleInstall}
                  size="lg"
                >
                  {installApp.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />Prepare Installation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="size-4" />{selectedApp.id} Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedApp.components.map((comp) => (
                  <Card key={comp.id} size="sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          {comp.kind === 'api' ? <Server className="size-4" /> : comp.kind === 'web' ? <Box className="size-4" /> : <Package className="size-4" />}
                          {comp.id}
                        </span>
                        <Badge variant={comp.kind === 'api' ? 'default' : comp.kind === 'web' ? 'secondary' : 'outline'}>
                          {comp.kind}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                      <p>Runtime: {comp.runtime}</p>
                      <p>Port: {portOverrides[comp.id] ?? comp.defaultPort}</p>
                      {comp.dependsOn.length > 0 && <p>Depends on: {comp.dependsOn.join(', ')}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {installStep === 'installing' && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-lg">Preparing installation...</p>
              <p className="mt-2 text-sm text-muted-foreground">Generating deployment profile and Docker Compose</p>
            </div>
          </CardContent>
        </Card>
      )}

      {installStep === 'deploying' && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-lg">Deploying application...</p>
              <p className="mt-2 text-sm text-muted-foreground">Starting Docker containers</p>
            </div>
          </CardContent>
        </Card>
      )}

      {installStep === 'done' && selectedApp && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-4" />Installation Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Application <strong>{selectedApp.id}</strong> has been deployed for customer <strong>{customerId}</strong>.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" onClick={reset}>
                <XCircle className="mr-2 h-4 w-4" />Install Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {applications.isError && (
        <Card className="border-red-500">
          <CardContent className="flex items-center gap-2 text-red-600">
            <AlertCircle className="size-4" />
            <span>Failed to load applications: {applications.error?.message}</span>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function getRequiredApps(app: AvailableApplication, allApps: AvailableApplication[]): AvailableApplication[] {
  const required = new Set<string>()
  const visit = (appId: string) => {
    if (required.has(appId)) return
    const found = allApps.find((a) => a.id === appId)
    if (!found) return
    for (const req of found.requires) {
      required.add(req)
      visit(req)
    }
  }
  for (const req of app.requires) visit(req)
  return allApps.filter((a) => required.has(a.id))
}