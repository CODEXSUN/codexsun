import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function SupportRequestForm01() {
  return (
    <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
      <CardContent className="grid gap-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="support-request-name">Name</Label>
            <Input id="support-request-name" placeholder="Ava Patel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-request-email">Email</Label>
            <Input
              id="support-request-email"
              type="email"
              placeholder="ava@company.com"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="ops">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-request-details">Details</Label>
          <Textarea
            id="support-request-details"
            placeholder="Describe the request..."
          />
        </div>
        <Label htmlFor="support-request-updates" className="gap-3">
          <Checkbox id="support-request-updates" defaultChecked />
          Email me updates about this request
        </Label>
        <Button>Submit request</Button>
      </CardContent>
    </Card>
  )
}
