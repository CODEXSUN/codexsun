import type { ReactNode } from "react";
import { Button } from "../components/button";

export interface MdiMainProps {
  title: string;
  menu: string[];
  children: ReactNode;
  status: string;
}

export function MdiMain({ title, menu, children, status }: MdiMainProps) {
  return (
    <main className="min-h-screen bg-canvas text-foreground">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="rounded-md bg-success/15 px-2 py-1 text-xs text-success">{status}</span>
        </div>
        <nav className="mt-4 flex gap-2">
          {menu.map((item) => (
            <Button key={item} variant="ghost">
              {item}
            </Button>
          ))}
        </nav>
      </header>
      <section className="p-6">{children}</section>
    </main>
  );
}
