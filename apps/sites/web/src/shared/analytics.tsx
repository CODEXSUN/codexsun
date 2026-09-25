import { useEffect, useState } from "react";

const consentKey = "sites.analytics-consent";

export function Analytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  const [consent, setConsent] = useState<string | null>(() => localStorage.getItem(consentKey));
  useEffect(() => {
    if (!measurementId || consent !== "granted" || document.getElementById("sites-gtag")) return;
    const script = document.createElement("script");
    script.id = "sites-gtag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { anonymize_ip: true, page_title: document.title });
  }, [consent, measurementId]);
  if (!measurementId || consent) return null;
  return <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/15 bg-slate-900/95 p-5 text-sm shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="leading-6 text-slate-300">We use privacy-conscious analytics to understand which public pages are useful. No analytics loads until you choose.</p><div className="flex shrink-0 gap-2"><button className="rounded-full border border-white/15 px-4 py-2 text-slate-300 hover:border-white/35" onClick={() => { localStorage.setItem(consentKey, "denied"); setConsent("denied"); }}>Decline</button><button className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-200" onClick={() => { localStorage.setItem(consentKey, "granted"); setConsent("granted"); }}>Allow analytics</button></div></aside>;
}

declare global {
  interface Window { dataLayer?: unknown[][]; gtag?: (...args: unknown[]) => void; }
}
