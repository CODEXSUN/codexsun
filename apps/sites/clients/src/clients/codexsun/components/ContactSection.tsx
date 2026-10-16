"use client";

import { motion } from "framer-motion";
import { SOCIAL_LINKS } from "../public.constants";

export default function ContactSection({
  contactEmail,
  contactLocation
}: {
  contactEmail: string;
  contactLocation: string;
}) {
  return (
    <section id="contact" className="min-h-screen w-full bg-frost text-carbon">
      <div className="grid min-h-screen border-t border-carbon/10 lg:grid-cols-[0.95fr_1.55fr_0.95fr]">
        <motion.div
          className="min-h-[300px] border-b border-carbon/10 px-6 py-12 md:px-12 lg:border-b-0 lg:border-r lg:px-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg className="h-12 w-12" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path
              d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle cx="32" cy="32" r="3" fill="currentColor" />
          </svg>
          <p className="mt-10 max-w-[260px] text-[12px] leading-6 text-carbon/70">
            CODEXSUN is a business operating platform for teams that need more than disconnected
            software.
          </p>
          <p className="mt-5 max-w-[280px] text-[12px] leading-6 text-carbon/70">
            We connect operations, billing, compliance, collaboration and intelligence in one
            modular system built to evolve.
          </p>
          <a
            href="#about"
            className="mt-9 inline-flex items-center gap-7 border-b border-carbon pb-2 text-[11px] font-bold uppercase tracking-[0.14em]"
          >
            More about us <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>

        <motion.div
          className="relative min-h-[360px] overflow-hidden border-b border-carbon/10 px-6 py-12 md:px-12 lg:border-b-0 lg:border-r"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="relative z-10 font-display text-[4.4rem] uppercase leading-[0.86] md:text-[6.2rem]">
            Let&apos;s Build
            <br />
            Something
            <br />
            Meaningful.
          </h2>
          <div className="resolved-form" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="footer-architecture" aria-hidden="true" />
        </motion.div>

        <motion.footer
          className="bg-carbon px-6 py-12 text-frost md:px-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-7 text-[11px] uppercase tracking-[0.12em] text-frost/80">
            <a className="block hover:text-frost" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
            <p>
              {contactLocation}
              <br />
              Building beyond.
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-6 border-t border-frost/18 pt-8">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[10px] uppercase tracking-[0.16em] text-frost/62 transition-colors hover:text-frost"
              >
                {link.label}
              </a>
            ))}
          </div>

          <p className="mt-16 text-[10px] uppercase tracking-[0.18em] text-frost/38">
            Software makes simple.
          </p>
        </motion.footer>
      </div>
    </section>
  );
}
