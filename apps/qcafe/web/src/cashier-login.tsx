import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { CheckCircle2Icon, CoffeeIcon, LockIcon, PowerIcon, UserRoundIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  FirstSetupRequiredError,
  readPinStatus,
  setupCashierPin,
  signInWithPin,
  signInWithUsername,
  writeIdentitySession,
  type PinSession,
} from "./pin-api";

declare const __QCAFE_VERSION__: string | undefined;

type AuthMode = "pin" | "username" | "setup";

/**
 * Cashier-first sign-in matching the Q Cafe reference login.
 * First visit creates the four-digit cashier PIN, later visits sign in with it.
 * Managers/owners keep using their existing username + password via "Sign in with username".
 */
export function CashierLogin({ onSuccess }: { onSuccess: (session: PinSession) => void }) {
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [username, setUsername] = useState("cashier");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const submitting = useRef(false);
  const pinBoxes = useRef<Array<HTMLInputElement | null>>([]);
  const focusBox = (index: number) => {
    pinBoxes.current[index]?.focus();
    setFocusedIndex(index);
  };

  useEffect(() => {
    let cancelled = false;
    readPinStatus()
      .then((status) => {
        if (!cancelled) setMode(status.pinSet ? "pin" : "setup");
      })
      .catch(() => {
        if (!cancelled) setMode("pin");
      });
    fetch("/api/v1/qcafe/health", { signal: AbortSignal.timeout(5_000) })
      .then((response) => {
        if (!cancelled) setOnline(response.ok);
      })
      .catch(() => {
        if (!cancelled) setOnline(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode === "pin" || mode === "setup") focusBox(0);
  }, [mode]);

  function fail(message: string) {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin(["", "", "", ""]);
    setTimeout(() => focusBox(0), 60);
  }

  useEffect(() => {
    if ((mode !== "pin" && mode !== "setup") || busy || submitting.current) return;
    if (pin.some((digit) => digit === "")) return;
    submitting.current = true;
    void submitPin(pin.join(""), mode === "setup").finally(() => {
      submitting.current = false;
    });
  }, [pin, mode, busy]);

  function handlePinChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const slice = digits.slice(0, 4);
      const next = ["", "", "", ""];
      for (let i = 0; i < slice.length; i += 1) next[i] = slice[i] ?? "";
      setPin(next);
      focusBox(Math.min(slice.length, 3));
      return;
    }
    const next = [...pin];
    next[index] = digits.slice(-1);
    setPin(next);
    if (digits && index < 3) focusBox(index + 1);
  }

  function handlePinKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      event.preventDefault();
      const next = [...pin];
      next[index - 1] = "";
      setPin(next);
      focusBox(index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight" && index < 3) {
      event.preventDefault();
      focusBox(index + 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const full = pin.join("");
      if (full.length === 4) void submitPin(full, mode === "setup");
    }
  }

  function handlePinPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i] ?? "";
    setPin(next);
    focusBox(Math.min(pasted.length, 3));
  }

  async function submitPin(value: string, setup: boolean) {
    if (value.length !== 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      if (setup) {
        await setupCashierPin(value);
        complete(await signInWithPin(value));
      } else {
        complete(await signInWithPin(value));
      }
    } catch (reason) {
      if (reason instanceof FirstSetupRequiredError) {
        setMode("setup");
        fail("Create the first cashier PIN.");
      } else {
        fail(reason instanceof Error ? reason.message : "Incorrect PIN.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitUsername(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      complete(await signInWithUsername(username.trim(), password));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  function complete(session: PinSession) {
    writeIdentitySession({ expiresAt: session.session.expiresAt, roles: session.actor.roles, token: session.token });
    onSuccess(session);
  }

  if (!mode) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Opening Q Cafe…
      </main>
    );
  }

  const version = typeof __QCAFE_VERSION__ === "string" ? __QCAFE_VERSION__ : "dev";

  return (
    <main className="h-dvh w-screen overflow-hidden bg-background p-4 text-foreground">
      <style>{`@keyframes qcafe-shake { 0%, 100% { transform: translateX(0); } 15%, 45%, 75% { transform: translateX(-6px); } 30%, 60%, 90% { transform: translateX(6px); } } .animate-qcafe-shake { animation: qcafe-shake 0.45s ease-in-out both; }`}</style>
      <div className="fixed inset-0 grid place-items-center overflow-hidden p-4">
        <Card className="w-full max-w-sm rounded-3xl p-7 shadow-xl sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <CoffeeIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Q Cafe</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {mode === "setup"
                ? "Create the first four-digit cashier PIN."
                : mode === "pin"
                  ? "Enter your four-digit cashier PIN."
                  : "Sign in with your username and password."}
            </p>
          </div>

          {mode === "username" ? (
            <form className="space-y-4" onSubmit={submitUsername}>
              <div className="space-y-1.5">
                <label htmlFor="cashier-login-username" className="text-xs font-semibold text-muted-foreground">
                  Username
                </label>
                <div className="relative w-full">
                  <input
                    id="cashier-login-username"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    placeholder="e.g. cashier or admin"
                    className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <UserRoundIcon size={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cashier-login-password" className="text-xs font-semibold text-muted-foreground">
                  Password / PIN
                </label>
                <div className="relative w-full">
                  <input
                    id="cashier-login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    placeholder="Enter your password or PIN"
                    className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <LockIcon size={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <Button className="mt-2 h-11 w-full cursor-pointer rounded-xl font-semibold shadow-xs" disabled={busy || !username.trim() || !password} type="submit">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
              {error ? (
                <p role="alert" className="text-center text-xs font-medium text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="border-t border-border/60 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("pin");
                    setPin(["", "", "", ""]);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline sm:text-sm"
                >
                  <LockIcon size={14} />
                  <span>Sign in with 4-digit cashier PIN</span>
                </button>
              </div>
            </form>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitPin(pin.join(""), mode === "setup");
              }}
            >
              <div className={`flex items-center justify-center gap-3 py-1 sm:gap-3.5 ${shake ? "animate-qcafe-shake" : ""}`}>
                {pin.map((digit, index) => {
                  const isFilled = digit !== "";
                  const isFocused = focusedIndex === index;
                  return (
                    <input
                      key={index}
                      ref={(element) => {
                        pinBoxes.current[index] = element;
                      }}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={index === 0 ? 4 : 1}
                      value={digit}
                      onChange={(event) => handlePinChange(index, event.currentTarget.value)}
                      onKeyDown={(event) => handlePinKeyDown(index, event)}
                      onFocus={(event) => {
                        setFocusedIndex(index);
                        event.currentTarget.select();
                      }}
                      onPaste={handlePinPaste}
                      disabled={busy}
                      autoFocus={index === 0}
                      aria-label={`PIN digit ${index + 1}`}
                      className={`size-14 cursor-pointer rounded-2xl border-2 text-center font-mono text-2xl font-bold outline-none transition-all duration-150 select-none sm:size-15 ${
                        isFocused
                          ? "scale-105 border-primary bg-background text-foreground shadow-md ring-4 ring-primary/20"
                          : isFilled
                            ? "border-foreground/40 bg-accent/40 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/30"
                      } ${error ? "border-destructive/60" : ""}`}
                    />
                  );
                })}
              </div>
              {busy ? (
                <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-primary">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Opening workspace…</span>
                </div>
              ) : null}
              {error ? (
                <p role="alert" className="text-center text-xs font-medium text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="border-t border-border/60 pt-2 text-center">
                {mode === "setup" ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
                    <UserRoundIcon size={14} />
                    <span>Owner setup is required</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("username");
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline sm:text-sm"
                  >
                    <UserRoundIcon size={14} />
                    <span>Sign in with username</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>

      <div className="fixed bottom-6 left-6 z-50">
        <Badge variant="outline" className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2Icon size={14} />
          {online === null ? "Checking…" : online ? "Activated" : "Offline"}
        </Badge>
      </div>
      <div className="fixed right-6 bottom-24 z-50 flex flex-col items-end gap-3">
        <Button
          className="h-10 cursor-pointer gap-2 px-4 text-sm font-semibold shadow-sm"
          disabled={busy}
          onClick={() => window.close()}
          type="button"
          variant="outline"
        >
          <PowerIcon size={16} />
          Exit
        </Button>
        <p className="text-sm font-medium text-muted-foreground">v{version}</p>
      </div>
    </main>
  );
}

export type { PinSession };
