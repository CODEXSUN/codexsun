import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function QuantitySelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => onChange(Math.max(1, value - 1))}>
        <MinusIcon className="size-4" />
      </Button>
      <div className="min-w-12 rounded-full border border-border/70 bg-background px-4 py-2 text-center text-sm font-medium">{value}</div>
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => onChange(value + 1)}>
        <PlusIcon className="size-4" />
      </Button>
    </div>
  )
}
