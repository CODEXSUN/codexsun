import { useState, type FormEvent } from "react";
import { buyerRegistration } from "./buyer.schema";
import { registerBuyer, buyerLoginUrl } from "./buyer.services";
export function BuyerRegistration({ corporateId }: { corporateId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = buyerRegistration.safeParse({
      ...Object.fromEntries(form),
      corporateId,
      consent: form.get("consent") === "on"
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues.map((issue) => `${issue.path.join(" ")}: ${issue.message}`).join(" ")
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await registerBuyer(parsed.data);
      setDone(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration could not complete.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="tc-container">
      <section className="tc-register-intro">
        <span className="tc-eyebrow">BETTER SOURCING STARTS HERE</span>
        <h1>
          Find the right partner.
          <br />
          <em>Build what's next.</em>
        </h1>
        <p>
          From Tirupur knitwear to packaging, machinery and services. Bring your requirements to
          businesses that can deliver.
        </p>
        <div className="tc-registration-facts">
          <span>01 · Search products across industries</span>
          <span>02 · Publish requirements for sellers</span>
          <span>03 · Track every enquiry in your workspace</span>
        </div>
      </section>
      <section className="tc-registration-card">
        {done ? (
          <div className="tc-registration-success" role="status">
            <span className="tc-eyebrow">YOU'RE REGISTERED</span>
            <h2>Your buyer workspace is ready.</h2>
            <p>Sign in to post your first requirement and connect with sellers.</p>
            <a className="tc-button" href={buyerLoginUrl(corporateId)}>
              Sign in as buyer →
            </a>
          </div>
        ) : (
          <>
            <div className="tc-account-links">
              <a href="/register">Seller / Association member</a>
              <strong>Buyer</strong>
            </div>
            <h2>Create your buyer account</h2>
            <p>
              Already registered? <a href={buyerLoginUrl(corporateId)}>Buyer login →</a>
            </p>
            <form onSubmit={submit} className="tc-register-form">
              <div className="tc-form-grid">
                <label>
                  Your name
                  <input name="name" required minLength={2} maxLength={120} autoComplete="name" />
                </label>
                <label>
                  Business email
                  <input name="email" type="email" required maxLength={180} autoComplete="email" />
                </label>
                <label>
                  Business name
                  <input name="businessName" required minLength={2} maxLength={180} />
                </label>
                <label>
                  City
                  <input
                    name="city"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue="Tirupur"
                  />
                </label>
                <label>
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    required
                    minLength={7}
                    maxLength={30}
                    autoComplete="tel"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <small>Use at least 12 characters.</small>
                </label>
              </div>{" "}
              <input
                name="website"
                defaultValue=""
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: "none" }}
              />
              <label className="tc-consent">
                <input name="consent" type="checkbox" required />I agree to share my enquiry contact
                details with the sellers I contact.
              </label>
              {error ? <p role="alert">{error}</p> : null}
              <button className="tc-button" disabled={busy || !corporateId}>
                {busy ? "Creating account…" : "Create buyer account →"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
