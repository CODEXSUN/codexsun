import { type ReactNode, useState } from "react";
import { CopyIcon, ExternalLinkIcon, KeyRoundIcon, LaptopIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Button } from "@codexsun/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@codexsun/ui/components/sheet";
import { Switch } from "@codexsun/ui/components/switch";

export type CodexDeviceCode = { message: string; status: "idle" | "awaiting" | "connected" | "failed"; userCode?: string; verificationUrl?: string };
export type CodexConnectionSettingsProps = { connected: boolean; deviceCode: CodexDeviceCode; message: string; onConnectLocal: () => void; onCopyCode: () => void; onCopyUrl: () => void; onGenerateDeviceCode: () => void; onOpenBrowser: () => void; onOpenChange: (open: boolean) => void; open: boolean };

export function CodexConnectionSettings({ connected, deviceCode, message, onConnectLocal, onCopyCode, onCopyUrl, onGenerateDeviceCode, onOpenBrowser, onOpenChange, open }: CodexConnectionSettingsProps) {
  const [useDeviceCode, setUseDeviceCode] = useState(false);
  const [checkingLocal, setCheckingLocal] = useState(false);
  const awaitingCode = deviceCode.status === "awaiting";

  async function checkLocalCodex(): Promise<void> {
    setCheckingLocal(true);
    try {
      await onConnectLocal();
    } finally {
      setCheckingLocal(false);
    }
  }

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="gap-0 p-0 sm:max-w-md" side="right">
    <SheetHeader className="border-b pr-12"><SheetTitle>Codex connection</SheetTitle><SheetDescription>Choose how this Zetro workspace connects to Codex.</SheetDescription></SheetHeader>
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <section className="flex items-center gap-3" aria-live="polite"><span className={connected ? "size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129_/_0.13),0_0_12px_rgb(16_185_129_/_0.8)]" : "size-2 shrink-0 rounded-full bg-muted-foreground/50"} /><div className="min-w-0"><p className="text-sm font-medium">{connected ? "Connected" : "Not connected"}</p><p className="mt-0.5 text-sm text-muted-foreground">{message}</p></div></section>
      <ConnectionMethod title="Local Codex" description="Use the Codex CLI already installed on this computer." icon={<LaptopIcon className="size-4" />}><Button disabled={checkingLocal} variant="outline" onClick={checkLocalCodex}><RefreshCwIcon className={checkingLocal ? "animate-spin" : undefined} /> {checkingLocal ? "Checking local Codex" : "Check local Codex"}</Button></ConnectionMethod>
      <ConnectionMethod title="Device code" description="Sign in using a short-lived code in your browser." icon={<KeyRoundIcon className="size-4" />} trailing={<Switch aria-label="Use device-code connection" checked={useDeviceCode} onCheckedChange={setUseDeviceCode} />}>
        <Button disabled={!useDeviceCode} onClick={onGenerateDeviceCode}><KeyRoundIcon /> Generate device code</Button>
      </ConnectionMethod>
      {useDeviceCode && awaitingCode ? <div className="flex flex-col gap-3 rounded-md border border-border/70 p-3"><div className="flex items-center gap-2"><p className="flex-1 text-sm font-medium">One-time device code</p><Button aria-label="Copy device code" size="icon-xs" variant="ghost" onClick={onCopyCode}><CopyIcon /></Button></div><code className="w-fit rounded-sm border bg-muted px-3 py-2 text-base font-semibold tracking-[0.12em]">{deviceCode.userCode}</code><p className="text-sm text-muted-foreground">{deviceCode.message}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onOpenBrowser}><ExternalLinkIcon /> Open browser</Button><Button variant="outline" onClick={onCopyUrl}><CopyIcon /> Copy URL</Button></div><p className="text-sm leading-6 text-muted-foreground">This code is held only in running memory and is not added to Zetro history, storage, or logs.</p></div> : null}
      {deviceCode.status === "failed" ? <Alert variant="destructive"><ShieldCheckIcon /><AlertTitle>Device code unavailable</AlertTitle><AlertDescription>{deviceCode.message}</AlertDescription></Alert> : null}
    </div>
    <SheetFooter className="border-t"><Button className="w-full" disabled={checkingLocal} variant="outline" onClick={checkLocalCodex}><RefreshCwIcon className={checkingLocal ? "animate-spin" : undefined} /> {checkingLocal ? "Checking local Codex" : "Recheck local Codex"}</Button></SheetFooter>
  </SheetContent></Sheet>;
}

function ConnectionMethod({ children, description, icon, title, trailing }: { children: ReactNode; description: string; icon: ReactNode; title: string; trailing?: ReactNode }) {
  return <section className="flex flex-col gap-3 rounded-md border border-border/70 p-3"><div className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p></div>{trailing}</div>{children}</section>;
}
