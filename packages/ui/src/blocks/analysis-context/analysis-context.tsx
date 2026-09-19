import { FolderSearchIcon, ShieldCheckIcon } from "lucide-react";

export function AnalysisContext({ root }: { root?: string | null }) {
  if (!root) return null;
  return <div className="mx-auto mb-3 flex w-4/5 items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"><FolderSearchIcon className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">Read-only project analysis: {root}</span><span className="flex shrink-0 items-center gap-1"><ShieldCheckIcon className="size-3.5" /> No writes</span></div>;
}
