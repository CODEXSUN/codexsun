import { ArrowUpRight } from "lucide-react";
import { fabricQuestions, hosieryFabrics, sportsFabrics } from "./ramutex-fabrics";
import { RamutexFabricBrief } from "./RamutexFabricBrief";
import "./ramutex-fabrics.css";

export function RamutexFabrics({ detailed = false }: { detailed?: boolean }) {
  return (
    <section id="fabrics" className="rt-fabrics">
      <div className="rt-wrap rt-fabric-intro">
        <p className="rt-eyebrow">THE FABRIC PERSPECTIVE</p>
        <h2>
          Everyday softness.
          <br />
          <em>Ready for movement.</em>
        </h2>
        <p>
          From the familiar comfort of knitted hosiery to the precise brief behind polyester sports
          fabrics. Explore the construction, feel and finishing questions that shape your next
          garment.
        </p>
        <nav className="rt-fabric-jumps" aria-label="Fabric collections">
          <a href={detailed ? "#hosiery" : "/services#hosiery"}>
            Knitted hosiery <ArrowUpRight size={16} />
          </a>
          <a href={detailed ? "#sports-fabrics" : "/services#sports-fabrics"}>
            Polyester sports fabrics <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
      <div className="rt-wrap rt-fabric-stories">
        <FabricStory
          id="hosiery"
          eyebrow="01 / KNITTED HOSIERY"
          title="Comfort starts with construction."
          image="hosiery-materials"
          alt="Illustrative close-up of ivory jersey, blue interlock and copper rib knit with cotton yarn"
          description="Jersey, rib and interlock bring different surfaces, stretch and body to everydaywear. French terry and fleece introduce another dimension of handle. Start with the garment, then define the knit and the finish."
          href="/contact?service=Knitted%20hosiery%20fabric"
          link="Discuss a hosiery fabric"
        />
        {detailed ? (
          <FabricCollection items={hosieryFabrics} label="Knitted hosiery fabric guide" />
        ) : null}
        <FabricStory
          id="sports-fabrics"
          eyebrow="02 / POLYESTER SPORTS FABRICS"
          title="Movement needs a considered fabric."
          image="sports-materials"
          alt="Illustrative studio arrangement of navy polyester jersey, slate mesh and copper technical knit"
          description="Fine jersey, mesh, stretch blends and patterned knits offer different starting points for activewear. Decide how the fabric should feel and move, then define the moisture, drying and colour requirements that matter to the garment."
          href="/contact?service=Polyester%20sports%20fabric"
          link="Discuss a sports fabric"
          reverse
        />
        {detailed ? (
          <FabricCollection items={sportsFabrics} label="Polyester sports fabric guide" />
        ) : null}
      </div>
      <p className="rt-wrap rt-fabric-context">
        Fabric guide and illustrative imagery. Suitability, processing route and finish availability
        are confirmed against your sample and requirements.
      </p>
      {detailed ? (
        <>
          <FabricApplications />
          <RamutexFabricBrief />
          <section className="rt-wrap rt-fabric-faq">
            <div>
              <p className="rt-eyebrow">A CLEARER FABRIC BRIEF</p>
              <h2>
                Good questions.
                <br />
                <em>Better starting points.</em>
              </h2>
            </div>
            <div>
              {fabricQuestions.map((item) => (
                <details key={item.question}>
                  <summary>
                    {item.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="rt-wrap rt-fabric-more">
          <p>
            Look closer at ten knit constructions, garment applications and the details to include
            in your fabric brief.
          </p>
          <a className="rt-text-link" href="/services#fabrics">
            Explore the fabric guide <ArrowUpRight size={18} />
          </a>
        </div>
      )}
    </section>
  );
}

function FabricStory({
  id,
  eyebrow,
  title,
  image,
  alt,
  description,
  href,
  link,
  reverse = false
}: {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  alt: string;
  description: string;
  href: string;
  link: string;
  reverse?: boolean;
}) {
  return (
    <article id={id} className={`rt-fabric-story${reverse ? " rt-fabric-story-reverse" : ""}`}>
      <div className="rt-fabric-photo">
        <img
          src={`/ramutex/${image}.webp`}
          srcSet={`/ramutex/${image}-640.webp 640w, /ramutex/${image}.webp 1200w`}
          sizes="(min-width: 761px) 50vw, calc(100vw - 40px)"
          alt={alt}
          width="1200"
          height="800"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="rt-fabric-story-copy">
        <p className="rt-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
        <a className="rt-text-link" href={href}>
          {link}
          <ArrowUpRight size={18} />
        </a>
      </div>
    </article>
  );
}

function FabricCollection({ items, label }: { items: typeof hosieryFabrics; label: string }) {
  return (
    <div className="rt-fabric-collection" aria-label={label}>
      {items.map((item, index) => (
        <article className="rt-fabric-type" key={item.name}>
          <span className="rt-eyebrow">{String(index + 1).padStart(2, "0")} / CONSTRUCTION</span>
          <h4>{item.name}</h4>
          <p>{item.description}</p>
          <details>
            <summary aria-label={`Applications and sample brief for ${item.name}`}>
              Applications & sample brief <span aria-hidden="true">+</span>
            </summary>
            <div>
              <p>
                <strong>Application ideas</strong>
                {item.applications}
              </p>
              <p>
                <strong>What to define</strong>
                {item.brief}
              </p>
              <a
                className="rt-text-link"
                href={`/contact?service=${encodeURIComponent(item.name)}`}
              >
                Enquire about this fabric <ArrowUpRight size={16} />
              </a>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

function FabricApplications() {
  return (
    <section className="rt-wrap rt-fabric-applications">
      <div className="rt-fabric-intro">
        <p className="rt-eyebrow">FROM FABRIC TO EVERYDAY LIFE</p>
        <h2>
          Two wardrobes.
          <br />
          <em>A world of details.</em>
        </h2>
      </div>
      <div className="rt-application-pair">
        <article>
          <img
            src="/ramutex/hosiery-applications.webp"
            srcSet="/ramutex/hosiery-applications-640.webp 640w, /ramutex/hosiery-applications.webp 1200w"
            sizes="(min-width: 761px) 50vw, calc(100vw - 40px)"
            alt="Illustrative ivory cotton T-shirt, navy lounge trousers and copper rib-knit swatch"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h3>Hosiery & everydaywear</h3>
            <p>
              For innerwear, T-shirts, babywear and lounge concepts, start with skin feel, coverage
              and the intended care cycle. The best sample brief describes the fabric after washing
              as clearly as it describes the first touch.
            </p>
          </div>
        </article>
        <article>
          <img
            src="/ramutex/sports-applications.webp"
            srcSet="/ramutex/sports-applications-640.webp 640w, /ramutex/sports-applications.webp 1200w"
            sizes="(min-width: 761px) 50vw, calc(100vw - 40px)"
            alt="Illustrative unbranded navy training shirt with a mesh panel and copper sports fabric"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h3>Sportswear & athleisure</h3>
            <p>
              For training and teamwear concepts, define movement, coverage and moisture behaviour.
              Include the garment’s colour, print or trim plans in the discussion so the sample
              review reflects its intended use.
            </p>
          </div>
        </article>
      </div>
      <p className="rt-image-note">
        Illustrative garment applications, presented as design directions.
      </p>
    </section>
  );
}
