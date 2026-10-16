import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { formatDateTime } from "@codexsun/ui/workspace";
import type { CodexsunGateway } from "../modules/requirements";
import { createCodexsunClientKey } from "../sync";

const messageSchema = z.object({
  nonce: z.string().max(64),
  text: z.string().max(240),
  sourcePortal: z.enum(["web", "desktop", "mobile"]),
  serverTime: z.string()
});
const changeSchema = z.object({
  resource: z.enum(["requirements", "devices"]),
  uuid: z.string(),
  action: z.string(),
  serverTime: z.string()
});
export function CodexsunRealtimePanel({
  gateway,
  portal,
  onChange
}: {
  gateway: CodexsunGateway;
  portal: "web" | "desktop" | "mobile";
  onChange?: () => void;
}) {
  const query = useQueryClient();
  const [connection, setConnection] = useState("Connecting…");
  const [messages, setMessages] = useState<z.infer<typeof messageSchema>[]>([]);
  const [text, setText] = useState("");
  const [ping, setPing] = useState("");
  const [send, setSend] = useState<((event: string, payload: object) => void) | null>(null);
  useEffect(() => {
    setMessages([]);
    setPing("");
    const socket = io(window.location.origin, {
      path: "/api/app/codexsun/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { sessionSlot: gateway.sessionKey, portal }
    });
    socket.on("connect", () => {
      setConnection("Live connected");
      void query.invalidateQueries({ queryKey: ["codexsun", "requirements", gateway.sessionKey] });
      onChange?.();
    });
    socket.on("disconnect", () => setConnection("Disconnected"));
    socket.on("connect_error", () => setConnection("Connection unavailable. Check your session."));
    socket.on("codexsun:changed", (value: unknown) => {
      if (!changeSchema.safeParse(value).success) return;
      void query.invalidateQueries({ queryKey: ["codexsun", "requirements", gateway.sessionKey] });
      onChange?.();
    });
    socket.on("codexsun:signal", (value: unknown) => {
      const result = messageSchema.safeParse(value);
      if (result.success) setMessages((previous) => [...previous.slice(-4), result.data]);
    });
    setSend(() => (event: string, payload: object) => {
      socket.timeout(5000).emit(event, payload, (error: Error | null, result: unknown) => {
        const response = z.object({ nonce: z.string(), serverTime: z.string() }).safeParse(result);
        if (error || !response.success) {
          setPing("Server did not acknowledge. Retry after reconnecting.");
          return;
        }
        setPing(`Server acknowledged at ${formatDateTime(response.data.serverTime)}`);
      });
    });
    return () => {
      socket.disconnect();
      setSend(null);
    };
  }, [gateway.sessionKey, portal, query, onChange]);
  const connected = connection === "Live connected";
  return (
    <section className="space-y-3" aria-label="Realtime device communication">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Device communication</h2>
        <span role="status" className="text-sm">
          {connection}
        </span>
        <Button
          variant="outline"
          disabled={!connected}
          onClick={() => send?.("codexsun:ping", { nonce: createCodexsunClientKey() })}
        >
          Ping server
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="Device message"
          placeholder="Send a message to your connected devices"
          maxLength={240}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button
          disabled={!connected || !text.trim()}
          onClick={() => {
            send?.("codexsun:signal", { nonce: createCodexsunClientKey(), text: text.trim() });
            setText("");
          }}
        >
          Send message
        </Button>
      </div>
      {ping && (
        <p className="text-sm" role="status">
          {ping}
        </p>
      )}
      <ul className="space-y-1 text-sm" aria-label="Live device messages">
        {messages.map((message) => (
          <li key={message.nonce}>
            {message.sourcePortal}: {message.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
