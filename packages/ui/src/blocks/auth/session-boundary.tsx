import { useEffect, useState, type ReactNode } from "react";
import { createRandomId } from "../../lib/random-id";
import { LoginPage } from "./login-page";

type Session = {
  readonly expiresAt: string;
  readonly roles: readonly string[];
  readonly token: string;
};

export interface AuthenticatedRequest {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface AuthenticatedSession {
  readonly fetch: AuthenticatedRequest;
  readonly portal: "admin" | "super-admin" | "user";
  readonly roles: readonly string[];
  logout(): void;
}

export function SessionBoundary({
  applicationId,
  applicationName,
  autoLoginPath,
  children,
  loginPath,
  logoutPath,
  onAuthenticated,
  unauthenticated,
}: {
  readonly applicationId: string;
  readonly applicationName: string;
  readonly autoLoginPath?: string;
  readonly children: (session: AuthenticatedSession) => ReactNode;
  readonly loginPath: string;
  readonly logoutPath?: string;
  readonly onAuthenticated?: () => void;
  readonly unauthenticated?: ReactNode;
}) {
  const portal = portalFromLocation();
  const [browserSessionId] = useState(() => readBrowserSessionId(applicationId));
  const [error, setError] = useState<string>();
  const [session, setSession] = useState<Session | undefined>(() => readSession(applicationId));
  const [busy, setBusy] = useState(Boolean(autoLoginPath));
  const requiresPortalLogin = !session || !sessionCanAccessPortal(session.roles, portal);

  useEffect(() => {
    const restoreBrowserSession = (event: PageTransitionEvent) => {
      if (event.persisted) setSession(readSession(applicationId));
    };
    window.addEventListener("pageshow", restoreBrowserSession);
    return () => window.removeEventListener("pageshow", restoreBrowserSession);
  }, [applicationId]);

  useEffect(() => {
    writeSession(applicationId, session);
  }, [applicationId, session]);

  useEffect(() => {
    if (requiresPortalLogin) document.title = `${applicationName} | Login`;
  }, [applicationName, requiresPortalLogin]);

  useEffect(() => {
    if (!autoLoginPath || session) return;
    void authenticate(autoLoginPath, undefined, undefined, browserSessionId, setBusy, setError, setSession, onAuthenticated, true, portal);
  }, [autoLoginPath, browserSessionId, onAuthenticated, session]);

  useEffect(() => {
    if (!session || sessionCanAccessPortal(session.roles, portal)) return;
    window.location.replace(authenticatedRouteForRoles(session.roles));
  }, [portal, session]);

  useEffect(() => {
    if (!requiresPortalLogin || isPortalLoginPath(portal)) return;
    window.history.replaceState({}, "", portalLoginRoute(portal));
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [portal, requiresPortalLogin]);

  if (requiresPortalLogin) {
    if (unauthenticated) return <>{unauthenticated}</>;
    return (
      <LoginPage
        busy={busy}
        brandName={applicationName}
        error={error}
        registerHref={null}
        description={portalDescription(portal)}
        title={portalTitle(portal)}
        onSubmit={(identifier, password) =>
          void authenticate(loginPathForPortal(loginPath, portal), identifier, password, browserSessionId, setBusy, setError, setSession, () => completeAuthentication(portal, onAuthenticated), false)
        }
      />
    );
  }

  return (
    <>
      {children({
        fetch: (input, init) => authenticatedFetch(session, browserSessionId, input, init),
        portal: sessionPortal(session.roles),
        roles: session.roles,
        logout: () => logout(applicationId, session, browserSessionId, loginPath, setSession, logoutPath),
      })}
    </>
  );
}

async function authenticate(
  path: string,
  identifier: string | undefined,
  password: string | undefined,
  browserSessionId: string,
  setBusy: (value: boolean) => void,
  setError: (value: string | undefined) => void,
  setSession: (value: Session) => void,
  onAuthenticated: (() => void) | undefined,
  ignoreUnavailable: boolean,
  autoLoginDesk?: AuthenticatedSession["portal"],
): Promise<void> {
  setBusy(true);
  setError(undefined);
  try {
    const hasCredentials = identifier !== undefined;
    const response = await fetch(path, {
      body: JSON.stringify(hasCredentials ? { identifier, password } : {}),
      headers: {
        "x-codexsun-browser-session": browserSessionId,
        ...(autoLoginDesk ? { "x-codexsun-auto-login-desk": autoLoginDesk } : {}),
        "content-type": "application/json",
      },
      method: "POST",
    });
    if (ignoreUnavailable && response.status === 404) return;
    const body = (await response.json().catch(() => undefined)) as { actor?: { roles?: unknown }; error?: string; session?: { expiresAt?: string }; token?: string } | undefined;
    const roles = Array.isArray(body?.actor?.roles) && body.actor.roles.every((role) => typeof role === "string") ? body.actor.roles : undefined;
    if (!response.ok || !body?.token || !body.session?.expiresAt || !roles) throw new Error(body?.error ?? "Sign in failed.");
    setSession({ expiresAt: body.session.expiresAt, roles, token: body.token });
    if (ignoreUnavailable) completeAuthentication(sessionPortal(roles), onAuthenticated);
    else onAuthenticated?.();
  } catch (reason) {
    if (!ignoreUnavailable) setError(reason instanceof Error ? reason.message : "Sign in failed.");
  } finally {
    setBusy(false);
  }
}

function authenticatedFetch(
  session: Session,
  browserSessionId: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${session.token}`);
  headers.set("x-codexsun-browser-session", browserSessionId);
  return fetch(input, { ...init, headers });
}

function logout(
  applicationId: string,
  session: Session,
  browserSessionId: string,
  loginPath: string,
  setSession: (value: Session | undefined) => void,
  logoutPath = "/login",
): void {
  const logoutPathname = loginPath.replace(/\/login$/u, "/logout");
  void authenticatedFetch(session, browserSessionId, logoutPathname, { method: "POST" });
  writeSession(applicationId, undefined);
  window.history.replaceState({ loggedOut: true }, "", logoutPath);
  setSession(undefined);
}

function readSession(applicationId: string): Session | undefined {
  try {
    const value = window.sessionStorage.getItem(sessionStorageKey(applicationId));
    const session = value ? (JSON.parse(value) as Session) : undefined;
    if (!session?.token || !session.expiresAt || !Array.isArray(session.roles) || Date.parse(session.expiresAt) <= Date.now()) return undefined;
    return session;
  } catch {
    return undefined;
  }
}

function writeSession(applicationId: string, session: Session | undefined): void {
  const key = sessionStorageKey(applicationId);
  if (session) window.sessionStorage.setItem(key, JSON.stringify(session));
  else window.sessionStorage.removeItem(key);
}

function readBrowserSessionId(applicationId: string): string {
  const key = `codexsun.${applicationId}.browser-session`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = createRandomId();
  window.sessionStorage.setItem(key, value);
  return value;
}

function sessionStorageKey(applicationId: string): string {
  return `codexsun.${applicationId}.identity-session`;
}

function loginPathForPortal(loginPath: string, portal: AuthenticatedSession["portal"]): string {
  if (portal === "user") return loginPath;
  return loginPath.replace(/\/login$/u, `/${portal}/login`);
}

function portalFromLocation(): AuthenticatedSession["portal"] {
  if (window.location.pathname.startsWith("/sa/")) return "super-admin";
  if (window.location.pathname.startsWith("/admin/")) return "admin";
  return "user";
}

export function sessionCanAccessPortal(
  roles: readonly string[],
  portal: AuthenticatedSession["portal"],
): boolean {
  return sessionPortal(roles) === portal;
}

function isPortalLoginPath(portal: AuthenticatedSession["portal"]): boolean {
  return window.location.pathname === portalLoginRoute(portal);
}

function portalLoginRoute(portal: AuthenticatedSession["portal"]): string {
  if (portal === "super-admin") return "/sa/login";
  if (portal === "admin") return "/admin/login";
  return "/login";
}

function portalTitle(portal: AuthenticatedSession["portal"]): string {
  if (portal === "super-admin") return "Super administrator sign in";
  if (portal === "admin") return "Administrator sign in";
  return "Sign in";
}

function portalDescription(portal: AuthenticatedSession["portal"]): string {
  if (portal === "super-admin") return "Use your super-administrator username or email to access the maintenance desk.";
  if (portal === "admin") return "Use your administrator username or email to access the administration desk.";
  return "Use your username or email and password to access this application.";
}

function sessionPortal(roles: readonly string[]): AuthenticatedSession["portal"] {
  if (roles.includes("super-admin")) return "super-admin";
  if (roles.includes("admin")) return "admin";
  return "user";
}

function completeAuthentication(portal: AuthenticatedSession["portal"], onAuthenticated: (() => void) | undefined): void {
  if (onAuthenticated) return onAuthenticated();
  window.history.replaceState({}, "", authenticatedRouteForPortal(portal));
}

export function authenticatedRouteForRoles(roles: readonly string[]): string {
  return authenticatedRouteForPortal(sessionPortal(roles));
}

function authenticatedRouteForPortal(portal: AuthenticatedSession["portal"]): string {
  if (portal === "super-admin") return "/sa/desk";
  if (portal === "admin") return "/admin/desk";
  return "/overview";
}
