import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner, WorkspaceFormField } from "@codexsun/ui/workspace/upsert";
import { useChatTelegram } from "./chat.telegram.hooks";
import { chatTelegramCredentialsSchema } from "./chat.telegram.schema";

export function ChatTelegramAccountSettings() {
  const telegram = useChatTelegram();
  const account = telegram.account.data;
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [restart, setRestart] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  useEffect(() => {
    if (account?.apiId) setApiId(String(account.apiId));
  }, [account?.apiId]);
  const state = account?.authState ?? "disconnected";
  const pending = [
    "requesting_code",
    "verifying_code",
    "verifying_password",
    "refreshing",
    "disconnecting"
  ].includes(state);
  const busy =
    pending ||
    telegram.sendCode.isPending ||
    telegram.verifyCode.isPending ||
    telegram.verifyPassword.isPending ||
    telegram.disconnect.isPending;
  const credentialsVisible = restart || state === "disconnected";
  async function requestCode() {
    const parsed = chatTelegramCredentialsSchema.safeParse({ apiId, apiHash, phone });
    if (!parsed.success) {
      setInvalid(parsed.error.issues.map((issue) => String(issue.path[0])));
      setError(parsed.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    try {
      setError("");
      setInvalid([]);
      await telegram.sendCode.mutateAsync(parsed.data);
      setApiHash("");
      setPhone("");
      setInput("");
      setRestart(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not request a Telegram sign-in code."
      );
    }
  }
  async function verify() {
    if (!input || (state === "awaiting_code" && !/^\d{4,8}$/.test(input.trim()))) {
      setError("Enter the verification code sent by Telegram.");
      return;
    }
    try {
      setError("");
      if (state === "awaiting_password") await telegram.verifyPassword.mutateAsync(input);
      else await telegram.verifyCode.mutateAsync(input.trim());
      setInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Telegram sign-in failed.");
    }
  }
  async function disconnect() {
    try {
      setError("");
      await telegram.disconnect.mutateAsync();
      setConfirmDisconnect(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Telegram disconnect failed.");
    }
  }
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Telegram API connection</h2>
        <p className="text-sm text-muted-foreground">
          Connect your regular Telegram account with API ID and API hash.
        </p>
      </div>
      <Button asChild variant="outline" className="w-fit">
        <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer">
          Get API ID and API hash
        </a>
      </Button>
      <p className="text-sm text-muted-foreground">
        Open Telegram API development tools and create an application. Copy its API ID and API hash
        here, then sign in with your Telegram phone number.
      </p>
      {telegram.account.isPending && <p role="status">Loading Telegram connection…</p>}
      {telegram.account.isError && (
        <WorkspaceFormBanner title="Connection could not load">
          {telegram.account.error.message}
        </WorkspaceFormBanner>
      )}
      {account && (
        <p className="text-sm">
          {account.accountLabel || account.phoneLabel} · {state.replaceAll("_", " ")}
        </p>
      )}
      {(error || account?.lastError) && (
        <WorkspaceFormBanner title="Telegram connection needs attention">
          {error || account?.lastError}
        </WorkspaceFormBanner>
      )}
      {credentialsVisible && !telegram.account.isPending && !telegram.account.isError && (
        <>
          <WorkspaceFormField label="API ID" required>
            <Input
              aria-label="Telegram API ID"
              inputMode="numeric"
              value={apiId}
              onChange={(event) => setApiId(event.target.value)}
              disabled={busy}
              aria-invalid={invalid.includes("apiId")}
              className={invalid.includes("apiId") ? "border-destructive" : ""}
            />
            {invalid.includes("apiId") && (
              <p className="text-xs text-destructive">Enter a valid API ID.</p>
            )}
          </WorkspaceFormField>
          <WorkspaceFormField label="API hash" required>
            <Input
              aria-label="Telegram API hash"
              type="password"
              autoComplete="off"
              value={apiHash}
              onChange={(event) => setApiHash(event.target.value)}
              disabled={busy}
              aria-invalid={invalid.includes("apiHash")}
              className={invalid.includes("apiHash") ? "border-destructive" : ""}
            />
            {invalid.includes("apiHash") && (
              <p className="text-xs text-destructive">Enter the API hash from Telegram.</p>
            )}
          </WorkspaceFormField>
          <WorkspaceFormField label="Phone number" required>
            <Input
              aria-label="Telegram phone number"
              type="tel"
              placeholder="+919876543210"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={busy}
              aria-invalid={invalid.includes("phone")}
              className={invalid.includes("phone") ? "border-destructive" : ""}
            />
            {invalid.includes("phone") && (
              <p className="text-xs text-destructive">Include the country code and + prefix.</p>
            )}
          </WorkspaceFormField>
          <Button className="w-fit" disabled={busy} onClick={() => void requestCode()}>
            Send sign-in code
          </Button>
        </>
      )}
      {pending && (
        <p role="status" className="text-sm">
          Processing your Telegram request through Queue Manager…
        </p>
      )}
      {!restart && (state === "awaiting_code" || state === "awaiting_password") && (
        <>
          <WorkspaceFormField
            label={
              state === "awaiting_password" ? "Two-step verification password" : "Verification code"
            }
            required
          >
            <Input
              aria-label={
                state === "awaiting_password"
                  ? "Telegram two-step password"
                  : "Telegram verification code"
              }
              type={state === "awaiting_password" ? "password" : "text"}
              autoComplete={state === "awaiting_password" ? "off" : "one-time-code"}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={busy}
            />
          </WorkspaceFormField>
          <p className="text-sm text-muted-foreground">
            {state === "awaiting_password"
              ? "Telegram requires the two-step password you set on your account."
              : "Check the Telegram app for your sign-in code. Telegram may use another delivery method for your account."}
          </p>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => void verify()}>
              Sign in to Telegram
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setRestart(true);
                setInput("");
              }}
            >
              Request a new code
            </Button>
          </div>
        </>
      )}
      {state === "connected" && (
        <div className="flex flex-wrap gap-2">
          {confirmDisconnect ? (
            <>
              <p className="w-full text-sm">
                Disconnect this account and stop Chat synchronization?
              </p>
              <Button disabled={busy} onClick={() => void disconnect()}>
                Confirm disconnect
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmDisconnect(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmDisconnect(true)}>
              Disconnect Telegram account
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        API credentials and the Telegram session are encrypted on the server. Only Telegram
        conversations that you explicitly link below are shared with Chat.
      </p>
    </section>
  );
}
