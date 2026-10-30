export type Member = {
  uuid: string;
  userUuid: string;
  companyUuid: string;
  name: string;
  email: string;
  accountType: "seller" | "association-member";
  requestedAssociationUuid: string | null;
  membershipNumber: string;
  membershipStatus: "none" | "pending" | "approved" | "rejected";
  status: "active" | "inactive";
};
export type MemberSession = { mode: "staff" | "member"; member: Member | null };
export type MemberReview = {
  membershipStatus: "approved" | "rejected";
  status: "active" | "inactive";
};
export type TconnectMemberTab =
  "profile" | "products" | "enquiries" | "opportunities" | "quotations" | "conversations";
