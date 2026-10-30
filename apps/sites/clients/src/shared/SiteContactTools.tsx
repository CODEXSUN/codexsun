import { useState } from "react";
import { MapPin, ArrowUpRight, MessageCircle } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import "./contact-tools.css";
export function CompanyMap({ profile }: { profile: PageContent["profile"] }) {
  const [loaded, setLoaded] = useState(false);
  const query = profile.mapQuery || profile.address.join(" ");
  if (!query) return <p className="company-map-empty">Contact our team for location details.</p>;
  const url = `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
  return (
    <section className="company-map" aria-label="Company location">
      <div className="company-map-heading">
        <MapPin size={20} />
        <h3>Find {profile.brand}</h3>
        <a href={url} target="_blank" rel="noreferrer">
          Directions <ArrowUpRight size={15} />
        </a>
      </div>
      {loaded ? (
        <iframe
          title={`${profile.name} map`}
          src={`${url}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      ) : (
        <div className="company-map-placeholder">
          <p>{profile.address.length ? profile.address.join(" ") : query}</p>
          <button type="button" onClick={() => setLoaded(true)}>
            Load interactive map
          </button>
          <small>Loading the map connects to Google Maps.</small>
        </div>
      )}
    </section>
  );
}
export function WhatsAppEnquiry({ profile, iconOnly = false }: { profile: PageContent["profile"]; iconOnly?: boolean }) {
  const number = profile.whatsappNumber ?? profile.phones[0]?.href.replace(/\D/g, "") ?? "";
  if (!/^[1-9][0-9]{6,14}$/.test(number)) return null;
  return (
    <a
      className={`site-whatsapp${iconOnly ? " site-whatsapp-icon" : ""}`}
      href={`https://wa.me/${number}?text=${encodeURIComponent(`Hello ${profile.name}, I would like to enquire about your services.`)}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`Enquire with ${profile.brand} on WhatsApp`}
    >
      {iconOnly ? (
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.87 11.87 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.15 1.6 5.96L.02 24l6.26-1.64a11.9 11.9 0 0 0 5.77 1.47h.01C18.63 23.83 24 18.48 24 11.9c0-3.19-1.24-6.18-3.48-8.42ZM12.06 21.82a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.72.97.99-3.63-.24-.37a9.86 9.86 0 0 1-1.52-5.27c0-5.47 4.45-9.92 9.91-9.92a9.85 9.85 0 0 1 7.02 2.91A9.85 9.85 0 0 1 22 11.92c0 5.46-4.46 9.9-9.94 9.9Zm5.44-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      ) : <><MessageCircle size={23} /><span>WhatsApp enquiry</span></>}
    </a>
  );
}
