import { RecordActionMenu } from "@/components/blocks/record-action-menu"

export function ListRowActions({
  active = true,
  itemLabel,
}: {
  active?: boolean
  itemLabel: string
}) {
  return (
    <RecordActionMenu
      active={active}
      itemLabel={itemLabel}
      className="size-8 rounded-md"
      onDelete={() => undefined}
      onEdit={() => undefined}
      onToggleActive={() => undefined}
    />
  )
}
