export type CredentialInput = {
  companyUuid: string;
  kind: "certification" | "identity";
  standardName: string;
  issuer: string;
  reference: string;
  scope: string;
  publicEvidenceUrl: string;
  expiresOn: string;
  privateNotes: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  reviewConfirmed: boolean;
};
export type Credential = Omit<CredentialInput, "reviewConfirmed"> & {
  uuid: string;
  companyName: string;
  reviewedAt: string | null;
  reviewedBy: string;
};
export type PublicCredential = Omit<
  Credential,
  "companyName" | "privateNotes" | "reviewedBy" | "status"
>;
