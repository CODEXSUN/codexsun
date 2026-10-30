"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { cn } from "../lib/utils";

export type WorkspaceAnimatedTab = {
  content: ReactNode;
  label: ReactNode;
  value: string;
};

export function WorkspaceAnimatedTabs({
  className,
  contentPadding = false,
  contentClassName,
  keepMounted = false,
  listClassName,
  onValueChange,
  tabs,
  triggerClassName,
  value
}: {
  className?: string;
  contentPadding?: boolean;
  contentClassName?: string;
  keepMounted?: boolean;
  listClassName?: string;
  onValueChange: (value: string) => void;
  tabs: WorkspaceAnimatedTab[];
  triggerClassName?: string;
  value: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "w-full",
        tabs.length > 1 && "overflow-hidden rounded-md border border-border/70 bg-card shadow-sm",
        className
      )}
    >
      <TabsList
        className={cn(
          "workspace-scroll relative h-auto w-full flex-nowrap justify-start overflow-x-auto overflow-y-hidden rounded-none border-0 border-b border-border/70 bg-card p-0 shadow-none md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden",
          listClassName
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "relative -mb-px shrink-0 overflow-visible rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
              triggerClassName
            )}
          >
            {tab.label}
            {tab.value === value ? (
              <motion.span
                layoutId="workspace-tab-active-bar"
                className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-foreground shadow-[0_1px_0_rgba(15,23,42,0.18)] 2xl:inset-x-3"
                transition={{ damping: 28, mass: 0.85, stiffness: 260, type: "spring" }}
              />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          {...(keepMounted ? { forceMount: true } : {})}
          className={cn(
            tabs.length > 1 ? "mt-0 p-0 pb-2" : "mt-6 p-0 pb-2",
            keepMounted && "data-[state=inactive]:hidden",
            contentClassName,
            tabs.length > 1 && "mt-0"
          )}
        >
          {contentPadding ? <div className="p-4">{tab.content}</div> : tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
