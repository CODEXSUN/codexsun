"use client";

import { motion } from "framer-motion";

type CapabilityItem = {
  id: string;
  title: string;
  summary: string;
  icon?: string;
};

const CAPABILITY_MARKERS = ["Signal", "Interface", "System"] as const;
const PUBLIC_CAPABILITY_LIMIT = 6;

function CapabilityGlyph({ id }: { id: string }) {
  if (id === "strategy") {
    return (
      <svg viewBox="0 0 96 96" className="capability-glyph">
        <circle cx="48" cy="48" r="29" />
        <circle cx="48" cy="48" r="10" />
        <circle cx="48" cy="48" r="3" className="capability-glyph-fill" />
        <path d="M48 10v20M48 66v20M10 48h20M66 48h20" />
        <path d="M29 29 21 21M67 29l8-8M29 67l-8 8M67 67l8 8" className="capability-glyph-soft" />
      </svg>
    );
  }

  if (id === "design") {
    return (
      <svg viewBox="0 0 96 96" className="capability-glyph">
        <rect x="22" y="28" width="38" height="38" />
        <rect x="36" y="16" width="38" height="38" />
        <path d="M20 76h56M48 12v68M16 48h68" className="capability-glyph-soft" />
        <path d="M30 36h22M44 24h22" />
      </svg>
    );
  }

  if (id === "engineering") {
    return (
      <svg viewBox="0 0 96 96" className="capability-glyph">
        <path d="M37 27 17 48l20 21M59 27l20 21-20 21" />
        <path d="M55 15 41 81" />
        <path d="M16 18h18M62 18h18M16 78h18M62 78h18" className="capability-glyph-soft" />
        <circle cx="48" cy="48" r="4" className="capability-glyph-fill" />
      </svg>
    );
  }

  if (id === "ai") {
    return (
      <svg viewBox="0 0 96 96" className="capability-glyph">
        <path d="M48 10v76M10 48h76M21 21l54 54M75 21 21 75" className="capability-glyph-soft" />
        <circle cx="48" cy="48" r="18" />
        <circle cx="48" cy="48" r="5" className="capability-glyph-fill" />
        <path d="M48 26v12M48 58v12M26 48h12M58 48h12" />
      </svg>
    );
  }

  if (id === "cloud") {
    return (
      <svg viewBox="0 0 96 96" className="capability-glyph">
        <path d="M25 62h46a15 15 0 0 0 0-30 23 23 0 0 0-45-4 17 17 0 0 0-1 34Z" />
        <path d="M31 76h34M48 62v14M25 22h14M67 22h14" className="capability-glyph-soft" />
        <circle cx="48" cy="44" r="4" className="capability-glyph-fill" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className="capability-glyph">
      <circle cx="48" cy="48" r="31" />
      <path d="M48 24v27l18-13" />
      <path d="M24 73h48M21 21l54 54" className="capability-glyph-soft" />
      <circle cx="48" cy="48" r="4" className="capability-glyph-fill" />
    </svg>
  );
}

export default function CapabilitiesSection({
  capabilities
}: {
  capabilities: readonly CapabilityItem[];
}) {
  const visibleCapabilities = capabilities.slice(0, PUBLIC_CAPABILITY_LIMIT);

  return (
    <section
      id="capabilities"
      className="capabilities-page relative w-full overflow-hidden text-carbon"
    >
      <div className="section-band capabilities-shell">
        <div className="capabilities-header">
          <motion.div
            initial={{ opacity: 0, x: -54, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="capabilities-kicker">Capabilities</span>
            <h2 className="capabilities-title font-display uppercase">
              One partner.
              <br />
              Every layer.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -34 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ delay: 0.16, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            Strategy, interfaces, infrastructure, automation, and long-term product care. Built as
            one connected system instead of disconnected services.
          </motion.p>
        </div>

        <div className="capabilities-board">
          <div className="capabilities-axis" aria-hidden="true">
            {CAPABILITY_MARKERS.map((marker) => (
              <span key={marker}>{marker}</span>
            ))}
          </div>

          <div className="capabilities-grid">
            {visibleCapabilities.map((capability, index) => (
              <motion.article
                key={capability.id}
                className="capability-system"
                initial={{ opacity: 0, x: -64, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-14% 0px" }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <div className="capability-system-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="capability-glyph-frame" aria-hidden="true">
                  <span className="capability-glyph-orbit" />
                  <span className="capability-glyph-node capability-glyph-node-a" />
                  <span className="capability-glyph-node capability-glyph-node-b" />
                  <CapabilityGlyph id={capability.icon || capability.id} />
                </div>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.summary}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="capabilities-footer"
          initial={{ opacity: 0, x: -38 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>From first signal to maintained system.</span>
          <a href="#contact">
            Explore capabilities <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
