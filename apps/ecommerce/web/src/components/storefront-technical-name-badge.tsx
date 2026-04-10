import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { cn } from "@/lib/utils"

export function StorefrontTechnicalNameBadge({
  className,
  name,
}: {
  className?: string
  name: string
}) {
  return (
    <TechnicalNameBadge
      name={name}
      className={cn("absolute right-4 top-4 z-[70]", className)}
    />
  )
}

export function StorefrontTechnicalNameBadgeRow({
  className,
  names,
}: {
  className?: string
  names: string[]
}) {
  const uniqueNames = Array.from(new Set(names.filter((name) => name.trim().length > 0)))

  if (uniqueNames.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "absolute right-4 top-4 z-[70] flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2",
        className
      )}
    >
      {uniqueNames.map((name) => (
        <TechnicalNameBadge key={name} name={name} />
      ))}
    </div>
  )
}
