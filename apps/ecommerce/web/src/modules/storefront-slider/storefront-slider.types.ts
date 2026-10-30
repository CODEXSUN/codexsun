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

export type StorefrontSliderPayload = Omit<
  StorefrontSliderRecord,
  "createdAt" | "frappeDocumentName" | "frappeModifiedAt" | "id" | "updatedAt" | "uuid"
>;

export type FrappeSliderItem = {
  brand: string;
  description: string;
  image: string;
  itemCode: string;
  itemGroup: string;
  itemName: string;
};

export type SliderStorageSettings = {
  acceptedMimeTypes: ["image/webp"];
  maxUploadBytes: number;
  publicPath: "/";
};

export type FrappeCatalogSyncResult = {
  catalogs: number;
  direction: "frappe-to-own" | "own-to-frappe";
  erpnextItems: number;
  items: number;
  message: string;
  sliders: number;
};
