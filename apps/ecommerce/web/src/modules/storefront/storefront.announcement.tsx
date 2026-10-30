import { useCallback, useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import type { StorefrontAnnouncement } from "./storefront.types";

const dismissedAnnouncementKey = "codexsun.storefront.dismissed-announcement";

export function StorefrontAnnouncementBanner({
  announcement
}: {
  announcement: StorefrontAnnouncement | null;
}) {
  const [visible, setVisible] = useState(false);
  const dismiss = useCallback(() => {
    if (!announcement) return;
    setVisible(false);
    try {
      window.localStorage.setItem(dismissedAnnouncementKey, announcement.eventKey);
    } catch {
      // Storage can be unavailable in strict privacy contexts.
    }
  }, [announcement]);

  useEffect(() => {
    if (!announcement) {
      setVisible(false);
      return;
    }
    let dismissed = "";
    try {
      dismissed = window.localStorage.getItem(dismissedAnnouncementKey) ?? "";
    } catch {
      // The banner still works for the current page without storage.
    }
    setVisible(dismissed !== announcement.eventKey);
  }, [announcement]);

  useEffect(() => {
    if (!visible || !announcement) return;
    const timer = window.setTimeout(dismiss, announcement.displayDurationMs);
    return () => window.clearTimeout(timer);
  }, [announcement, dismiss, visible]);

  if (!announcement || !visible) return null;
  return (
    <aside aria-live="polite" className="cx-store__notice">
      <span>{announcement.message}</span>
      <button aria-label="Dismiss announcement" onClick={dismiss} type="button">
        <XIcon />
      </button>
    </aside>
  );
}
