import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ReceiptText, Layers, Package, Coffee, Users, MessagesSquare, Sparkles } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";

const collection = ["crm", "billing", "accounts", "ecommerce", "qcafe", "hrms", "chat", "zetro"];
const icons = { billing: ReceiptText, accounts: Layers, ecommerce: Package, qcafe: Coffee, hrms: Users, chat: MessagesSquare, zetro: Sparkles };

export function logicxCollection(content: PageContent) {
  return collection.flatMap((slug) => {
    const app = content.applications?.find((item) => item.slug === slug);
    return app ? [{ ...app, name: slug === "qcafe" ? "Q Cafe" : app.name }] : [];
  });
}

export function LogicxAppIcon({ slug }: { slug: string }) {
  if (slug === "crm") return <img src="/app-icons/crm.png" alt="" width="32" height="32" />;
  const Icon = icons[slug as keyof typeof icons];
  return Icon ? <Icon size={30} aria-hidden="true" /> : null;
}

export function LogicxAppCard({ app, index, catalogue = false }: {
  app: NonNullable<PageContent["applications"]>[number]; index: number; catalogue?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const Heading = catalogue ? "h2" : "h3";
  return (
    <motion.a
      className="lx-application-card"
      href={`/apps/${app.slug}`}
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      animate={reducedMotion ? { opacity: 1, y: 0 } : {}}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : (index % 4) * 0.07 }}
      whileHover={reducedMotion ? {} : { y: -6, transition: { duration: 0.2, delay: 0 } }}
    >
      <div className="lx-app-card-heading">
        <span>{app.category}</span>
        <LogicxAppIcon slug={app.slug} />
      </div>
      <Heading>{app.name}</Heading>
      <p className="lx-app-summary">{app.summary}</p>
      <span className="lx-app-card-link">Explore application <ArrowUpRight size={17} aria-hidden="true" /></span>
    </motion.a>
  );
}

