import { useCallback, useEffect, useState } from "react";
import type { BlogGateway, BlogRecord, BlogContent } from "./blog.types.js";
export function useBlogEditor(siteUuid: string, gateway: BlogGateway | undefined) {
  const [records, setRecords] = useState<BlogRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      if (!gateway) throw new Error("Blog API is not connected.");
      setRecords(await gateway.list(siteUuid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load blogs.");
    } finally {
      setBusy(false);
    }
  }, [siteUuid, gateway]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(uuid: string | null, content: BlogContent, revision: number) {
    if (!gateway) throw new Error("Blog API is not connected.");
    const saved = await gateway.save(siteUuid, uuid, content, revision);
    setRecords((old) => [saved, ...old.filter((item) => item.uuid !== saved.uuid)]);
    return saved;
  }
  async function publication(post: BlogRecord, publish: boolean) {
    if (
      !gateway ||
      !window.confirm(
        publish
          ? "Publish this blog post on the website?"
          : "Remove this blog post from the public website?"
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setRecords(await gateway.publication(siteUuid, post, publish));
      setMessage(publish ? "Blog published." : "Blog unpublished.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change publication.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(post: BlogRecord) {
    if (!gateway || !window.confirm("Permanently delete this unpublished blog post?")) return;
    setBusy(true);
    setError("");
    try {
      await gateway.remove(siteUuid, post);
      setRecords((old) => old.filter((item) => item.uuid !== post.uuid));
      setMessage("Blog deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the blog.");
    } finally {
      setBusy(false);
    }
  }
  return { records, busy, error, message, load, save, publication, remove };
}
