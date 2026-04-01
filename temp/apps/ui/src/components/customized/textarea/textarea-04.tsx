import { Label } from "@ui/registry/ui/label";
import { Textarea } from "@ui/registry/ui/textarea";

export default function TextareaWithLabelDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here." />
    </div>
  );
}
