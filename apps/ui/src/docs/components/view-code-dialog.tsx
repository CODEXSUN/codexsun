import { Code2, Copy } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CopyCodeButton } from "@/docs/components/copy-code-button"

type ViewCodeDialogProps = {
  code: string
  description: string
  title: string
}

export function ViewCodeDialog({
  code,
  description,
  title,
}: ViewCodeDialogProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`View code for ${title}`}
          title="View code"
        >
          <Code2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5 p-0 sm:max-h-[85vh]">
        <DialogHeader className="border-b border-border/60 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <CopyCodeButton code={code} />
          </div>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-zinc-950 text-zinc-100">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              <Copy className="size-4" />
              Component code
            </div>
            <pre className="max-h-[58vh] overflow-auto p-4 text-sm leading-7">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
