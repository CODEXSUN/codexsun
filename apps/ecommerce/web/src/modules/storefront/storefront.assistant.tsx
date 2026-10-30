import { useEffect, useRef, useState } from "react";
import { SendIcon, XIcon } from "lucide-react";
import { listStorefrontProducts } from "./storefront.services";

type PikoMessage = { body: string; id: string; role: "assistant" | "user" };
type PikoConversation = { id: string; messages: PikoMessage[]; title: string };

export function PikoStoreAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PikoMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [busy, messages.length]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setMessages((current) => [...current, { body: text, id: `local-${Date.now()}`, role: "user" }]);
    try {
      const response = await fetch("/api/platform/public/piko/chat", {
        body: JSON.stringify({ message: text, threadId, visitorId: visitorId() }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (response.status === 404) {
        const products = await listStorefrontProducts(
          {
            brand: "",
            category: "",
            maxPrice: null,
            minPrice: null,
            scope: "all",
            search: text,
            sort: "featured"
          },
          { limit: 3, offset: 0 }
        );
        setMessages((current) => [
          ...current,
          {
            body: products.length
              ? `I found these products: ${products.map((product) => product.name).join(", ")}. Open the search results to compare them.`
              : "I could not find a matching product. Try a product name, brand, or category in the search bar.",
            id: `local-reply-${Date.now()}`,
            role: "assistant"
          }
        ]);
        return;
      }
      const envelope = (await response.json()) as {
        data?: PikoConversation;
        error?: { message?: string };
        success: boolean;
      };
      if (!response.ok || !envelope.success || !envelope.data)
        throw new Error(envelope.error?.message || "Piko could not answer.");
      setThreadId(envelope.data.id);
      setMessages(envelope.data.messages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Piko could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="cx-piko" aria-label="Piko shopping assistant">
      {open ? (
        <div className="cx-piko__panel">
          <header>
            <div>
              <strong>Piko</strong>
              <span>Your Smart Storekeeper</span>
            </div>
            <button aria-label="Close Piko" onClick={() => setOpen(false)}>
              <XIcon />
            </button>
          </header>
          <div className="cx-piko__messages">
            {!messages.length ? (
              <div className="cx-piko__welcome">
                <strong>What are you shopping for?</strong>
                <p>
                  I can help compare products, understand features, and find the right category.
                </p>
              </div>
            ) : (
              messages.map((item) => (
                <p className={item.role === "user" ? "is-user" : "is-piko"} key={item.id}>
                  {item.body}
                </p>
              ))
            )}
            {busy ? <p className="is-piko">Piko is checking the shop…</p> : null}
            {error ? <p className="cx-piko__error">{error}</p> : null}
            <div ref={end} />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              aria-label="Ask Piko"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about products…"
              value={message}
            />
            <button aria-label="Send message" disabled={busy || !message.trim()} type="submit">
              <SendIcon />
            </button>
          </form>
        </div>
      ) : null}
      <button
        aria-label="Open Piko shopping assistant"
        className="cx-piko__mascot"
        onClick={() => setOpen(true)}
        type="button"
      >
        🐼
      </button>
    </aside>
  );
}

function visitorId() {
  const key = "codexsun.piko.visitor";
  const existing = window.localStorage.getItem(key);
  if (existing && /^[a-f0-9]{16}$/u.test(existing)) return existing;
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  window.localStorage.setItem(key, value);
  return value;
}
