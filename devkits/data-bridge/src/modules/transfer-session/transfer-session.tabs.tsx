import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@codexsun/ui/components/tabs";
import type { TransferSession } from "./transfer-session.types.js";
export function ImportStageTabs({
  stage,
  session,
  onNavigate,
  children
}: {
  stage: number;
  session: TransferSession | null;
  onNavigate: (stage: number) => void;
  children: ReactNode;
}) {
  return (
    <Tabs value={String(stage)} onValueChange={(value) => onNavigate(Number(value))}>
      <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
        {["Table Mapping", "Field Mapping", "Import Preparation", "Confirm Import", "Results"].map(
          (label, index) => (
            <TabsTrigger
              key={label}
              value={String(index + 2)}
              disabled={index > 0 && index < 4 && (!session || session.stage < index + 2)}
            >
              {label}
            </TabsTrigger>
          )
        )}
      </TabsList>
      <TabsContent value={String(stage)}>{children}</TabsContent>
    </Tabs>
  );
}
