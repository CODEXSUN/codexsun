import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function FilterToolbar01() {
  return (
    <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-card/80 p-5 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
      <Input placeholder="Search by customer, order, or owner" />
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Badge variant="outline">24 results</Badge>
        <Button variant="outline">Export</Button>
      </div>
      <div className="lg:col-span-3">
        <div className="flex flex-wrap gap-2">
          <Badge>All</Badge>
          <Badge variant="outline">Active</Badge>
          <Badge variant="outline">Flagged</Badge>
        </div>
      </div>
    </div>
  )
}
