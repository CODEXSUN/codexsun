import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Label } from '../../components/label'
import { Separator } from '../../components/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../../components/sheet'
import { Switch } from '../../components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/tabs'

export type AgentProviderSettingsItem = {
  apiKey?: string
  apiKeyConfigured?: boolean
  apiKeyHint?: string
  apiKeyLabel?: string
  apiKeyPlaceholder?: string
  connectionMessage?: string
  connectionStatus?: 'connected' | 'error' | 'idle' | 'checking'
  description: string
  enabled: boolean
  endpoint: string
  icon: LucideIcon
  id: string
  model: string
  modelOptions?: readonly string[]
  name: string
}

export type AgentProviderVerificationResult = {
  message: string
  models?: readonly string[]
  status: 'connected' | 'error'
}

export type AgentProviderSmokeTestResult = {
  latencyMs: number
  message: string
  model?: string
  response?: string
  status: 'connected' | 'error'
}

export type AgentProviderSettingsProps = {
  embedded?: boolean
  onClose?: () => void
  onOpenChange: (open: boolean) => void
  onSave: (providers: readonly AgentProviderSettingsItem[]) => void | Promise<void>
  onSmokeTestProvider?: (provider: AgentProviderSettingsItem, signal: AbortSignal) => Promise<AgentProviderSmokeTestResult>
  onVerifyProvider?: (provider: AgentProviderSettingsItem, signal: AbortSignal) => Promise<AgentProviderVerificationResult>
  open: boolean
  providers: readonly AgentProviderSettingsItem[]
}

export function AgentProviderSettings({ embedded = false, onClose, onOpenChange, onSave, onSmokeTestProvider, onVerifyProvider, open, providers }: AgentProviderSettingsProps) {
  const [draft, setDraft] = useState<AgentProviderSettingsItem[]>([])
  const [activeProviderId, setActiveProviderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [smokeResult, setSmokeResult] = useState<AgentProviderSmokeTestResult | undefined>()
  const verificationController = useRef<AbortController | null>(null)
  const smokeController = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft(providers.map((provider) => ({ ...provider })))
    setActiveProviderId((current) => current || providers[0]?.id || '')
    setSmokeResult(undefined)
  }, [open, providers])

  const activeProvider = draft.find((provider) => provider.id === activeProviderId) ?? draft[0]

  function updateProvider(changes: Partial<AgentProviderSettingsItem>): void {
    if (!activeProvider) return
    setDraft((items) => items.map((provider) => provider.id === activeProvider.id ? { ...provider, ...changes } : provider))
  }

  async function save(): Promise<void> {
    setSaving(true)
    try {
      await onSave(draft)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function verifyProvider(provider: AgentProviderSettingsItem): Promise<void> {
    if (!onVerifyProvider) return
    verificationController.current?.abort()
    const controller = new AbortController()
    verificationController.current = controller
    updateProvider({ connectionStatus: 'checking', connectionMessage: 'Checking connection…' })
    try {
      const result = await onVerifyProvider(provider, controller.signal)
      setDraft((items) => items.map((item) => item.id === provider.id ? {
        ...item,
        connectionStatus: result.status,
        connectionMessage: result.message,
        modelOptions: result.models ?? item.modelOptions,
      } : item))
    } catch (error) {
      const stopped = controller.signal.aborted
      setDraft((items) => items.map((item) => item.id === provider.id ? { ...item, connectionStatus: stopped ? 'idle' : 'error', connectionMessage: stopped ? 'Verification stopped.' : error instanceof Error ? error.message : 'Connection verification failed.' } : item))
    } finally {
      if (verificationController.current === controller) verificationController.current = null
    }
  }

  function stopVerification(): void {
    const controller = verificationController.current
    if (!controller) return
    controller.abort()
    setDraft((items) => items.map((item) => item.id === activeProviderId ? { ...item, connectionStatus: 'idle', connectionMessage: 'Verification stopped.' } : item))
    verificationController.current = null
  }

  async function smokeTestProvider(provider: AgentProviderSettingsItem): Promise<void> {
    if (!onSmokeTestProvider) return
    smokeController.current?.abort()
    const controller = new AbortController()
    smokeController.current = controller
    setSmokeResult({ latencyMs: 0, message: 'Running smoke test…', status: 'error' })
    try {
      setSmokeResult(await onSmokeTestProvider(provider, controller.signal))
    } catch (error) {
      setSmokeResult({ latencyMs: 0, message: controller.signal.aborted ? 'Smoke test stopped.' : error instanceof Error ? error.message : 'Smoke test failed.', status: 'error' })
    } finally {
      if (smokeController.current === controller) smokeController.current = null
    }
  }

  const content = <>
    {draft.length ? (
      <Tabs className="min-h-0 flex-1" orientation="vertical" value={activeProvider?.id} onValueChange={(value) => setActiveProviderId(value)}>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:flex-row sm:p-6 lg:p-8">
          <TabsList className="h-fit w-full shrink-0 flex-col items-stretch gap-1 bg-transparent p-0 sm:w-56" variant="line">
            {draft.map((provider) => <TabsTrigger key={provider.id} className="min-h-10 w-full justify-start rounded-none px-3 font-normal text-muted-foreground after:hidden data-active:bg-muted/70 data-active:text-foreground data-active:before:absolute data-active:before:inset-y-0 data-active:before:left-0 data-active:before:w-0.5 data-active:before:bg-foreground" value={provider.id}><provider.icon className="size-4" />{provider.name}</TabsTrigger>)}
          </TabsList>
          {activeProvider ? <TabsContent className="min-w-0 flex-1 rounded-lg border p-5 sm:p-6" value={activeProvider.id}><ProviderPanel onChange={updateProvider} onSmokeTest={onSmokeTestProvider ? () => void smokeTestProvider(activeProvider) : undefined} onStop={stopVerification} onVerify={() => verifyProvider(activeProvider)} provider={activeProvider} smokeResult={smokeResult} /></TabsContent> : null}
        </div>
      </Tabs>
    ) : <p className="p-4 text-sm text-muted-foreground">No providers are configured.</p>}
  </>

  if (embedded) return <section aria-label="Provider settings" className="flex size-full min-h-0 flex-col overflow-hidden bg-background">
    <header className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5 lg:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Provider settings</h1>
      <div className="flex shrink-0 items-center gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Back to workspace</Button><Button disabled={!draft.length || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save provider settings'}</Button></div>
    </header>
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">{content}</div>
  </section>

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="gap-0 p-0 sm:max-w-xl" side="right">
      <SheetHeader className="border-b pr-12"><SheetTitle>Provider settings</SheetTitle></SheetHeader>
      {content}
      <SheetFooter className="border-t"><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!draft.length || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save provider settings'}</Button></SheetFooter>
    </SheetContent>
  </Sheet>
}

function ProviderPanel({ onChange, onSmokeTest, onStop, onVerify, provider, smokeResult }: { onChange: (changes: Partial<AgentProviderSettingsItem>) => void; onSmokeTest?: () => void; onStop: () => void; onVerify: () => Promise<void>; provider: AgentProviderSettingsItem; smokeResult?: AgentProviderSmokeTestResult }) {
  const [showKey, setShowKey] = useState(false)
  const Icon = provider.icon

  return <div className="flex flex-col gap-5">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted"><Icon className="size-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="text-base font-semibold">{provider.name}</h2></div>
      <Badge variant={provider.connectionStatus === 'connected' ? 'secondary' : 'outline'}>{provider.connectionStatus === 'connected' ? 'Connected' : provider.enabled ? 'Enabled' : 'Disabled'}</Badge>
    </div>
    <Separator />
    <div className="flex items-center justify-between gap-3"><Label htmlFor={`${provider.id}-enabled`}>Use provider</Label><Switch id={`${provider.id}-enabled`} checked={provider.enabled} onCheckedChange={(enabled) => onChange({ enabled })} /></div>
    <div className="grid gap-2"><Label htmlFor={`${provider.id}-endpoint`}>Endpoint</Label><Input id={`${provider.id}-endpoint`} value={provider.endpoint} onChange={(event) => onChange({ endpoint: event.target.value })} /></div>
    <div className="grid gap-2"><Label htmlFor={`${provider.id}-model`}>Default model</Label>{provider.modelOptions?.length ? <Select value={provider.model} onValueChange={(model) => onChange({ model: model ?? '' })}><SelectTrigger id={`${provider.id}-model`} className="w-full"><SelectValue placeholder="Select a model" /></SelectTrigger><SelectContent>{provider.modelOptions.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}</SelectContent></Select> : <Input id={`${provider.id}-model`} value={provider.model} onChange={(event) => onChange({ model: event.target.value })} />}</div>
    <div className="grid gap-2"><Label htmlFor={`${provider.id}-key`}>{provider.apiKeyLabel ?? 'API key'}</Label><div className="flex gap-2"><Input id={`${provider.id}-key`} type={showKey ? 'text' : 'password'} value={provider.apiKey ?? ''} placeholder={provider.apiKeyPlaceholder ?? (provider.apiKeyConfigured ? 'Configured in runtime' : 'Not configured')} onChange={(event) => onChange({ apiKey: event.target.value, apiKeyConfigured: Boolean(event.target.value) })} /><Button aria-label={showKey ? 'Hide API key' : 'Show API key'} size="icon-sm" variant="outline" onClick={() => setShowKey((value) => !value)}>{showKey ? <EyeOff /> : <Eye />}</Button></div></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div className="flex min-w-0 items-center gap-2 text-sm">{provider.connectionStatus === 'connected' ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}<span className={provider.connectionStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{provider.connectionMessage ?? 'Not verified'}</span></div><div className="flex items-center gap-2">{onSmokeTest ? <Button disabled={provider.connectionStatus !== 'connected'} variant="outline" onClick={onSmokeTest}>{smokeResult?.message === 'Running smoke test…' ? 'Testing…' : 'Smoke test'}</Button> : null}{provider.connectionStatus === 'checking' ? <Button variant="outline" onClick={onStop}>Stop</Button> : <Button variant="outline" onClick={() => void onVerify()}>{provider.connectionStatus === 'connected' ? 'Verify again' : 'Connect and verify'}</Button>}</div></div>
    {smokeResult ? <div className={`rounded-md border px-3 py-2 text-sm ${smokeResult.status === 'connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-destructive/30 bg-destructive/5 text-destructive'}`} role="status"><div>{smokeResult.message}{smokeResult.latencyMs > 0 ? ` (${smokeResult.latencyMs} ms)` : ''}</div>{smokeResult.response ? <div className="mt-1 break-words font-mono text-xs">{smokeResult.response}</div> : null}</div> : null}
  </div>
}
