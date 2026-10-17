export type CommunityPost = {
  uuid: string;
  title: string;
  body: string;
  category: "knowledge" | "event" | "opportunity" | "announcement";
  associationUuid: string;
  eventDate: string | null;
  status: "active" | "inactive";
};
