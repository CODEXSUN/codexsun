import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { enquirySchema } from "@codexsun/sites-api/enquiry-contract";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import "./enquiry.css";
export function ContactForm({ contact }: { contact: PageContent["contact"] }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const topic = (query.get("app") || query.get("service") || "").slice(0, 180);
    if (topic) setMessage(`I would like to discuss ${topic} for our business.`);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [reference, setReference] = useState("");
  const [key, setKey] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFields({});
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = enquirySchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      phone: data.get("phone"),
      message: data.get("message"),
      consent: data.get("consent") === "yes",
      website: data.get("website")
    });
    if (!parsed.success) {
      setError("Please check the highlighted fields.");
      setFields(parsed.error.flatten().fieldErrors);
      return;
    }
    const requestKey = key || crypto.randomUUID();
    setKey(requestKey);
    setBusy(true);
    try {
      const response = await fetch("/content/v1/enquiries", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
        body: JSON.stringify(parsed.data)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setFields(result.error?.fields ?? {});
        throw new Error(
          result.error?.message || "Your enquiry could not be saved. Please try again."
        );
      }
      setReference(result.data.reference);
      form.reset();
      setMessage("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your enquiry could not be saved. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }
  if (reference)
    return (
      <section className="site-enquiry enquiry-success" role="status">
        <CheckCircle2 size={36} />
        <h2>Thank you for getting in touch.</h2>
        <p>Your enquiry has been received. Our team will review your requirements.</p>
        <p className="enquiry-reference">Reference: {reference}</p>
        <button
          onClick={() => {
            setReference("");
            setKey("");
          }}
        >
          Send another enquiry
        </button>
      </section>
    );
  return (
    <form
      className="site-enquiry"
      onSubmit={(event) => void submit(event)}
      noValidate
      onChange={() => {
        if (key) setKey("");
      }}
    >
      <h2>{contact.formTitle}</h2>
      <p>{contact.formIntro}</p>
      {error ? (
        <p className="enquiry-error" role="alert">
          {error}
        </p>
      ) : null}
      <fieldset disabled={busy}>
        <div className="enquiry-row">
          <label>
            Your name <span className="enquiry-required">*</span>
            <input
              autoComplete="name"
              name="name"
              required
              maxLength={120}
              aria-invalid={Boolean(fields.name)}
            />
            {fields.name ? <small>{fields.name[0]}</small> : null}
          </label>
          <label>
            Email address <span className="enquiry-required">*</span>
            <input
              autoComplete="email"
              type="email"
              name="email"
              required
              maxLength={254}
              aria-invalid={Boolean(fields.email)}
            />
            {fields.email ? <small>{fields.email[0]}</small> : null}
          </label>
        </div>
        <div className="enquiry-row">
          <label>
            Company
            <input autoComplete="organization" name="company" maxLength={160} />
          </label>
          <label>
            Phone
            <input autoComplete="tel" name="phone" type="tel" maxLength={40} />
          </label>
        </div>
        <label>
          Your requirement <span className="enquiry-required">*</span>
          <textarea
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            minLength={10}
            maxLength={5000}
            required
            aria-invalid={Boolean(fields.message)}
            placeholder="Tell us about your project and what you need."
          />
          {fields.message ? <small>{fields.message[0]}</small> : null}
        </label>
        <label className="enquiry-trap" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="enquiry-consent">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            aria-invalid={Boolean(fields.consent)}
          />
          <span>
            I agree that my contact details can be used to respond to this enquiry.{" "}
            <a href="/privacy">Privacy notice</a>
          </span>
        </label>
        {fields.consent ? <small className="enquiry-error">{fields.consent[0]}</small> : null}
        <button className="enquiry-submit" type="submit">
          {busy ? "Sending enquiry…" : "Send enquiry"}
          <ArrowUpRight size={18} />
        </button>
        <p className="enquiry-note">
          Your enquiry is saved for this company. No email application is required.
        </p>
      </fieldset>
    </form>
  );
}
