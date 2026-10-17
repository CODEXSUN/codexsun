import { useEffect, useState, type FormEvent } from "react";
import type { Association } from "@codexsun/tconnect-web/public";
import { memberRegistration } from "@codexsun/tconnect-web/public";
import { memberLoginUrl, registerMember } from "@codexsun/tconnect-web/public";
export function MemberRegistration({
  associations,
  corporateId
}: {
  associations: Association[];
  corporateId: string;
}) {
  const requestedAssociation = new URLSearchParams(location.search).get("association");
  const validAssociation = associations.some((item) => item.uuid === requestedAssociation)
    ? requestedAssociation
    : null;
  const [accountType, setAccountType] = useState<"seller" | "association-member">(
    validAssociation ? "association-member" : "seller"
  );
  const [association, setAssociation] = useState<string | null>(validAssociation);
  useEffect(() => {
    if (validAssociation) {
      setAssociation(validAssociation);
      setAccountType("association-member");
    }
  }, [validAssociation]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.delete("associationChoice");
    const parsed = memberRegistration.safeParse({
      ...Object.fromEntries(form),
      corporateId,
      accountType,
      associationUuid: accountType === "seller" ? null : association,
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
      await registerMember(parsed.data);
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
        <span className="tc-eyebrow">YOUR BUSINESS. YOUR SPACE.</span>
        <h1>
          Make your next
          <br />
          <em>connection count.</em>
        </h1>
        <p>
          Create your company profile, introduce your products and manage buyer enquiries in your
          Platform workspace.
        </p>
        <div className="tc-registration-facts">
          <span>01 · Your own branded company page</span>
          <span>02 · Products and capabilities in one place</span>
          <span>03 · Buyer enquiries visible only to your team</span>
        </div>
      </section>
      <section className="tc-registration-card">
        <p>
          Here to source products? <a href="/register/buyer">Create a buyer account →</a>
        </p>
        {done ? (
          <div role="status" className="tc-registration-success">
            <span className="tc-eyebrow">YOU’RE REGISTERED</span>
            <h2>Your workspace is ready.</h2>
            <p>
              Sign in with your email and password. Your company starts as a draft. Complete the
              profile and set it Active to publish.
            </p>
            {accountType === "association-member" ? (
              <p>
                Your association request is pending staff approval. It does not yet appear as an
                affiliation.
              </p>
            ) : null}
            <p>
              Corporate ID: <strong>{corporateId}</strong>
            </p>
            <a className="tc-button" href={memberLoginUrl(corporateId)}>
              Sign in to Platform
            </a>
          </div>
        ) : (
          <>
            <div className="tc-register-tabs">
              <button
                className={accountType === "seller" ? "active" : ""}
                onClick={() => setAccountType("seller")}
              >
                Seller registration
              </button>
              <button
                className={accountType === "association-member" ? "active" : ""}
                onClick={() => setAccountType("association-member")}
              >
                Association member
              </button>
            </div>
            <form className="tc-register-form" onSubmit={submit}>
              {error ? (
                <p role="alert" className="tc-error">
                  {error}
                </p>
              ) : null}
              <div className="tc-form-grid">
                <label>
                  Your name *
                  <input name="name" autoComplete="name" required minLength={2} maxLength={180} />
                </label>
                <label>
                  Business email *
                  <input name="email" type="email" autoComplete="email" required maxLength={180} />
                </label>
                <label>
                  Company name *
                  <input
                    name="companyName"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={160}
                  />
                </label>
                <label>
                  Industry *
                  <input
                    name="industry"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="e.g. Textiles & Apparel"
                  />
                </label>
                <label>
                  City *
                  <input
                    name="city"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue="Tirupur"
                  />
                </label>
                <label>
                  Password *
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                  />
                  <small>At least 12 characters.</small>
                </label>
              </div>
              {accountType === "association-member" ? (
                <fieldset className="tc-association-choice">
                  <legend>Your association *</legend>
                  {associations.map((item) => (
                    <label key={item.uuid}>
                      <input
                        type="radio"
                        name="associationChoice"
                        value={item.uuid}
                        checked={association === item.uuid}
                        onChange={() => setAssociation(item.uuid)}
                      />
                      <span>
                        {item.name}
                        <small>
                          {item.city} · {item.industry}
                        </small>
                      </span>
                    </label>
                  ))}
                  <label>
                    Membership reference (optional)
                    <input name="membershipNumber" maxLength={80} />
                  </label>
                  <p>
                    Staff will review your affiliation. Registration does not verify membership.
                  </p>
                </fieldset>
              ) : (
                <input type="hidden" name="membershipNumber" value="" />
              )}
              <input
                className="tc-honeypot"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
              <label className="tc-consent">
                <input name="consent" type="checkbox" required />I agree to create a business
                account and share my published company information on Tirupur Connect.
              </label>
              <button className="tc-button" disabled={busy || !corporateId}>
                {busy ? "Creating your account…" : "Create your workspace"}
              </button>
              <p>
                Already registered?{" "}
                <a href={memberLoginUrl(corporateId)}>Sign in through Platform</a>
              </p>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
