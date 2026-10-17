import { MapPin, Phone, Mail, ArrowUpRight, ArrowDownToLine, ArrowRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { ContactForm } from "../../enquiry/ContactForm";
import { CompanyMap } from "../../shared/SiteContactTools";
import profileUrl from "./assets/ramu-tex-company-profile.pdf?url";
export function RamutexContact({ content }: { content: PageContent }) {
  const { profile, contact, footer } = content;
  return (
    <>
      <section id="contact" className="rt-section rt-contact">
        <div className="rt-wrap rt-contact-grid">
          <div>
            <p className="rt-eyebrow">{contact.label}</p>
            <h2>
              {contact.title}
              <br />
              <em>{contact.emphasis}</em>
            </h2>
            <p className="rt-contact-intro">{contact.intro}</p>
            <div className="rt-contact-block">
              <MapPin size={20} />
              <div>
                <h3>{contact.officeLabel}</h3>
                <address>
                  {profile.address.map((line, index) => (
                    <span key={index}>{line}</span>
                  ))}
                </address>
                <a
                  className="rt-text-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address.join(" "))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {contact.mapLabel}
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
            <div className="rt-contact-block">
              <Phone size={20} />
              <div>
                {profile.phones.map((phone, index) => (
                  <a key={index} href={`tel:${phone.href}`}>
                    {phone.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="rt-contact-block">
              <Mail size={20} />
              <div>
                {profile.emails.map((email, index) => (
                  <a key={index} href={`mailto:${email}`}>
                    {email}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <ContactForm contact={contact} />
        </div>
      </section>
      <div className="rt-wrap">
        <CompanyMap profile={profile} />
      </div>
      <footer className="rt-footer rt-wrap">
        <div className="rt-footer-top">
          <a className="rt-footer-name" href="#">
            {profile.brand}
            <ArrowUpRight size={32} />
          </a>
          <p>
            {footer.lineOne}
            <br />
            {footer.lineTwo}
          </p>
          <a className="rt-text-link" href={profileUrl} download>
            Company profile
            <ArrowDownToLine size={17} />
          </a>
        </div>
        <div className="rt-footer-bottom">
          <span>{profile.name}</span>
          <a href="/privacy">Privacy notice</a>
          {profile.gstin ? <span>GSTIN {profile.gstin}</span> : null}
          <a href={`https://${profile.domain}`} target="_blank" rel="noreferrer">
            {profile.domain}
            <ArrowRight size={14} />
          </a>
        </div>
      </footer>
    </>
  );
}
