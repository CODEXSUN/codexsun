export type StorefrontSliderStatus = "active" | "inactive";

export type StorefrontSliderRecord = {
  actionLabel: string;
  actionUrl: string;
  createdAt: string;
  description: string;
  displayOrder: number;
  endsAt: string | null;
  eyebrow: string;
  frappeDocumentName: string;
  frappeModifiedAt: string | null;
  id: number;
  imageUrl: string;
  ishopItem: string | null;
  published: boolean;
  sliderCode: string;
  startsAt: string | null;
  status: StorefrontSliderStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};

export type StorefrontSliderSaveInput = Omit<
  StorefrontSliderRecord,
  "createdAt" | "frappeDocumentName" | "frappeModifiedAt" | "id" | "updatedAt" | "uuid"
>;

export type StorefrontSliderFilters = {
  search?: string;
  status?: StorefrontSliderStatus;
};
