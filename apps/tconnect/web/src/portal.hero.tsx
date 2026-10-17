import { ArrowRight, Search, MoveUpRight, Layers3 } from "lucide-react";
export function PortalHero() {
  return (
    <section className="tc-hero">
      <div className="tc-hero-copy">
        <span className="tc-eyebrow">
          <span className="tc-small-line" />
          THE BUSINESS OF CONNECTING
        </span>
        <h1>
          Good business
          <br />
          starts with a<br />
          <em>great connection.</em>
        </h1>
        <p>
          Find the right suppliers. Meet your next buyer.
          <br />
          Grow with a community that gets your industry.
        </p>
        <form className="tc-search" action="/companies">
          <Search size={22} />
          <input
            aria-label="Search businesses, products or services"
            name="q"
            placeholder="What are you looking for?"
          />
          <button type="submit" aria-label="Search businesses">
            <ArrowRight size={22} />
          </button>
        </form>
        <div className="tc-popular">
          Try <a href="/companies?q=cotton">Cotton knits</a>
          <a href="/companies?industry=Packaging">Packaging</a>
          <a href="/companies?industry=Engineering">Engineering</a>
        </div>
      </div>
      <div className="tc-hero-art" aria-hidden="true">
        <div className="tc-orbit tc-orbit-one" />
        <div className="tc-orbit tc-orbit-two" />
        <div className="tc-art-title">
          Made here.
          <br />
          <em>Goes everywhere.</em>
        </div>
        <div className="tc-textile-stack">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="tc-float-note">
          <span className="tc-note-mark">
            <Layers3 size={22} />
          </span>
          <div>
            <strong>Local roots. Shared ambition.</strong>
            <span>Tirupur & beyond</span>
          </div>
          <MoveUpRight size={19} />
        </div>
        <span className="tc-art-coordinate">11.1085° N &nbsp; 77.3411° E</span>
        <div className="tc-art-seal">
          THE
          <br />
          TIRUPUR
          <br />
          CONNECTION
        </div>
      </div>
    </section>
  );
}
