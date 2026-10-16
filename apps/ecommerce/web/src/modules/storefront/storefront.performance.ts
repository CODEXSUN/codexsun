type StorefrontVitals = { cls: number; inp: number; lcp: number };

export function observeStorefrontVitals() {
  if (!window.PerformanceObserver || Math.random() > 0.1) return () => undefined;
  const vitals: StorefrontVitals = { cls: 0, inp: 0, lcp: 0 };
  const observers = [
    observe("largest-contentful-paint", (entry) => {
      vitals.lcp = Math.round(entry.startTime);
    }),
    observe("layout-shift", (entry) => {
      if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
        vitals.cls += Number((entry as PerformanceEntry & { value?: number }).value ?? 0);
      }
    }),
    observe("event", (entry) => {
      if (entry.duration > vitals.inp) vitals.inp = Math.round(entry.duration);
    })
  ].filter(Boolean) as PerformanceObserver[];
  const report = () => sendVitals(vitals);
  window.addEventListener("pagehide", report, { once: true });
  return () => {
    observers.forEach((observer) => observer.disconnect());
    window.removeEventListener("pagehide", report);
  };
}

function observe(type: string, callback: (entry: PerformanceEntry) => void) {
  try {
    const observer = new PerformanceObserver((list) => list.getEntries().forEach(callback));
    observer.observe({ buffered: true, type } as PerformanceObserverInit);
    return observer;
  } catch {
    return null;
  }
}

function sendVitals(vitals: StorefrontVitals) {
  const body = JSON.stringify({
    cls: Number(vitals.cls.toFixed(4)),
    inp: vitals.inp,
    lcp: vitals.lcp,
    path: window.location.pathname
  });
  navigator.sendBeacon?.(
    "/api/platform/storefront/telemetry",
    new Blob([body], { type: "application/json" })
  );
}
