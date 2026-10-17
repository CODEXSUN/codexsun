import { useState } from "react";

import { Button } from "@codexsun/ui/components/button";

import { WorkspaceSelect } from "@codexsun/ui/workspace/select";

import { enquiryStatuses, type EnquiryDetail } from "./enquiry.types.js";

export function EnquiryForm({
  record,
  busy,
  onSave
}: {
  record: EnquiryDetail;
  busy: boolean;
  onSave: (status: EnquiryDetail["status"]) => void;
}) {
  const [status, setStatus] = useState(record.status);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(status);
      }}
    >
      <label className="grid gap-2 text-sm">
        Enquiry status
        <WorkspaceSelect
          ariaLabel="Enquiry status"
          value={status}
          disabled={busy || Boolean(record.deletedAt)}
          options={enquiryStatuses}
          onValueChange={(value) => {
            if (enquiryStatuses.some((s) => s.value === value))
              setStatus(value as EnquiryDetail["status"]);
          }}
        />
      </label>
      <Button
        type="submit"
        disabled={busy || Boolean(record.deletedAt) || status === record.status}
      >
        Save status
      </Button>
    </form>
  );
}
