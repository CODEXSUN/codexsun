import { useMutation } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import {
  WorkspaceShowLayout,
  WorkspaceShowCard,
  WorkspaceDetailTable
} from "@codexsun/ui/workspace/show";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMarketingTransport } from "../../transport";
import { checkConsentEligibility } from "./consent.services";
import type { ConsentRecord } from "./consent.types";
const reasonLabels: Record<string, string> = {
  brand_inactive: "The brand is inactive.",
  consent_unavailable: "Consent evidence is unavailable.",
  consent_missing: "No promotional grant was recorded.",
  consent_withdrawn: "Promotional consent was withdrawn.",
  consent_expired: "Promotional consent expired.",
  consent_changed: "Consent changed during this check. Check again.",
  crm_unavailable: "CRM policy is unavailable or access is disabled.",
  mail_unavailable: "Mail safety is unavailable or access is disabled.",
  "crm:do_not_contact": "CRM has a do-not-contact restriction.",
  "crm:legacy_preference_requires_review": "CRM contact preferences require review.",
  "mail:complaint": "Mail recorded a complaint.",
  "mail:hard_bounce": "Mail recorded a hard bounce.",
  "mail:policy": "Mail delivery policy blocks this recipient."
};
export function ConsentShow({ record, onClose }: { record: ConsentRecord; onClose: () => void }) {
  const api = useMarketingTransport();
  const check = useMutation({ mutationFn: () => checkConsentEligibility(api, record) });
  return (
    <WorkspaceShowLayout>
      <WorkspaceShowCard title={record.recipient}>
        <WorkspaceDetailTable
          rows={[
            ["Action", record.action],
            ["Brand", record.brandUuid],
            ["Purpose", "Promotional email"],
            ["Notice version", record.noticeVersion],
            ["Source", record.source],
            ["Evidence reference", record.evidence],
            ["Evidence time", formatDateTime(record.occurredAt)],
            ["Expiry", record.expiresAt ? formatDateTime(record.expiresAt) : "No expiry recorded"]
          ]}
        />
        <div className="flex flex-wrap gap-2 p-4">
          <Button onClick={() => check.mutate()} disabled={check.isPending}>
            {check.isPending ? "Checking…" : "Check eligibility"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Back to list
          </Button>
        </div>
        {check.error ? (
          <p role="alert" className="p-4 text-destructive">
            {check.error.message}
          </p>
        ) : null}
        {check.data && !check.isPending ? (
          <div role="status" className="space-y-2 p-4">
            <p className="font-medium">
              {check.data.eligible ? "Eligible at check time" : "Promotional email blocked"}
            </p>
            {check.data.reasons.map((reason) => (
              <p key={reason}>
                {reasonLabels[reason] ?? "A delivery policy blocks this recipient."}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">
              Checked {formatDateTime(check.data.checkedAt)}. Recheck at execution. This assessment
              does not send email.
            </p>
          </div>
        ) : null}
      </WorkspaceShowCard>
      <WorkspaceShowCard title="Activity">
        <WorkspaceDetailTable
          rows={[
            ["Evidence", record.uuid],
            ["Recorded action", record.action],
            ["Recorded by", record.createdBy],
            ["Recorded at", formatDateTime(record.createdAt)]
          ]}
        />
        <p className="p-4 text-sm text-muted-foreground">
          Evidence is immutable. New grants and withdrawals create new entries.
        </p>
      </WorkspaceShowCard>
    </WorkspaceShowLayout>
  );
}
