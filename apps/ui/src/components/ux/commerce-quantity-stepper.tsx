import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CommerceQuantityStepperProps = {
  value: number
  min?: number
  max?: number
  onChange: (nextValue: number) => void
  className?: string
}

export function CommerceQuantityStepper({
  value,
  min = 1,
  max = 20,
  onChange,
  className,
}: CommerceQuantityStepperProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/90 p-1 shadow-sm",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-9 text-center text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
