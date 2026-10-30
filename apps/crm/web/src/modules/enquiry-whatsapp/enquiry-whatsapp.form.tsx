import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
export function EnquiryWhatsAppForm({
  message,
  onChange,
  onSubmit,
  pending,
  mobile
}: {
  message: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  mobile: string | null;
}) {
  return (
    <div className="space-y-3">
      <Textarea
        aria-label="WhatsApp message"
        placeholder="Write your WhatsApp message�"
        value={message}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        disabled={pending}
      />
      <p className="text-xs text-muted-foreground">
        {mobile
          ? `To ${mobile}. Review and send in WhatsApp. The log records this handoff, not delivery.`
          : "Add a valid customer mobile number."}
      </p>
      <Button
        className="w-full"
        disabled={pending || !mobile || !message.trim()}
        onClick={onSubmit}
      >
        {pending ? "Preparing�" : "Send WhatsApp"}
      </Button>
    </div>
  );
}
