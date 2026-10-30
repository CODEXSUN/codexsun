export type StorefrontAnnouncementStatus = "active" | "inactive";

export type StorefrontAnnouncementRecord = {
  createdAt: string;
  displayDurationMs: number;
  endsAt: string | null;
  eventKey: string;
  id: number;
  message: string;
  startsAt: string;
  status: StorefrontAnnouncementStatus;
  updatedAt: string;
};

export type StorefrontAnnouncementInput = {
  displayDurationMs?: number;
  endsAt?: string | null;
  message: string;
  startsAt?: string | undefined;
  status?: StorefrontAnnouncementStatus;
};
