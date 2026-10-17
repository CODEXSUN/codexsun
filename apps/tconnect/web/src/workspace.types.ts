import type { Message, MessagePage } from "./modules/message/message.types";
import type { Conversation, ConversationInput } from "./modules/conversation/conversation.types";
import type { Quotation, QuotationInput } from "./modules/quotation/quotation.types";
import type {
  Buyer,
  CatalogProduct,
  BuyerInquiryInput,
  SentInquiry
} from "./modules/buyer/buyer.types";
import type { Requirement, RequirementInput } from "./modules/requirement/requirement.types";
import type { Company } from "./modules/company/company.types";
import type { Association } from "./modules/association/association.types";
import type { CommunityPost } from "./modules/community/community.types";
import type { Inquiry } from "./modules/inquiry/inquiry.types";
import type { Product, ProductInput } from "./modules/product/product.types";
import type { Member, MemberSession, MemberReview } from "./modules/member/member.types";
export type TconnectGateway = {
  message: {
    messages: (uuid: string, before?: string) => Promise<MessagePage>;
    send: (uuid: string, body: string) => Promise<Message>;
  };
  conversation: {
    list: () => Promise<Conversation[]>;
    get: (uuid: string) => Promise<Conversation>;
    open: (input: ConversationInput) => Promise<{ uuid: string }>;
  };
  quotation: {
    list: (conversationUuid?: string) => Promise<Quotation[]>;
    create: (input: QuotationInput) => Promise<{ uuid: string }>;
    withdraw: (uuid: string) => Promise<unknown>;
  };
  buyer: {
    session: () => Promise<Buyer>;
    search: (q: string) => Promise<CatalogProduct[]>;
    sent: () => Promise<SentInquiry[]>;
    send: (input: BuyerInquiryInput) => Promise<{ uuid: string }>;
  };
  requirement: {
    list: () => Promise<Requirement[]>;
    board: () => Promise<Requirement[]>;
    save: (input: RequirementInput, uuid?: string) => Promise<Requirement>;
  };
  product: {
    list: () => Promise<Product[]>;
    save: (input: ProductInput, uuid?: string) => Promise<Product>;
  };
  member: {
    session: () => Promise<MemberSession>;
    list: () => Promise<Member[]>;
    review: (uuid: string, input: MemberReview) => Promise<unknown>;
    associations: () => Promise<Association[]>;
  };
  publicPortalUrl: string;
  company: {
    list: () => Promise<Company[]>;
    save: (input: Omit<Company, "uuid">, uuid?: string) => Promise<Company>;
  };
  association: {
    list: () => Promise<Association[]>;
    save: (input: Omit<Association, "uuid">, uuid?: string) => Promise<Association>;
  };
  community: {
    list: () => Promise<CommunityPost[]>;
    save: (input: Omit<CommunityPost, "uuid">, uuid?: string) => Promise<CommunityPost>;
  };
  inquiry: {
    list: () => Promise<Inquiry[]>;
    setStatus: (uuid: string, status: Inquiry["status"]) => Promise<unknown>;
  };
};
