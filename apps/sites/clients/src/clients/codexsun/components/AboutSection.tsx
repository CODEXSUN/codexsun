"use client";

import { motion } from "framer-motion";

const PRINCIPLES = [
  {
    label: "What We Believe",
    text: "Great business software starts with deep listening. We shape operational systems with care usually reserved for the final one percent."
  },
  {
    label: "What We Refuse",
    text: "We do not ship complexity disguised as sophistication, or decorate weak thinking with motion."
  },
  {
    label: "Our Standard",
    text: "Every product we build must be worthy of the people who use it. Fast. Clear. Reliable. Evolvable."
  },
  {
    label: "Who We Help",
    text: "Growing companies, finance teams, operators and industry specialists ready for one dependable business platform."
  }
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="about-page relative w-full overflow-hidden bg-frost py-24 text-carbon md:py-32"
    >
      <div className="section-band">
        <div className="grid-shell about-shell">
          <motion.div
            className="about-heading md:col-span-4"
            initial={{ opacity: 0, x: -42, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: false, margin: "-18% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-quiet">About</span>
            <h2 className="mt-5 font-display text-display-sm uppercase leading-[0.9]">
              Why This
              <br />
              Studio
              <br />
              Exists.
            </h2>
          </motion.div>

          <div className="md:col-span-8">
            <motion.p
              className="about-lede"
              initial={{ opacity: 0, x: -42 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-18% 0px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              CODEXSUN is a modular business platform for ambitious teams that need clarity across
              every operation.
            </motion.p>

            <div className="mt-16 grid grid-cols-1 border-t border-carbon/10 md:grid-cols-2">
              {PRINCIPLES.map((item, index) => (
                <motion.article
                  key={item.label}
                  className="about-principle"
                  initial={{ opacity: 0, x: -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-14% 0px" }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.65,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <span className="text-[10px] uppercase tracking-[0.16em] text-quiet">
                    {item.label}
                  </span>
                  <p className="mt-4 text-[13px] leading-6 text-carbon/62">{item.text}</p>
                </motion.article>
              ))}
            </div>

            <motion.div
              className="about-signature"
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>CODEXSUN Platform</span>
              <strong>Software makes simple.</strong>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
