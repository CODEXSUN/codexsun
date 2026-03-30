import { Check, Copy } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

export function CopyCodeButton({
  code,
  iconOnly = false,
}: {
  code: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <Button
      type="button"
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon-sm" : "sm"}
      className={iconOnly ? undefined : "gap-2"}
      onClick={() => void handleCopy()}
      aria-label={copied ? "Code copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {iconOnly ? null : copied ? "Copied" : "Copy"}
    </Button>
  )
}
