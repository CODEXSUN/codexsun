import { ArrowUpRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";

export function RamutexPortfolio({ content }: { content: PageContent }) {
  const [selected, ...remaining] = content.processing.lines;
  return (
    <section id="portfolio" className="rt-portfolio rt-wrap">
      <div className="rt-portfolio-heading">
        <p className="rt-eyebrow">THE MATERIAL EDIT</p>
        <h2>
          Every detail.
          <br />
          <span>A different possibility.</span>
        </h2>
        <p>
          A closer look at colour, construction and the finishing choices that give fabric its
          character.
        </p>
      </div>
      <div className="rt-editorial-grid">
        {selected ? (
          <a className="rt-editorial-card rt-editorial-large" href="#processing">
            <img
              src="/ramutex/fabric-sculpture-navy.webp"
              alt="Sculptural folds show the texture and drape of knitted fabric"
              width="1536"
              height="1024"
              loading="lazy"
            />
            <div>
              <span>01 / CONSTRUCTION</span>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
              <span className="rt-editorial-link">
                Explore the process <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        ) : null}
        {remaining.map((line, index) => (
          <a key={line.title} className="rt-editorial-card rt-editorial-detail" href="#processing">
            <img
              src="/ramutex/material-study-navy.webp"
              alt="Layered fabric swatches in ivory, denim, navy and copper"
              width="1536"
              height="1024"
              loading="lazy"
            />
            <div>
              <span>{String(index + 2).padStart(2, "0")} / PRECISION</span>
              <h3>{line.title}</h3>
              <p>{line.description}</p>
              <span className="rt-editorial-link">
                See the capabilities <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        ))}
      </div>
      <p className="rt-image-note">
        Illustrative material studies. Explore our documented capabilities below.
      </p>
      <div className="rt-sample-brief">
        <div>
          <p className="rt-eyebrow">FROM MATERIAL TO BRIEF</p>
          <h3>Let’s find your fabric’s next chapter.</h3>
        </div>
        <a
          className="rt-button rt-button-dark"
          href="/contact?service=Fabric%20processing%20and%20finishing"
        >
          Discuss your fabric <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
