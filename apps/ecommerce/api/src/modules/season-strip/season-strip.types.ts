export type SeasonStripStatus = "active" | "inactive";
export type SeasonBadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type SeasonStripRecord = {
  actionLabel: string;
  actionUrl: string;
  badge: string;
  badgePosition: SeasonBadgePosition;
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
  seasonCode: string;
  startsAt: string | null;
  status: SeasonStripStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};

export type SeasonStripSaveInput = Omit<
  SeasonStripRecord,
  "createdAt" | "frappeDocumentName" | "frappeModifiedAt" | "id" | "updatedAt" | "uuid"
>;

export type SeasonStripFilters = {
  search?: string;
  status?: SeasonStripStatus;
};
