import { cn } from "@/lib/utils"

type CommercePriceProps = {
  amount: number
  compareAtAmount?: number | null
  className?: string
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function CommercePrice({
  amount,
  compareAtAmount,
  className,
}: CommercePriceProps) {
  const hasDiscount =
    typeof compareAtAmount === "number" && compareAtAmount > amount

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-base font-semibold tracking-tight text-foreground">
        {formatInr(amount)}
      </span>
      {hasDiscount ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatInr(compareAtAmount)}
        </span>
      ) : null}
    </div>
  )
}
