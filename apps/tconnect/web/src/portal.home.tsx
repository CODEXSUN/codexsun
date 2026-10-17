import { ArrowUpRight } from "lucide-react";
import type { PortalData } from "./portal.data";
import { PortalHero } from "./portal.hero";
import { PortalDirectory } from "./portal.directory";
import { PortalJourney } from "./portal.journey";
import { NetworkSnapshot } from "./portal.network";
import { CommunityPage } from "./modules/community/community.page";
import { textileCategories } from "./portal.categories";
import { FeedFeedback } from "./portal.feedback";
export function PortalHome({ data }: { data: PortalData }) {
  return (
    <main className="tc-home">
      <PortalHero />
      <nav className="tc-home-categories tc-container" aria-label="Explore textile categories">
        {textileCategories.slice(0, 6).map((item, index) => (
          <a key={item.name} href={`/companies?category=${encodeURIComponent(item.name)}`}>
            <span
              className="tc-category-mini-image"
              style={{
                backgroundImage: "url(/textiles/textile-collection.webp)",
                backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`
              }}
            />
            <span>{item.name}</span>
            <ArrowUpRight size={15} />
          </a>
        ))}
      </nav>
      <div className="tc-container">
        <PortalDirectory data={data} home />
      </div>
      <PortalJourney />
      <section className="tc-container tc-home-associations" aria-labelledby="home-associations">
        <div>
          <span className="tc-eyebrow">BUSINESS IS BETTER TOGETHER</span>
          <h2 id="home-associations">
            Your industry.
            <br />
            <em>In good company.</em>
          </h2>
          <p>
            Find the people, associations and specialist networks behind Tirupur’s textile
            ecosystem.
          </p>
          <a className="tc-text-link" href="/associations">
            Meet the associations <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="tc-association-stack">
          <FeedFeedback
            loading={data.associations.loading}
            error={data.associations.error}
            retry={data.associations.reload}
            label="Associations"
          />
          {data.associations.data.slice(0, 3).map((item) => (
            <a key={item.uuid} href={`/associations/${item.slug}`}>
              <span className="tc-association-logo" style={{ background: item.color }}>
                {item.initials}
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.city} ·{" "}
                  {
                    data.companies.data.filter((company) => company.associationUuid === item.uuid)
                      .length
                  }{" "}
                  published members
                </small>
              </span>
              <ArrowUpRight size={19} />
            </a>
          ))}
        </div>
      </section>
      <section className="tc-container tc-community-home">
        <div className="tc-section-heading">
          <div>
            <span className="tc-eyebrow">IDEAS WORTH SHARING</span>
            <h2>
              Keep good knowledge
              <br />
              <em>in circulation.</em>
            </h2>
          </div>
          <a className="tc-text-link" href="/community">
            Explore insights <ArrowUpRight size={18} />
          </a>
        </div>
        <FeedFeedback
          loading={data.posts.loading}
          error={data.posts.error}
          retry={data.posts.reload}
          label="Community updates"
        />
        <CommunityPage compact posts={data.posts.data} associations={data.associations.data} />
      </section>
      {!data.companies.error &&
      !data.associations.error &&
      !data.companies.loading &&
      !data.associations.loading ? (
        <NetworkSnapshot
          companies={data.companies.data}
          associationCount={data.associations.data.length}
        />
      ) : null}
      <section className="tc-container tc-home-resources">
        <a href="/standards">
          <span className="tc-eyebrow">SOURCE WITH CLARITY</span>
          <h3>
            Understand the standard.
            <br />
            <em>Ask a better question.</em>
          </h3>
          <p>Explore GOTS, GRS, OEKO-TEX and quality-management references.</p>
          <span className="tc-text-link">
            Certifications & standards <ArrowUpRight size={17} />
          </span>
        </a>
        <a href="/enterprises">
          <span className="tc-eyebrow">ROOM FOR YOUR BUSINESS</span>
          <h3>
            A distinctive presence.
            <br />
            <em>A wider conversation.</em>
          </h3>
          <p>Explore company spotlights and build a profile around your capabilities.</p>
          <span className="tc-text-link">
            Business spotlights <ArrowUpRight size={17} />
          </span>
        </a>
      </section>
      <section className="tc-bottom-cta tc-container">
        <span className="tc-eyebrow">THE NEXT CHAPTER STARTS HERE</span>
        <h2>
          One connection can
          <br />
          <em>change what comes next.</em>
        </h2>
        <a className="tc-button tc-button-light" href="/join">
          Join Tirupur Connect <ArrowUpRight size={18} />
        </a>
      </section>
    </main>
  );
}
