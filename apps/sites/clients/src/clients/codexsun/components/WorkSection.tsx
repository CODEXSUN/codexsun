"use client";

import { motion } from "framer-motion";
import { platformUrl } from "../public.constants";

type SelectedWorkPreviewKind =
  "billing" | "sites" | "mail" | "ui" | "ecommerce" | "b2b" | "orbit" | "devkit" | "framework";

type SelectedWorkCard = {
  category: string;
  description: string;
  href: string;
  preview: SelectedWorkPreviewKind;
  previewLabel: string;
  previewRows: readonly [string, string, string];
  previewStatus: string;
  symbol: string;
  title: string;
};

const PRODUCT_OUTCOMES = [
  {
    label: "Clarity",
    title: "One operating view",
    description:
      "Website, users, billing, and daily work stay connected in a workspace people can understand from the first click."
  },
  {
    label: "Control",
    title: "Every action stays accountable",
    description:
      "Focused workflows make sales, receipts, payments, reports, and operational decisions easier to follow and trust."
  },
  {
    label: "Growth",
    title: "A platform that expands with you",
    description:
      "Start with the tools you need today, then add customers, accounts, workflows, and operations without starting over."
  }
] as const;

const SELECTED_WORK_CARDS: readonly SelectedWorkCard[] = [
  {
    title: "Billing",
    category: "Finance",
    description: "Quote. Bill. Collect.",
    href: "/work/billing-suite",
    preview: "billing",
    previewLabel: "Money in motion",
    previewStatus: "Active",
    previewRows: ["Sales", "Tax", "Cash"],
    symbol: "₹"
  },
  {
    title: "Web Sites",
    category: "Digital presence",
    description: "Design. Launch. Grow.",
    href: "/",
    preview: "sites",
    previewLabel: "Brands online",
    previewStatus: "Live",
    previewRows: ["Brand", "Pages", "Launch"],
    symbol: "WWW"
  },
  {
    title: "Mail Desk",
    category: "Communication",
    description: "Every message. One desk.",
    href: platformUrl("/login"),
    preview: "mail",
    previewLabel: "Conversation flow",
    previewStatus: "Synced",
    previewRows: ["Inbox", "Reply", "Send"],
    symbol: "@"
  },
  {
    title: "UI System",
    category: "Product design",
    description: "One language. Every product.",
    href: "#contact",
    preview: "ui",
    previewLabel: "Shared experience",
    previewStatus: "System",
    previewRows: ["Layout", "Forms", "Tables"],
    symbol: "UI"
  },
  {
    title: "Ecommerce",
    category: "Commerce",
    description: "Catalog to checkout.",
    href: "#contact",
    preview: "ecommerce",
    previewLabel: "Storefront flow",
    previewStatus: "Boundary",
    previewRows: ["Browse", "Cart", "Order"],
    symbol: "BAG"
  },
  {
    title: "B2B Connect",
    category: "Business network",
    description: "Partners move together.",
    href: "#contact",
    preview: "b2b",
    previewLabel: "Connected trade",
    previewStatus: "Planned",
    previewRows: ["Partner", "Catalog", "Order"],
    symbol: "B2B"
  },
  {
    title: "Orbit",
    category: "Engineering operations",
    description: "Ship with control.",
    href: "#contact",
    preview: "orbit",
    previewLabel: "Delivery control",
    previewStatus: "Active",
    previewRows: ["Check", "Guard", "Ship"],
    symbol: "OPS"
  },
  {
    title: "Devkit",
    category: "Product delivery",
    description: "Plan. Build. Deliver.",
    href: "#contact",
    preview: "devkit",
    previewLabel: "Work in motion",
    previewStatus: "Active",
    previewRows: ["Plan", "Build", "Done"],
    symbol: "DEV"
  },
  {
    title: "Framework",
    category: "Backend foundation",
    description: "Strong foundations. Faster products.",
    href: "#contact",
    preview: "framework",
    previewLabel: "Core contracts",
    previewStatus: "Stable",
    previewRows: ["API", "Events", "Storage"],
    symbol: "{ }"
  }
] as const;

function SelectedWorkPreview({ item }: { item: SelectedWorkCard }) {
  return (
    <div className="work-selected-preview" data-preview={item.preview} aria-hidden="true">
      <div className="work-selected-preview-bar">
        <span>{item.previewLabel}</span>
        <em>{item.previewStatus}</em>
      </div>
      <div className="work-selected-preview-canvas">
        <div className="work-selected-preview-art">
          <i />
          <i />
          <i />
          <i />
          <i />
          <span>{item.symbol}</span>
        </div>
        <div className="work-selected-preview-rows">
          {item.previewRows.map((row) => (
            <span key={row}>
              <i />
              <b>{row}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WorkSection() {
  return (
    <section
      id="work"
      className="work-section relative w-full overflow-hidden bg-frost text-carbon"
    >
      <div id="product-selected" className="section-band work-selected pb-20 md:pb-28">
        <div className="work-selected-heading">
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-20% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-quiet">
              Selected Work
            </span>
            <div className="mt-5 h-px w-8 bg-carbon" />
            <h2 className="work-selected-title font-display uppercase">
              Nine products.
              <br />
              One connected stack.
            </h2>
            <p className="work-selected-intro">
              Focused products for finance, websites, communication, commerce, engineering, and
              shared platform foundations.
            </p>
          </motion.div>
          <a href="#contact" className="work-view-link">
            Start a project <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="work-selected-grid">
          {SELECTED_WORK_CARDS.map((item, index) => (
            <motion.article
              key={item.title}
              className={`work-selected-card work-selected-card-tone-${index + 1}`}
              initial={{ opacity: 0, y: 38, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, margin: "-10% 0px" }}
              transition={{
                delay: (index % 3) * 0.08,
                duration: 0.78,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <a href={item.href} className="work-selected-card-link">
                <SelectedWorkPreview item={item} />
                <div className="work-selected-card-content">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="work-selected-card-footer">
                    <span>
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(SELECTED_WORK_CARDS.length).padStart(2, "0")}
                    </span>
                    <em>
                      Explore <span aria-hidden="true">↗</span>
                    </em>
                  </div>
                </div>
              </a>
            </motion.article>
          ))}
        </div>

        <div className="work-selected-footer">
          <span>Nine products. Built to work together.</span>
          <a href="#approach">
            See our process <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      <div id="product-outcomes" className="section-band work-outcomes">
        <div className="work-outcomes-grid">
          <motion.div
            className="work-outcomes-heading"
            initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, margin: "-18% 0px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Product Outcomes</span>
            <h2 className="font-display uppercase">
              Built to keep
              <br />
              business moving.
            </h2>
            <p>
              The product is complete only when daily work becomes clearer, more accountable, and
              easier to grow.
            </p>
            <div className="work-outcome-flow" aria-hidden="true">
              <div className="work-outcome-flow-header">
                <span>Operating signal</span>
                <em>Live</em>
              </div>
              <div className="work-outcome-flow-track">
                <i />
              </div>
              <div className="work-outcome-flow-nodes">
                {PRODUCT_OUTCOMES.map((outcome, index) => (
                  <span key={outcome.label}>
                    <i />
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <em>{outcome.label}</em>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="work-outcomes-list">
            {PRODUCT_OUTCOMES.map((outcome, index) => (
              <motion.article
                key={outcome.label}
                className="work-outcome-card"
                initial={{ opacity: 0, x: 48, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-16% 0px" }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.82,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <span className="work-outcome-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="work-outcome-copy">
                  <span>{outcome.label}</span>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.description}</p>
                </div>
                <div className="work-outcome-signal" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="work-outcomes-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: "-10% 0px" }}
          transition={{ delay: 0.25, duration: 0.8 }}
        >
          <span>{SELECTED_WORK_CARDS.length} connected product systems</span>
          <a href="#contact">
            Build your workspace <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
