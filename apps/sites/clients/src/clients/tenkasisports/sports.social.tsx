import { sportsSocialLinks } from "./sports.links";
import { SportsLink } from "./sports.link";

type SocialName = (typeof sportsSocialLinks)[number]["name"];

export function SportsSocialLinks({ isTa }: { isTa: boolean }) {
  return (
    <nav className="ts-footer-social" aria-label={isTa ? "சமூக ஊடக இணைப்புகள்" : "Social media links"}>
      <span className="ts-footer-social-label">{isTa ? "எங்களைப் பின்தொடருங்கள்" : "Follow us"}</span>
      {sportsSocialLinks.map(({ name, href }) => (
        <SportsLink
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} — Tenkasi District Sports Club`}
          title={name}
        >
          <SocialIcon name={name} />
        </SportsLink>
      ))}
    </nav>
  );
}

function SocialIcon({ name }: { name: SocialName }) {
  if (name === "Instagram") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.7" cy="6.4" r="1" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === "Facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M14.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5H18V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H8.5v3.2h2.8V21h3.4Z" /></svg>;
  }
  if (name === "YouTube") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 3 20 21M20 3 4 21" /></svg>;
}
