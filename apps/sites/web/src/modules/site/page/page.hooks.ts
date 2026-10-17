import { useCallback, useEffect, useState } from "react";
import type { PageContent, PageGateway, PageState } from "./page.types.js";
import { validatePageDraft } from "./page.schema.js";
export function usePageEditor(uuid: string, gateway: PageGateway | undefined) {
  const [state, setState] = useState<PageState | null>(null);
  const [draft, setDraft] = useState<PageContent | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = Boolean(state && draft && JSON.stringify(state.content) !== JSON.stringify(draft));
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      if (!gateway) throw new Error("Page API is not connected.");
      const value = await gateway.get(uuid);
      setState(value);
      setDraft(structuredClone(value.content));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this page.");
    } finally {
      setBusy(false);
    }
  }, [uuid, gateway]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const listener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  async function save() {
    if (!gateway || !state || !draft) return;
    const validation = validatePageDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await gateway.save(uuid, draft, state.revision);
      setState(value);
      setDraft(structuredClone(value.content));
      setMessage("Draft saved. Publish when it is ready for the website.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!gateway || !state || dirty) return;
    if (!window.confirm("Publish these client details and website sections to the public website?"))
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await gateway.publish(uuid, state.revision);
      setState(value);
      setMessage(
        "Page published. Check live publishing status for delivery progress."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publishing failed.");
    } finally {
      setBusy(false);
    }
  }
  return { state, draft, setDraft, error, busy, message, dirty, load, save, publish };
}
