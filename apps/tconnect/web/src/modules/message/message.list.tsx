import { useEffect, useRef } from "react";
import { formatDateTime } from "@codexsun/ui/workspace";
import type { Message } from "./message.types";
export function MessageList({
  records,
  mode,
  buyerBusiness,
  sellerName
}: {
  records: Message[];
  mode: "buyer" | "seller";
  buyerBusiness: string;
  sellerName: string;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  const last = records.at(-1)?.uuid;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [last]);
  return (
    <div
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/10 p-3"
    >
      {!records.length ? (
        <p className="text-sm text-muted-foreground">
          Start the conversation. Ask a question or introduce your offer.
        </p>
      ) : (
        records.map((message) => (
          <article
            key={message.uuid}
            className={`max-w-[90%] rounded-lg border p-3 ${message.senderSide === mode ? "ml-auto bg-primary/5" : "bg-card"}`}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {message.senderSide === mode
                ? "You"
                : message.senderSide === "buyer"
                  ? buyerBusiness
                  : sellerName}{" "}
              · {formatDateTime(message.createdAt)}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
          </article>
        ))
      )}
      <div ref={bottom} />
    </div>
  );
}
