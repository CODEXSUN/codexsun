import { useState } from "react";
import { QuotationWorkspace } from "../quotation/index";
import { ConversationWorkspace } from "../conversation/index";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceFormPanel, WorkspacePage } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import type { TconnectBuyerTab } from "./buyer.types";
import { BuyerCatalog } from "./buyer.catalog";
import { BuyerSent } from "./buyer.sent";
import { RequirementWorkspace } from "../requirement/index";
export function TconnectBuyerWorkspace({
  gateway,
  tab
}: {
  gateway: TconnectGateway;
  tab: TconnectBuyerTab;
}) {
  const [thread, setThread] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["tconnect", "buyer-session"],
    queryFn: gateway.buyer.session,
    retry: false
  });
  if (query.isPending) return <p role="status">Opening your buyer workspace…</p>;
  if (query.isError)
    return (
      <WorkspaceFormBanner title="Buyer access required">
        {query.error.message} Sign in with your registered buyer account.
      </WorkspaceFormBanner>
    );
  return (
    <WorkspacePage
      technicalName="tconnect.buyer"
      title={
        tab === "account"
          ? "Buyer account"
          : tab === "catalog"
            ? "Find products"
            : tab === "requirements"
              ? "My requirements"
              : tab === "quotations"
                ? "Quotations"
                : tab === "conversations"
                  ? "Messages"
                  : "Sent enquiries"
      }
      description={`${query.data.businessName} · ${query.data.city}`}
    >
      {tab === "quotations" ? (
        thread ? (
          <ConversationWorkspace
            key={thread}
            gateway={gateway}
            mode="buyer"
            conversationUuid={thread}
            onBack={() => setThread(null)}
          />
        ) : (
          <QuotationWorkspace gateway={gateway} mode="buyer" onDiscuss={setThread} />
        )
      ) : tab === "conversations" ? (
        <ConversationWorkspace gateway={gateway} mode="buyer" />
      ) : tab === "account" ? (
        <WorkspaceFormPanel title="Your registered contact details">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{query.data.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd>{query.data.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{query.data.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{query.data.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd>{query.data.city}</dd>
            </div>
          </dl>
        </WorkspaceFormPanel>
      ) : tab === "catalog" ? (
        <BuyerCatalog gateway={gateway} buyer={query.data} />
      ) : tab === "requirements" ? (
        <RequirementWorkspace gateway={gateway} />
      ) : (
        <BuyerSent gateway={gateway} />
      )}
    </WorkspacePage>
  );
}
