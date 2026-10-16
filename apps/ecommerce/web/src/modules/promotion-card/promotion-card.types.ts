export type PromotionCardStatus = "active" | "inactive";
export type PromotionBadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type PromotionCardRecord = {
  actionLabel: string;
  actionUrl: string;
  badge: string;
  badgePosition: PromotionBadgePosition;
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
  promotionCode: string;
  startsAt: string | null;
  status: PromotionCardStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};

export type PromotionCardPayload = Omit<
  PromotionCardRecord,
  "createdAt" | "frappeDocumentName" | "frappeModifiedAt" | "id" | "updatedAt" | "uuid"
>;

export type FrappePromotionItem = {
  brand: string;
  description: string;
  image: string;
  itemCode: string;
  itemGroup: string;
  itemName: string;
};

export type FrappeCatalogSyncResult = {
  catalogs: number;
  direction: "frappe-to-own" | "own-to-frappe";
  erpnextItems: number;
  items: number;
  message: string;
  promotions: number;
};
