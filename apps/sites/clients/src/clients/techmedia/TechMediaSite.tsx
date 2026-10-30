import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { ArrowUpRight, Gamepad2, Headphones, Laptop, Monitor, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { ClientCanvas } from "../../shared/ClientCanvas";
import { useClientDocument } from "../../shared/useClientDocument";

const collections = [
  {
    icon: Laptop,
    title: "Laptops",
    description: "Reliable everyday, business and performance machines selected around your needs."
  },
  {
    icon: Gamepad2,
    title: "Gaming gear",
    description:
      "Responsive components and peripherals for a setup that feels as good as it performs."
  },
  {
    icon: Headphones,
    title: "Accessories",
    description: "The practical additions that make work, play and mobility easier every day."
  },
  {
    icon: Monitor,
    title: "Monitors",
    description: "Clear, comfortable displays for offices, creative work and high-refresh gaming."
  },
  {
    icon: Settings2,
    title: "Custom builds",
    description: "Balanced PC builds assembled around performance targets, style and real budgets."
  },
  {
    icon: Settings2,
    title: "Repairs and setup",
    description: "Quick diagnostics, dependable fixes and clean setup so your gear is ready to use."
  }
] as const;

export function TechMediaSite() {
  useClientDocument(
    "Tech Media | Computers and technology gear",
    "Computers, gaming gear, accessories, monitors, setup, repairs and custom PC builds.",
    "#fffaf3"
  );

  return (
    <ClientCanvas client="techmedia" theme="orange">
      <header className="client-header client-wrap">
        <a className="client-brand" href="#top" aria-label="Tech Media home">
          <span className="client-brand-mark">TM</span>
          Tech Media
        </a>
        <nav className="client-nav" aria-label="Main navigation">
          <a href="#shop">Shop</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
          <Button asChild size="sm">
            <a href="#shop">
              Explore gear <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </nav>
      </header>

      <main id="top">
        <section className="client-hero client-wrap">
          <motion.div
            className="client-hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="client-eyebrow">Computers, gear and expert support</span>
            <h1>Better technology. Ready for your next move.</h1>
            <p>
              Tech Media helps you choose, build and maintain the right setup—from everyday laptops
              and accessories to gaming systems, monitors and custom PCs.
            </p>
            <div className="client-actions">
              <Button asChild size="lg">
                <a href="#shop">
                  Find your setup <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#services">See support services</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="client-visual"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="client-visual-top">
              <span>Tech Media / Setup lab</span>
              <span>Built for you</span>
            </div>
            <div className="client-system-map">
              <div className="client-system-node">
                <Laptop aria-hidden="true" size={20} />
                <strong>Work</strong>
                <span>Laptops + productivity</span>
              </div>
              <div className="client-system-node">
                <Gamepad2 aria-hidden="true" size={20} />
                <strong>Play</strong>
                <span>Gaming + performance</span>
              </div>
              <div className="client-system-node">
                <Monitor aria-hidden="true" size={20} />
                <strong>Create</strong>
                <span>Displays + storage</span>
              </div>
              <div className="client-system-node">
                <Settings2 aria-hidden="true" size={20} />
                <strong>Care</strong>
                <span>Setup + repairs</span>
              </div>
            </div>
            <div className="client-visual-footer">
              <span>Advice before and after the sale</span>
              <span>techmedia.in</span>
            </div>
          </motion.div>
        </section>

        <section className="client-section client-section-muted" id="shop">
          <div className="client-wrap">
            <div className="client-section-heading">
              <span className="client-eyebrow">Shop by need</span>
              <div>
                <h2>Technology chosen with a purpose.</h2>
                <p>
                  Start with what you need the setup to do. We help match the components,
                  performance and price so the result makes sense long after checkout.
                </p>
              </div>
            </div>
            <div className="client-card-grid">
              {collections.map((collection, index) => {
                const Icon = collection.icon;
                return (
                  <motion.div
                    key={collection.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.045, duration: 0.42 }}
                  >
                    <Card className="client-service-card">
                      <Icon aria-hidden="true" size={22} />
                      <h3>{collection.title}</h3>
                      <p>{collection.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="services">
          <div className="client-section-heading">
            <span className="client-eyebrow">Service that stays useful</span>
            <div>
              <h2>Advice, setup and fixes without the guesswork.</h2>
              <p>
                Tech Media supports the whole ownership journey: choosing the right gear, getting it
                configured properly, and recovering quickly when something stops working.
              </p>
            </div>
          </div>
          <div className="client-stats">
            <div className="client-stat">
              <strong>Expert advice</strong>
              <span>Recommendations shaped around use and budget</span>
            </div>
            <div className="client-stat">
              <strong>Fast setup</strong>
              <span>Clean configuration so new gear is ready sooner</span>
            </div>
            <div className="client-stat">
              <strong>Reliable repairs</strong>
              <span>Clear diagnosis and practical repair options</span>
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="contact">
          <div className="client-cta">
            <div>
              <h2>Build a setup you will enjoy using.</h2>
              <p>
                Tell us how you work, play or create. We will help narrow the options and put
                together technology that fits the job.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <a href="#shop">
                Explore the range <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="client-footer client-wrap">
        <span>Tech Media</span>
        <span>Computers · Gaming · Accessories · Repairs · Custom builds</span>
      </footer>
    </ClientCanvas>
  );
}
