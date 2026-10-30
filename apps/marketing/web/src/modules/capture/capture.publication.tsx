import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import type { CaptureRecord } from "./capture.types";

export function CapturePublication({ record }: { record: CaptureRecord }) {
  const api = useMarketingTransport();
  const publication = useMutation({
    mutationFn: () =>
      api.post<{ path: string; expiresAt: string }>(
        "/marketing/captures/" + record.uuid + "/publish-binding",
        {}
      )
  });
  return (
    <section className="space-y-3 border-t p-4">
      <h3 className="font-medium">Website capture</h3>
      <p className="text-sm text-muted-foreground">
        The website domain must be verified for this tenant. Republish after a notice or origin
        change. Configure the private binding URL in the Sites runtime. The public form is served at
        /marketing/capture.
      </p>
      <Button
        variant="outline"
        disabled={publication.isPending || record.status !== "active"}
        onClick={() => publication.mutate()}
      >
        Publish capture binding
      </Button>
      {publication.error ? (
        <WorkspaceFormBanner title="Unable to publish" tone="error">
          {publication.error.message}
        </WorkspaceFormBanner>
      ) : null}
      {publication.data ? (
        <>
          <p className="text-sm break-all">{api.publicUrl(publication.data.path)}</p>
          <p className="text-xs text-muted-foreground">
            Expires {formatDateTime(publication.data.expiresAt)}
          </p>
          <Button
            variant="outline"
            onClick={() =>
              void navigator.clipboard.writeText(api.publicUrl(publication.data!.path))
            }
          >
            Copy capture URL
          </Button>
        </>
      ) : null}
    </section>
  );
}
