"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { CORE_LINE, NAV_ITEMS, PRODUCT_NAV_ITEMS, SITE_TITLE } from "../public.constants";

function CodexsunMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49" />
      <circle cx="32" cy="32" r="3.5" />
    </svg>
  );
}

export default function NavigationRail({
  siteTitle = SITE_TITLE,
  coreLine = CORE_LINE
}: {
  siteTitle?: string;
  coreLine?: string;
}) {
  const [activeId, setActiveId] = useState<string>(NAV_ITEMS[0].id);
  const [activeProductId, setActiveProductId] = useState<string>(PRODUCT_NAV_ITEMS[0].id);
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        NAV_ITEMS.findIndex((item) => item.id === activeId)
      ),
    [activeId]
  );
  const railStyle = {
    "--rail-progress": `${((activeIndex + 1) / NAV_ITEMS.length) * 100}%`
  } as CSSProperties;

  useEffect(() => {
    let frameId: number | null = null;

    const updateActiveSection = () => {
      const viewportFocus = window.innerHeight * 0.46;
      const nextActive = NAV_ITEMS.reduce<{
        id: string;
        distance: number;
      }>(
        (closest, item) => {
          const section = document.getElementById(item.id);
          if (!section) return closest;

          const rect = section.getBoundingClientRect();
          const sectionFocus =
            rect.top <= viewportFocus && rect.bottom >= viewportFocus
              ? 0
              : Math.min(Math.abs(rect.top - viewportFocus), Math.abs(rect.bottom - viewportFocus));

          return sectionFocus <= closest.distance
            ? { id: item.id, distance: sectionFocus }
            : closest;
        },
        { id: NAV_ITEMS[0].id, distance: Number.POSITIVE_INFINITY }
      );

      setActiveId((current) => (current === nextActive.id ? current : nextActive.id));

      const nextProduct = PRODUCT_NAV_ITEMS.reduce<{
        id: string;
        distance: number;
      }>(
        (closest, item) => {
          const section = document.getElementById(item.id);
          if (!section) return closest;

          const rect = section.getBoundingClientRect();
          const sectionFocus =
            rect.top <= viewportFocus && rect.bottom >= viewportFocus
              ? 0
              : Math.min(Math.abs(rect.top - viewportFocus), Math.abs(rect.bottom - viewportFocus));

          return sectionFocus < closest.distance
            ? { id: item.id, distance: sectionFocus }
            : closest;
        },
        { id: PRODUCT_NAV_ITEMS[0].id, distance: Number.POSITIVE_INFINITY }
      );

      setActiveProductId((current) => (current === nextProduct.id ? current : nextProduct.id));
      frameId = null;
    };

    const requestUpdate = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav className="site-rail" aria-label="Primary navigation" style={railStyle}>
        <button
          type="button"
          onClick={() => handleClick("hero")}
          className="site-rail-brand"
          aria-label="Go to home"
        >
          <CodexsunMark className="site-rail-mark" />
          <span>{siteTitle}</span>
        </button>

        <ul className="site-rail-list">
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            const isProducts = item.id === "work";

            return (
              <li key={item.id} className={isProducts ? "site-rail-products" : undefined}>
                <button
                  type="button"
                  onClick={() => handleClick(item.id)}
                  className="site-rail-link"
                  data-active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  aria-expanded={isProducts ? isActive : undefined}
                >
                  <span className="site-rail-link-label">{item.label}</span>
                </button>
                {isProducts ? (
                  <div className="site-rail-subnav-wrap" data-open={isActive}>
                    <ul className="site-rail-subnav" aria-label="Product chapters">
                      {PRODUCT_NAV_ITEMS.map((productItem) => {
                        const isProductActive = activeProductId === productItem.id;

                        return (
                          <li key={productItem.id}>
                            <button
                              type="button"
                              onClick={() => handleClick(productItem.id)}
                              className="site-rail-sublink"
                              data-active={isProductActive}
                              aria-current={isProductActive ? "location" : undefined}
                            >
                              {productItem.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="site-rail-footer" aria-hidden="true">
          <span>{coreLine}</span>
        </div>
      </nav>

      <nav className="mobile-chapter-dock" aria-label="Primary navigation">
        <button
          type="button"
          onClick={() => handleClick("hero")}
          className="mobile-chapter-brand"
          aria-label="Go to home"
        >
          <CodexsunMark />
        </button>
        <div className="mobile-chapter-track">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className="mobile-chapter-link"
              data-active={activeId === item.id}
              aria-label={item.label}
              aria-current={activeId === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
