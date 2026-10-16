"use client";

import { motion } from "framer-motion";

const ENTERPRISE_PILLARS = [
  {
    code: "01",
    label: "Governance",
    title: "Control without friction",
    description:
      "Tenant boundaries, permissions, approvals, and audit are designed into the operating model—not added after rollout.",
    signals: ["Tenant isolation", "Permission scopes"]
  },
  {
    code: "02",
    label: "Operations",
    title: "Visibility across the work",
    description:
      "Applications, companies, queues, workflows, and business activity stay observable from one accountable control plane.",
    signals: ["Auditable actions", "Operational telemetry"]
  },
  {
    code: "03",
    label: "Scale",
    title: "Growth without a rebuild",
    description:
      "Activate capabilities deliberately, expand by company or workflow, and preserve the same system contract as complexity grows.",
    signals: ["Modular activation", "Resilient execution"]
  }
] as const;

const ENTERPRISE_DOMAINS = ["Identity", "Applications", "Data", "Automation"] as const;

export default function ApproachSection() {
  return (
    <section id="approach" className="enterprise-page relative w-full overflow-hidden">
      <div className="enterprise-field" aria-hidden="true" />

      <div className="section-band enterprise-shell">
        <header className="enterprise-topbar">
          <span className="enterprise-kicker">
            Enterprise <i aria-hidden="true" /> Governed growth
          </span>
          <a href="#contact" className="enterprise-contact-link">
            Talk to our team <span aria-hidden="true">&rarr;</span>
          </a>
        </header>

        <div className="enterprise-hero-grid">
          <motion.div
            className="enterprise-copy"
            initial={{ opacity: 0, x: -42, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Built for governed scale</span>
            <h2 className="font-display uppercase">
              Control at scale.
              <br />
              Clarity at every level.
            </h2>
            <p>
              CODEXSUN gives growing organisations one operating foundation for access, data,
              applications, automation, and accountability—without slowing the people doing the
              work.
            </p>

            <div className="enterprise-proofline" aria-label="Enterprise platform signals">
              <span>
                <b>01</b> Tenant-aware
              </span>
              <span>
                <b>02</b> Permission-first
              </span>
              <span>
                <b>03</b> Audit-ready
              </span>
            </div>
          </motion.div>

          <motion.div
            className="enterprise-control-plane"
            initial={{ opacity: 0, x: 48, scale: 0.985, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.35 }}
            transition={{ delay: 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="enterprise-plane-header">
              <span>CXS / Enterprise control plane</span>
              <em>
                <i /> Governed
              </em>
            </div>

            <div className="enterprise-plane-map" aria-hidden="true">
              <div className="enterprise-plane-orbit enterprise-plane-orbit-outer" />
              <div className="enterprise-plane-orbit enterprise-plane-orbit-inner" />
              <div className="enterprise-plane-scan" />
              <div className="enterprise-plane-core">
                <span>CODEXSUN</span>
                <b>Control plane</b>
                <i />
              </div>
              {ENTERPRISE_DOMAINS.map((domain, index) => (
                <span
                  key={domain}
                  className={`enterprise-plane-node enterprise-plane-node-${index + 1}`}
                >
                  <i />
                  <b>{domain}</b>
                </span>
              ))}
            </div>

            <div className="enterprise-plane-footer">
              <span>
                <b>Isolation</b> Active
              </span>
              <span>
                <b>Policy</b> Enforced
              </span>
              <span>
                <b>Audit</b> Streaming
              </span>
            </div>
          </motion.div>
        </div>

        <div className="enterprise-pillars">
          {ENTERPRISE_PILLARS.map((pillar, index) => (
            <motion.article
              key={pillar.code}
              className="enterprise-pillar"
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, margin: "-10% 0px" }}
              transition={{
                delay: index * 0.1,
                duration: 0.76,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <div className="enterprise-pillar-meta">
                <span>{pillar.code}</span>
                <em>{pillar.label}</em>
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <div className="enterprise-pillar-signals">
                {pillar.signals.map((signal) => (
                  <span key={signal}>
                    <i /> {signal}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <footer className="enterprise-footer">
          <span>Enterprise control without enterprise drag.</span>
          <a href="#contact">
            Design your operating model <span aria-hidden="true">&rarr;</span>
          </a>
        </footer>
      </div>
    </section>
  );
}
