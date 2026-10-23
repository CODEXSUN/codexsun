import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import { useMarketingTransport } from "../../transport";
import { campaignActivity } from "./campaign.services";
import type { CampaignRecord } from "./campaign.types";
export function CampaignShow({record,onClose,onEdit}:{record:CampaignRecord;onClose:()=>void;onEdit:()=>void;}) {
 const api=useMarketingTransport();const activity=useQuery({queryKey:["marketing",api.scopeKey,"campaign-activity",record.uuid,record.updatedAt],queryFn:()=>campaignActivity(api,record.uuid)});
 return <WorkspaceUpsertDialog open onClose={onClose} title={record.name} description="Campaign details and activity."><WorkspaceDetailTable rows={[["Brand",record.brandUuid],["Name",record.name],["Objective",record.objective],["Channel",record.channel],["Landing Url",record.landingUrl],["Status",record.status],["Created",formatDateTime(record.createdAt)],["Updated",formatDateTime(record.updatedAt)]]}/>
 <h3 className="px-4 font-medium">Activity</h3>{activity.error?<p role="alert">{activity.error.message}</p>:null}
 <WorkspaceDetailTable rows={(activity.data??[]).map(item=>[formatDateTime(item.occurredAt),item.action+" by "+item.actor])}/>
 <div className="flex justify-end gap-2 p-4"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={onEdit}>Edit</Button></div></WorkspaceUpsertDialog>;
}
