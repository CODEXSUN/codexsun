import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import type {
  StorefrontFeaturedCard,
  StorefrontPromotion,
  StorefrontSlider
} from "./storefront.types";

export function resolveStorefrontCampaigns(
  promotions: StorefrontPromotion[],
  featuredCards: StorefrontFeaturedCard[],
  slides: StorefrontSlider[]
) {
  if (promotions.length) return promotions;
  if (featuredCards.length)
    return featuredCards.map((card) => ({
      ...card,
      promotionCode: `featured:${card.featuredCode}`
    }));
  if (slides.length)
    return slides.map((slide, index) => ({
      actionLabel: slide.actionLabel,
      actionUrl: slide.actionUrl,
      badge: "",
      badgePosition: "top-left" as const,
      badgeTextColor: "#ffffff",
      badgeTint: "neutral",
      description: slide.description,
      displayOrder: index + 1,
      eyebrow: slide.eyebrow,
      imageAlt: slide.imageAlt,
      imageUrl: slide.imageUrl,
      linkedItem: slide.linkedItem,
      offerPrice: 0,
      originalPrice: null,
      promotionCode: `slider:${slide.sliderCode}`,
      title: slide.title
    }));
  return fallbackCampaigns;
}

export function CampaignsAndEventsSection({ campaigns }: { campaigns: StorefrontPromotion[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (!campaigns.length) return null;
  const move = (direction: -1 | 1) =>
    track.current?.scrollBy({
      behavior: "smooth",
      left: direction * track.current.clientWidth * 0.82
    });

  return (
    <section className="cx-store__campaigns-events" aria-labelledby="campaigns-events-title">
      <header>
        <div>
          <span>What is happening now</span>
          <h2 id="campaigns-events-title">Campaigns and Events</h2>
        </div>
        <a href="/campaigns">
          See all <ArrowUpRightIcon />
        </a>
      </header>
      <div className="cx-store__campaigns-carousel">
        <button aria-label="Previous campaigns" onClick={() => move(-1)} type="button">
          <ArrowLeftIcon />
        </button>
        <div className="cx-store__campaigns-track" ref={track}>
          {campaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.promotionCode} />
          ))}
        </div>
        <button aria-label="Next campaigns" onClick={() => move(1)} type="button">
          <ArrowRightIcon />
        </button>
      </div>
    </section>
  );
}

export function CampaignsCollection({ campaigns }: { campaigns: StorefrontPromotion[] }) {
  return (
    <main className="cx-store__campaigns-page">
      <header>
        <span>Tech Media campaigns</span>
        <h1>Campaigns, events, and current opportunities.</h1>
        <p>
          Explore product launches, seasonal offers, learning events, giveaways, and customer
          programmes available through Tech Media.
        </p>
      </header>
      {campaigns.length ? (
        <div className="cx-store__campaigns-grid">
          {campaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.promotionCode} />
          ))}
        </div>
      ) : (
        <p className="cx-store__empty">No active campaigns are available right now.</p>
      )}
    </main>
  );
}

function CampaignCard({ campaign }: { campaign: StorefrontPromotion }) {
  return (
    <a className="cx-store__campaign-card" href={campaign.actionUrl}>
      <span>
        {campaign.imageUrl ? (
          <img
            alt={campaign.imageAlt || campaign.title}
            decoding="async"
            loading="lazy"
            src={campaign.imageUrl}
          />
        ) : (
          <span className="cx-store__campaign-placeholder" aria-hidden="true">
            TM
          </span>
        )}
        {campaign.badge ? <b>{campaign.badge}</b> : null}
      </span>
      <div>
        {campaign.eyebrow ? <small>{campaign.eyebrow}</small> : null}
        <strong>{campaign.title}</strong>
        {campaign.description ? <p>{campaign.description}</p> : null}
        <em>
          {campaign.actionLabel || "Explore campaign"} <ArrowUpRightIcon />
        </em>
      </div>
    </a>
  );
}

const fallbackCampaigns: StorefrontPromotion[] = [
  fallbackCampaign(
    "campaign:business",
    "Business technology consultation",
    "Plan systems, networking, security, and support around the way your team works."
  ),
  fallbackCampaign(
    "campaign:upgrade",
    "Computer upgrade week",
    "Review performance, memory, storage, and useful-life options with the Tech Media service team."
  ),
  fallbackCampaign(
    "campaign:student",
    "Student laptop guidance",
    "Compare practical laptops for study, projects, mobility, and long-term ownership."
  )
];

function fallbackCampaign(
  promotionCode: string,
  title: string,
  description: string
): StorefrontPromotion {
  return {
    actionLabel: "Talk to Tech Media",
    actionUrl: "/contact",
    badge: "",
    badgePosition: "top-left",
    badgeTextColor: "#ffffff",
    badgeTint: "neutral",
    description,
    displayOrder: 0,
    eyebrow: "Tech Media event",
    imageAlt: "",
    imageUrl: "",
    linkedItem: null,
    offerPrice: 0,
    originalPrice: null,
    promotionCode,
    title
  };
}
