export type FeaturedCardStatus = "active" | "inactive";
export type FeaturedBadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type FeaturedCardRecord = {
  actionLabel: string;
  actionUrl: string;
  badge: string;
  badgePosition: FeaturedBadgePosition;
  badgeTint: string;
  badgeTextColor: string;
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
  offerPrice: number;
  originalPrice: number | null;
  published: boolean;
  featuredCode: string;
  startsAt: string | null;
  status: FeaturedCardStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};

export type FeaturedCardSaveInput = Omit<
  FeaturedCardRecord,
  "createdAt" | "frappeDocumentName" | "frappeModifiedAt" | "id" | "updatedAt" | "uuid"
>;

export type FeaturedCardFilters = {
  search?: string;
  status?: FeaturedCardStatus;
};
