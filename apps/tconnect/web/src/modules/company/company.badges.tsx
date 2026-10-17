import { BadgeCheck, ShieldCheck, Info } from "lucide-react";
import type { PublicCredential } from "../credential/credential.types";
export function CompanyBadges({
  sample,
  credentials = [],
  href
}: {
  sample: boolean;
  credentials?: PublicCredential[];
  href?: string;
}) {
  return (
    <div
      className="tc-company-badges"
      aria-label={
        sample && !credentials.length
          ? "Example credentials, not verified"
          : "Published credential reviews"
      }
    >
      {credentials.length ? (
        credentials.slice(0, 2).map((record) => (
          <a
            className={`tc-company-badge ${record.kind === "identity" ? "tc-company-badge-trusted" : "tc-company-badge-certified"}`}
            key={record.uuid}
            href={href ?? "#credentials"}
            title={`${record.issuer}: ${record.scope}. Valid until ${record.expiresOn}. View evidence.`}
          >
            {record.kind === "identity" ? <ShieldCheck size={15} /> : <BadgeCheck size={15} />}
            <span>{record.kind === "identity" ? "Trusted identity" : record.standardName}</span>
            <Info size={12} />
          </a>
        ))
      ) : sample ? (
        <>
          <span
            className="tc-company-badge tc-company-badge-certified"
            title="Sample badge only. No company certification has been verified."
          >
            <BadgeCheck size={15} aria-hidden="true" />
            Certified <small>Sample</small>
          </span>
          <span
            className="tc-company-badge tc-company-badge-trusted"
            title="Sample badge only. No trust review or endorsement has been completed."
          >
            <ShieldCheck size={15} aria-hidden="true" />
            Trusted <small>Sample</small>
          </span>
        </>
      ) : (
        <span className="tc-company-credentials-empty">View company credentials</span>
      )}
    </div>
  );
}
