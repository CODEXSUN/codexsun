export type WhatsAppMessage = {
  id: number;
  recipient: string;
  message: string;
  createdBy: string;
  userName: string | null;
  createdAt: string;
};
