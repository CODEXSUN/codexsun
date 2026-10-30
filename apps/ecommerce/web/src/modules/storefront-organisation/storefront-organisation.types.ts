export type StorefrontOrganisation = {
  companyId: number | null;
  financialYearId: number | null;
  displayName: string;
  logoFileName: string | null;
};
export type StorefrontOrganisationOptions = {
  companies: Array<{ id: number; label: string }>;
  financialYears: Array<{ id: number; label: string }>;
};
