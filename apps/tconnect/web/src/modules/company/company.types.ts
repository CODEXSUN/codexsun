export type Company = {
  uuid: string;
  logoDataUrl: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  city: string;
  color: string;
  initials: string;
  role: "manufacturer" | "supplier" | "buyer" | "service";
  products: string;
  capacity: string;
  established: number;
  associationUuid: string | null;
  website: string;
  status: "active" | "inactive";
};
