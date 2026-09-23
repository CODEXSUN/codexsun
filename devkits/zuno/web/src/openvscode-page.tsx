import { useEffect, useState } from "react";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";

type EditorStatus = { configured: boolean; url?: string };

export function OpenVscodePage({ request }: { request: typeof fetch }) {
  const [status, setStatus] = useState<EditorStatus>();
  const [error, setError] = useState("");
  const refresh = async () => {
    try {
      const response = await request(`${import.meta.env.VITE_ZUNO_API_URL ?? ""}/api/v1/zuno/editor`);
      if (!response.ok) throw new Error("The editor status could not be loaded.");
      setStatus(await response.json() as EditorStatus); setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The editor status could not be loaded."); }
  };
  const openEditor = () => { if (status?.url) window.open(status.url, "_blank", "noopener,noreferrer"); };
  useEffect(() => { void refresh(); }, []);
  return <section className="mx-auto grid max-w-2xl gap-5 pt-8"><div><p className="text-sm text-muted-foreground">Workspace editor</p><h2 className="text-xl font-semibold">Code-server</h2></div>{error ? <p role="alert" className="text-destructive">{error}</p> : status?.configured && status.url ? <div className="grid gap-4 rounded border p-5"><p>Open the Zuno-protected editor for the selected workspace. Authentication remains at the platform proxy.</p><Button onClick={openEditor}>Open editor <ExternalLinkIcon /></Button></div> : <div className="grid gap-3 rounded border p-5"><p className="font-medium">Editor is not configured</p><p className="text-sm text-muted-foreground">Set the Zuno Code-server proxy URL, then start the isolated workspace editor container.</p></div>}<Button className="w-fit" variant="outline" onClick={() => void refresh()}><RefreshCwIcon />Refresh editor status</Button></section>;
}
