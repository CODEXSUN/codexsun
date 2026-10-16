import { Button } from "@codexsun/ui/components/button";
import { useState } from "react";
import type { CmsSite, SiteGateway } from "./site.types.js";

export function SiteRuntimeControls({
  site,
  gateway
}: {
  site: CmsSite;
  gateway: SiteGateway | undefined;
}) {
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const supported =
    site.themeKey === "portfolio-standard" ||
    (["logicx", "ramutex"].includes(site.slug) && site.themeKey === `portfolio-${site.slug}`);
  const canStart =
    local && supported && site.status === "active" && Boolean(site.port && gateway?.start);

  async function start() {
    if (!gateway?.start) return;
    setStarting(true);
    setFeedback("");
    setFailed(false);
    try {
      const result = await gateway.start(site.uuid);
      setFeedback(`Running on port ${result.port}. Use Open to view the site.`);
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "Client could not start.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canStart || starting}
          onClick={() => void start()}
        >
          {starting ? "Starting…" : "Start"}
        </Button>
        {site.port && local ? (
          <Button asChild size="sm" variant="outline">
            <a href={`http://127.0.0.1:${site.port}`} target="_blank" rel="noreferrer">
              Open :{site.port}
            </a>
          </Button>
        ) : null}
      </div>
      {feedback ? (
        <p
          role={failed ? "alert" : "status"}
          className={`text-xs ${failed ? "text-destructive" : "text-muted-foreground"}`}
        >
          {feedback}
        </p>
      ) : null}
      {!local ? (
        <p className="text-xs text-muted-foreground">
          Local development controls require a local Studio session.
        </p>
      ) : null}
    </div>
  );
}
