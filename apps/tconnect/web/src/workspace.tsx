import { ProductWorkspace } from "./modules/product/index";
import { MemberReviewWorkspace } from "./modules/member/index";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { CompanyWorkspace } from "./modules/company/index";
import { AssociationWorkspace } from "./modules/association/index";
import { CommunityWorkspace } from "./modules/community/index";
import { InquiryWorkspace } from "./modules/inquiry/inquiry.workspace";
import type { TconnectGateway } from "./workspace.types";
export function TconnectWorkspace({ gateway }: { gateway: TconnectGateway }) {
  const [tab, setTab] = useState("companies");
  const associations = useQuery({
    queryKey: ["tconnect", "association"],
    queryFn: gateway.association.list
  });
  return (
    <WorkspacePage
      technicalName="tconnect.workspace"
      title="TConnect"
      description="Company profiles, associations, community publishing and buyer enquiries."
    >
      <div className="flex flex-wrap gap-2">
        {["companies", "products", "associations", "members", "community", "enquiries"].map(
          (item) => (
            <Button
              key={item}
              variant={tab === item ? "default" : "outline"}
              onClick={() => setTab(item)}
            >
              {item[0]?.toUpperCase()}
              {item.slice(1)}
            </Button>
          )
        )}
        <a
          className="ml-auto text-sm underline"
          href={gateway.publicPortalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open public portal
        </a>
      </div>
      {tab === "companies" ? (
        <CompanyWorkspace gateway={gateway} associations={associations.data ?? []} />
      ) : tab === "products" ? (
        <ProductWorkspace gateway={gateway} />
      ) : tab === "members" ? (
        <MemberReviewWorkspace gateway={gateway} />
      ) : tab === "associations" ? (
        <AssociationWorkspace gateway={gateway} associations={associations.data ?? []} />
      ) : tab === "community" ? (
        <CommunityWorkspace gateway={gateway} associations={associations.data ?? []} />
      ) : (
        <InquiryWorkspace gateway={gateway} />
      )}
    </WorkspacePage>
  );
}
