import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
export function WorkReportForm({
  body,
  onChange,
  onSubmit,
  pending
}: {
  body: string;
  onChange: (value: string) => void;
  onSubmit: (action: "report" | "check-in" | "check-out") => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-3">
      <Textarea
        disabled={pending}
        aria-label="Actions taken"
        placeholder="Report the actions taken"
        value={body}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || !body.trim()} onClick={() => onSubmit("report")}>
          Send report
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => onSubmit("check-in")}>
          Check in
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => onSubmit("check-out")}>
          Check out
        </Button>
      </div>
    </div>
  );
}
