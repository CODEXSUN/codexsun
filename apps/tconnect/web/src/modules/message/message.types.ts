export type Message = {
  uuid: string;
  body: string;
  senderSide: "buyer" | "seller";
  createdAt: string;
};
export type MessagePage = { messages: Message[]; nextBefore: string | null };
