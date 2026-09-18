import { CopyIcon, ExternalLinkIcon, KeyRoundIcon, LaptopIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Button } from "@codexsun/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@codexsun/ui/components/sheet";

export type CodexDeviceCode = { message: string; status: "idle" | "awaiting" | "connected" | "failed"; userCode?: string; verificationUrl?: string };
export type CodexConnectionSettingsProps = { connected: boolean; deviceCode: CodexDeviceCode; message: string; onConnectLocal: () => void; onCopyCode: () => void; onCopyUrl: () => void; onGenerateDeviceCode: () => void; onOpenBrowser: () => void; onOpenChange: (open: boolean) => void; open: boolean };

export function CodexConnectionSettings({ connected, deviceCode, message, onConnectLocal, onCopyCode, onCopyUrl, onGenerateDeviceCode, onOpenBrowser, onOpenChange, open }: CodexConnectionSettingsProps) {
  const awaitingCode = deviceCode.status === "awaiting";
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="gap-0 p-0 sm:max-w-md" side="right">
    <SheetHeader className="border-b pr-12"><SheetTitle>Codex connection</SheetTitle><SheetDescription>Connect the locally installed Codex CLI.</SheetDescription></SheetHeader>
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
      <section className="flex items-center gap-3" aria-live="polite"><span className={connected ? "size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129_/_0.13),0_0_12px_rgb(16_185_129_/_0.8)]" : "size-2 shrink-0 rounded-full bg-muted-foreground/50"} /><div className="min-w-0"><p className="text-sm font-medium">{connected ? "Connected" : "Not connected"}</p><p className="mt-0.5 text-sm text-muted-foreground">{message}</p></div></section>
      <Alert><ShieldCheckIcon /><AlertTitle>{connected ? "Local Codex is ready" : "Connect installed Codex"}</AlertTitle><AlertDescription>{connected ? "Zetro can use this local Codex session for idea conversations." : "Check the installed CLI first, or create a one-time device code for browser sign-in."}</AlertDescription></Alert>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onConnectLocal}><LaptopIcon /> Connect local Codex</Button><Button onClick={onGenerateDeviceCode}><KeyRoundIcon /> Generate device code</Button></div>
      {awaitingCode ? <div className="flex flex-col gap-3 border-t pt-5"><div className="flex items-center gap-2"><p className="flex-1 text-sm font-medium">One-time device code</p><Button aria-label="Copy device code" size="icon-xs" variant="ghost" onClick={onCopyCode}><CopyIcon /></Button></div><code className="w-fit rounded-sm border bg-muted px-3 py-2 text-base font-semibold tracking-[0.12em]">{deviceCode.userCode}</code><p className="text-sm text-muted-foreground">{deviceCode.message}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onOpenBrowser}><ExternalLinkIcon /> Open browser</Button><Button variant="outline" onClick={onCopyUrl}><CopyIcon /> Copy URL</Button></div><p className="text-sm leading-6 text-muted-foreground">The code is one-time and is kept only in running memory. It is never written to Zetro history, storage, or logs.</p></div> : null}
    </div>
    <SheetFooter className="border-t"><Button className="w-full" variant="outline" onClick={onConnectLocal}><RefreshCwIcon /> Recheck local Codex</Button></SheetFooter>
  </SheetContent></Sheet>;
}
