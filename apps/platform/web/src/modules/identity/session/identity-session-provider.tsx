import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Actor } from "@codexsun/platform-core/identity";
import type { IdentitySessionGateway } from "./identity-session-gateway";

export type WebSessionState = "anonymous" | "active";

interface WebSessionContextValue {
  readonly actor: Actor | undefined;
  readonly state: WebSessionState;
  start(token: string): Promise<void>;
  end(): void;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

const WebSessionContext = createContext<WebSessionContextValue | undefined>(undefined);

interface IdentitySessionProviderProps {
  readonly children: ReactNode;
  readonly gateway: IdentitySessionGateway;
}

export function IdentitySessionProvider({ children, gateway }: IdentitySessionProviderProps) {
  const [session, setSession] = useState<{ actor: Actor; token: string } | undefined>();
  const value = useMemo<WebSessionContextValue>(
    () => ({
      actor: session?.actor,
      state: session ? "active" : "anonymous",
      async start(token) {
        const actor = await gateway.readCurrentActor(token);
        setSession({ actor, token });
      },
      end() {
        setSession(undefined);
      },
      fetch(input, init) {
        if (!session) return globalThis.fetch(input, init);
        const headers = new Headers(init?.headers);
        headers.set("authorization", `Bearer ${session.token}`);
        return globalThis.fetch(input, { ...init, headers });
      },
    }),
    [gateway, session],
  );
  return <WebSessionContext.Provider value={value}>{children}</WebSessionContext.Provider>;
}

export function useIdentitySession(): WebSessionContextValue {
  const session = useContext(WebSessionContext);
  if (!session) throw new Error("useIdentitySession must be used within IdentitySessionProvider.");
  return session;
}
