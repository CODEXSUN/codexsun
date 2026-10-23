import { createContext, useContext } from "react";
export type MarketingTransport = {
  scopeKey: string;
  publicUrl: (path: string) => string;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
};
export const MarketingTransportProvider = createContext<MarketingTransport | null>(null);
export function useMarketingTransport() {
  const value = useContext(MarketingTransportProvider);
  if (!value) throw new Error("Marketing session transport is unavailable.");
  return value;
}
