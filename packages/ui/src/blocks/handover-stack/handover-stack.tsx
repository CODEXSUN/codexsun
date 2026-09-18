import { ClipboardCheckIcon, Layers3Icon, XIcon } from "lucide-react";

import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { ScrollArea } from "@codexsun/ui/components/scroll-area";
import { Separator } from "@codexsun/ui/components/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@codexsun/ui/components/sheet";

export type HandoverStackItem = {
  content: string;
  id: string;
};

export type HandoverStackProps = {
  items: readonly HandoverStackItem[];
  onConsolidate: () => void;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  open: boolean;
  working?: boolean;
};

export function HandoverStack({ items, onConsolidate, onOpenChange, onRemove, open, working }: HandoverStackProps) {
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="gap-0 p-0 sm:max-w-md" side="right">
      <SheetHeader className="border-b pr-12">
        <div className="flex items-center gap-2"><SheetTitle>Handover stack</SheetTitle><Badge variant="secondary">{items.length}</Badge></div>
        <SheetDescription>Selected Zetro responses, ready to consolidate into one revised idea.</SheetDescription>
      </SheetHeader>
      <ScrollArea className="min-h-0 flex-1"><div className="flex flex-col p-4">
        {items.length ? items.map((item, index) => <section key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2"><Layers3Icon className="size-3.5 text-muted-foreground" /><p className="flex-1 text-sm font-medium">Response {index + 1}</p><Button aria-label={`Remove response ${index + 1}`} size="icon-xs" variant="ghost" onClick={() => onRemove(item.id)}><XIcon /></Button></div>
          <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">{item.content}</p>
          <code className="text-xs text-muted-foreground">{item.id}</code>
          {index < items.length - 1 ? <Separator className="mt-1" /> : null}
        </section>) : <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center"><Layers3Icon className="size-5 text-muted-foreground" /><p className="text-sm font-medium">No responses collected</p><p className="max-w-56 text-sm text-muted-foreground">Use the stack icon below any Zetro response to collect it here.</p></div>}
      </div></ScrollArea>
      <SheetFooter className="border-t"><Button className="w-full" disabled={!items.length || working} onClick={onConsolidate}><ClipboardCheckIcon /> {working ? "Consolidating…" : "Consolidate revised idea"}</Button></SheetFooter>
    </SheetContent>
  </Sheet>;
}
