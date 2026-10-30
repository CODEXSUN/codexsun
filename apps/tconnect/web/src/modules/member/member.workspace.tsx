import { QuotationWorkspace } from "../quotation/index";
import { ConversationWorkspace } from "../conversation/index";
import { RequirementWorkspace } from "../requirement/index";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { CompanyForm } from "../company/company.form";
import { InquiryWorkspace } from "../inquiry/inquiry.workspace";
import { ProductWorkspace } from "../product/product.workspace";
import type { TconnectGateway } from "../../workspace.types";
import type { TconnectMemberTab } from "./member.types";
export function TconnectMemberWorkspace({
  gateway,
  tab
}: {
  gateway: TconnectGateway;
  tab: TconnectMemberTab;
}) {
  const [thread, setThread] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["tconnect", "member-session"],
    queryFn: gateway.member.session
  });
  const companies = useQuery({
    queryKey: ["tconnect", "my-company"],
    queryFn: gateway.company.list,
    enabled: session.data?.mode === "member"
  });
  const associations = useQuery({
    queryKey: ["tconnect", "public-associations"],
    queryFn: gateway.member.associations
  });
  if (session.isPending)
    return (
      <p role="status" className="p-6">
        Opening your workspace…
      </p>
    );
  if (session.isError)
    return (
      <WorkspaceFormBanner title="Your workspace is unavailable">
        {session.error.message}
      </WorkspaceFormBanner>
    );
  if (session.data.mode !== "member")
    return (
      <WorkspacePage
        technicalName="tconnect.member"
        title="Seller account required"
        description="This sign-in does not have a registered seller profile."
      >
        <a href="/app/tconnect/overview">Open the staff workspace</a>
      </WorkspacePage>
    );
  const company = companies.data?.[0];
  return (
    <WorkspacePage
      technicalName="tconnect.member"
      title={
        tab === "profile"
          ? "Your company & branding"
          : tab === "products"
            ? "Your products"
            : tab === "opportunities"
              ? "Buyer requirements"
              : tab === "quotations"
                ? "Quotations"
                : tab === "conversations"
                  ? "Messages"
                  : "Buyer enquiries"
      }
      description="Manage your business on TConnect."
    >
      {saved ? (
        <p role="status" className="text-sm text-emerald-700">
          Company profile saved.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 rounded border p-3 text-sm">
        <span>{session.data.member?.name}</span>
        <span className="text-muted-foreground">
          Association membership: {session.data.member?.membershipStatus}
        </span>
        <a
          className="ml-auto underline"
          href={
            company
              ? `${gateway.publicPortalUrl}/companies/${company.slug}`
              : gateway.publicPortalUrl
          }
          target="_blank"
          rel="noreferrer"
        >
          View public profile
        </a>
      </div>
      {tab === "quotations" ? (
        thread ? (
          <ConversationWorkspace
            key={thread}
            gateway={gateway}
            mode="seller"
            conversationUuid={thread}
            onBack={() => setThread(null)}
          />
        ) : (
          <QuotationWorkspace gateway={gateway} mode="seller" onDiscuss={setThread} />
        )
      ) : tab === "conversations" ? (
        <ConversationWorkspace gateway={gateway} mode="seller" />
      ) : tab === "profile" ? (
        companies.isError ? (
          <WorkspaceFormBanner title="Could not load profile">
            {companies.error.message}
          </WorkspaceFormBanner>
        ) : company ? (
          <CompanyForm
            key={`${company.uuid}:${companies.dataUpdatedAt}`}
            memberOwned
            record={company}
            associations={associations.data ?? []}
            onCancel={() => void companies.refetch()}
            onSave={async (input, uuid) => {
              await gateway.company.save(input, uuid);
              await client.invalidateQueries({ queryKey: ["tconnect"] });
              setSaved(true);
            }}
          />
        ) : (
          <p role="status">Loading your company…</p>
        )
      ) : tab === "products" ? (
        <ProductWorkspace gateway={gateway} />
      ) : tab === "opportunities" ? (
        <RequirementWorkspace gateway={gateway} board />
      ) : (
        <InquiryWorkspace gateway={gateway} memberOwned />
      )}
    </WorkspacePage>
  );
}
