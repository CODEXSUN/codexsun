export type StorefrontOrganisationInput = {
  companyId: number;
  financialYearId: number;
  displayName: string;
  logoFileName: string | null;
};
export type StorefrontOrganisation = {
  companyId: number | null;
  financialYearId: number | null;
  displayName: string;
  logoFileName: string | null;
};
export type StorefrontCompanyLogoReader = (
  tenantKey: string,
  companyId: number,
  variant: "logo" | "logo-dark"
) => Promise<{ buffer: Buffer; mimeType: string } | null>;
