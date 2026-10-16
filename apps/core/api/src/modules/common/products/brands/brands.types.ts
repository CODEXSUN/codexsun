export type BrandsRecord = {
  id: number;
  isActive: boolean;
  logoAlt: string;
  logoUrl: string;
  name: string;
  showOnStorefront: boolean;
  sortOrder: number;
};

export type BrandsSavePayload = {
  name: string;
  isActive?: boolean;
  logoAlt?: string;
  logoUrl?: string;
  showOnStorefront?: boolean;
  sortOrder?: number;
};

export type BrandsListFilters = { search?: string };
