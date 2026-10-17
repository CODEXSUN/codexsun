import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Company } from "../company/company.types";
import { publicRequest } from "../../transport";
import { inquirySchema } from "./inquiry.schema";
export function InquiryForm({ company, onClose }: { company: Company; onClose: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = [
        ...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not([type="hidden"]), textarea, a[href]'
        ) ?? [])
      ].filter((item) => item.offsetParent !== null);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = inquirySchema.safeParse({
      ...Object.fromEntries(form),
      companyUuid: company.uuid,
      consent: form.get("consent") === "on"
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await publicRequest<{ uuid: string }>("/public/tconnect/inquiry", parsed.data);
      setReference(result.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not send enquiry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="tc-modal" onClick={onClose}>
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        className="tc-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="tc-close" onClick={onClose} aria-label="Close enquiry">
          ×
        </button>
        <span className="tc-eyebrow">START A CONVERSATION</span>
        <h2 id="enquiry-title">
          Tell {company.name}
          <br />
          what you need.
        </h2>
        {reference ? (
          <div role="status">
            <h3>Your enquiry has been received.</h3>
            <p>Reference: {reference}. The portal team can now review your request.</p>
            <p>Your request is saved for this company. No email or external message was sent.</p>
            <button className="tc-button" onClick={onClose}>
              Back to exploring
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="tc-enquiry-account-note">Want to track replies and compare quotations? <a href="/login">Sign in as a buyer</a>. You can also send this enquiry as a guest.</p>
            {error ? (
              <p role="alert" className="tc-error">
                {error}
              </p>
            ) : null}
            <div className="tc-form-grid">
              <label>
                Your name *<input name="buyerName" required minLength={2} autoComplete="name" />
              </label>
              <label>
                Business email *<input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                Contact number *<input name="phone" required minLength={7} autoComplete="tel" />
              </label>
              <label>
                Expected quantity *
                <input name="quantity" required placeholder="e.g. 2,000 pieces" />
              </label>
            </div>
            <label>
              Your requirement *
              <textarea
                name="requirement"
                required
                minLength={20}
                rows={4}
                placeholder="Product, specifications, delivery location and timeline"
              />
            </label>
            <input
              className="tc-honeypot"
              name="website"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              defaultValue=""
            />
            <label className="tc-consent">
              <input name="consent" type="checkbox" required />I agree to share these details with
              the portal team for this enquiry.
            </label>
            <button className="tc-button" disabled={busy}>
              {busy ? "Sending…" : "Send enquiry"}
            </button>
            <small>Business enquiry · No payment or order commitment</small>
          </form>
        )}
      </section>
    </div>
  );
}
