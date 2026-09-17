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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">{status}</span>
        </div>
        <nav className="mt-4 flex gap-2">
          {menu.map((item) => (
            <Button key={item} className="bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
              {item}
            </Button>
          ))}
        </nav>
      </header>
      <section className="p-6">{children}</section>
    </main>
  );
}
