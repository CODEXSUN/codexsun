import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";

export function RamutexEnquiry({
  profile: ramuTex,
  contact
}: {
  profile: PageContent["profile"];
  contact: PageContent["contact"];
}) {
  const [ready, setReady] = useState(false);

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message || !ramuTex.emails[0]) return;
    const body = `Hello Ramu Tex,\n\n${message}\n\nName: ${name}\nEmail: ${email}\nCompany: ${String(data.get("company") ?? "").trim()}`;
    window.location.href = `mailto:${ramuTex.emails[0]}?subject=${encodeURIComponent("Fabric processing enquiry")}&body=${encodeURIComponent(body)}`;
    setReady(true);
  }

  return (
    <form className="rt-enquiry" onSubmit={prepareEmail}>
      <h3>{contact.formTitle}</h3>
      <p>{contact.formIntro}</p>
      <div className="rt-form-row">
        <label>
          Your name <span aria-hidden="true">*</span>
          <input name="name" autoComplete="name" required maxLength={120} placeholder="Full name" />
        </label>
        <label>
          Company
          <input
            name="company"
            autoComplete="organization"
            maxLength={160}
            placeholder="Company name"
          />
        </label>
      </div>
      <label>
        Email address <span aria-hidden="true">*</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@company.com"
        />
      </label>
      <label>
        Your requirement <span aria-hidden="true">*</span>
        <textarea
          name="message"
          rows={4}
          required
          maxLength={3000}
          placeholder="Fabric type, processing route, finish and approximate quantity…"
        />
      </label>
      <button className="rt-button rt-button-dark" type="submit" disabled={!ramuTex.emails[0]}>
        Prepare email enquiry <ArrowUpRight size={17} />
      </button>
      <p className="rt-form-note" role="status">
        {ready
          ? `Your email app has been requested. Review and send your enquiry there, or email ${ramuTex.emails[0]} directly.`
          : "Opens your email app with your enquiry. Nothing is sent from this website."}
      </p>
    </form>
  );
}
