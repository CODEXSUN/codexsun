import { ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "./enquiry.view-utils";
import type { EnquiryLocation } from "./enquiry.types";

export function EnquiryLocations({
  locations,
  loading,
  error,
  onRetry
}: {
  locations: EnquiryLocation[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <section className="min-h-[24rem] bg-card p-4">
      <p className="mb-4 text-sm text-muted-foreground">
        GPS locations logged from mobile actions and manual check-ins for this enquiry.
      </p>
      {loading ? <p className="text-sm text-muted-foreground">Loading locations…</p> : null}
      {error ? (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <span className="flex-1">{error.message}</span>
          <Button size="sm" type="button" variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : null}
      {!loading && !error && locations.length === 0 ? (
        <WorkspaceTableEmptyState>No locations have been logged.</WorkspaceTableEmptyState>
      ) : null}
      {locations.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border/70">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                {["Captured", "Coordinates", "Accuracy", "Logged by"].map((label) => (
                  <th className="px-3 py-2" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr className="border-t border-border/70" key={location.id}>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDateTime(location.capturedAt)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      title="Open in Google Maps"
                    >
                      <MapPin className="size-3.5 text-primary" />
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      <ExternalLink className="size-3 opacity-60" />
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    {location.accuracyMeters == null
                      ? "—"
                      : `±${Math.round(location.accuracyMeters)} m`}
                  </td>
                  <td className="px-3 py-2">{location.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
