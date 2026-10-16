import type { ReactNode } from "react";
import "./client-site.css";

type ClientCanvasProps = {
  children: ReactNode;
  client: "logicx" | "techmedia";
  theme: "blue" | "orange";
};

export function ClientCanvas({ children, client, theme }: ClientCanvasProps) {
  return (
    <div
      className="client-site-canvas"
      data-client={client}
      data-design-system="codexsun"
      data-design-variant={theme}
    >
      {children}
    </div>
  );
}
