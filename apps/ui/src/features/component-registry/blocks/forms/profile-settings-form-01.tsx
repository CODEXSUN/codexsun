import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export default function ProfileSettingsForm01() {
  return (
    <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-settings-name">Display name</Label>
            <Input id="profile-settings-name" placeholder="Ava Patel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-settings-role">Job title</Label>
            <Input id="profile-settings-role" placeholder="Operations lead" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-settings-bio">Bio</Label>
          <Textarea id="profile-settings-bio" placeholder="Short profile summary" />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Weekly digest</p>
            <p className="text-sm text-muted-foreground">
              Send a summary of account activity every Friday.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Button>Save changes</Button>
      </CardContent>
    </Card>
  )
}
