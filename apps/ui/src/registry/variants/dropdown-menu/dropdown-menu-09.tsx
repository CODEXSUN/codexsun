"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"

const rows = [
  {
    id: "CTY-104",
    name: "Coimbatore",
    state: "Tamil Nadu",
    active: true,
  },
  {
    id: "CTY-212",
    name: "Mysuru",
    state: "Karnataka",
    active: false,
  },
]

export default function DropdownMenu09() {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/70 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.id}</p>
                </div>
              </TableCell>
              <TableCell>{row.state}</TableCell>
              <TableCell>
                <Badge variant={row.active ? "secondary" : "outline"}>
                  {row.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <RecordActionMenu
                  active={row.active}
                  itemLabel={row.name}
                  onDelete={() => undefined}
                  onEdit={() => undefined}
                  onToggleActive={() => undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
