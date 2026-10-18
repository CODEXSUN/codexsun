import { useQueries, useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { Activity, BriefcaseBusiness, MessageSquareText } from "lucide-react";
import { WorkspaceAnimatedTabs } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { buildShowingLabel, formatDateTime } from "@codexsun/ui/workspace";
import {
  EnquiryList,
  listEnquiryActivity,
  listEnquiryPage,
  useEnquiryOptions,
  type EnquiryActivity,
  type EnquiryColumnFilters,
  type EnquiryRecord
} from "../enquiry";

type ContactRelatedTab = "enquiries" | "activities";
type ContactActivity = EnquiryActivity & { enquiryNo: string };

export function ContactRelatedTabs({
  contactId,
  mobile,
  details,
  onOpenEnquiry
}: {
  contactId: number;
  mobile: string | null;
  details: ReactNode;
  onOpenEnquiry?: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ContactRelatedTab | "details">("enquiries");
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquiryPageSize, setEnquiryPageSize] = useState(100);
  const enquiryUsers = useEnquiryOptions(activeTab === "enquiries");
  useLayoutEffect(() => {
    setActiveTab("enquiries");
    setEnquiryPage(1);
  }, [contactId, mobile]);
  const enquiriesQuery = useQuery({
    queryKey: ["crm", "contact", contactId, "enquiries", mobile, enquiryPage, enquiryPageSize],
    queryFn: () =>
      listEnquiryPage({
        scope: "all",
        page: enquiryPage,
        pageSize: enquiryPageSize,
        search: "",
        filter: "all",
        ...(mobile ? { mobile: normalizePhone(mobile) } : { contactId })
      })
  });
  const enquiries = enquiriesQuery.data?.items ?? [];
  const activityEnquiriesQuery = useQuery({
    enabled: activeTab === "activities",
    queryKey: ["crm", "contact", contactId, "activity-enquiries", mobile],
    queryFn: () =>
      listEnquiryPage({
        scope: "all",
        page: 1,
        pageSize: 100,
        search: "",
        filter: "all",
        ...(mobile ? { mobile: normalizePhone(mobile) } : { contactId })
      })
  });
  const activityEnquiries = activityEnquiriesQuery.data?.items ?? [];
  const activityQueries = useQueries({
    queries: activityEnquiries.map((enquiry) => ({
      enabled: activeTab === "activities",
      queryKey: ["crm", "contact", contactId, "enquiry-activity", enquiry.id],
      queryFn: () => listEnquiryActivity(enquiry.id)
    }))
  });
  const activityRows = activityQueries
    .flatMap((query, index) =>
      (query.data ?? []).map((activity) => ({
        ...activity,
        enquiryNo: activityEnquiries[index]?.enquiryNo ?? activityEnquiries[index]?.id ?? ""
      }))
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const isLoadingActivity =
    activityEnquiriesQuery.isLoading || activityQueries.some((query) => query.isLoading);
  const activityError =
    activityEnquiriesQuery.error ?? activityQueries.find((query) => query.error)?.error;
  const tabs = [
    {
      value: "enquiries",
      label: (
        <TabLabel
          icon={<BriefcaseBusiness className="size-4" />}
          text="Enquiries"
          {...(enquiriesQuery.data ? { count: enquiriesQuery.data.total } : {})}
        />
      ),
      content: (
        <ContactEnquiries
          items={enquiries}
          total={enquiriesQuery.data?.total ?? 0}
          page={enquiryPage}
          pageSize={enquiryPageSize}
          loading={enquiriesQuery.isLoading}
          error={enquiriesQuery.error}
          users={enquiryUsers.data?.users ?? []}
          {...(onOpenEnquiry ? { onOpenEnquiry } : {})}
          onPageChange={setEnquiryPage}
          onPageSizeChange={(value) => {
            setEnquiryPageSize(value);
            setEnquiryPage(1);
          }}
        />
      )
    },
    {
      value: "activities",
      label: (
        <TabLabel
          icon={<Activity className="size-4" />}
          text="Activities"
          {...(activityRows.length ? { count: activityRows.length } : {})}
        />
      ),
      content: (
        <ContactActivities
          items={activityRows}
          loading={isLoadingActivity}
          error={activityError instanceof Error ? activityError : null}
        />
      )
    },
    {
      value: "details",
      label: <TabLabel icon={<MessageSquareText className="size-4" />} text="Details" />,
      content: details
    }
  ];

  return (
    <WorkspaceAnimatedTabs
      key={`${contactId}:${mobile ?? ""}`}
      tabs={tabs}
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ContactRelatedTab | "details")}
      listClassName="border-b-0 bg-card px-3 shadow-none"
      contentClassName="pt-2 rounded-t-md bg-card pb-0"
    />
  );
}

function ContactEnquiries({
  items,
  total,
  page,
  pageSize,
  loading,
  error,
  users,
  onOpenEnquiry,
  onPageChange,
  onPageSizeChange
}: {
  items: EnquiryRecord[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
  users: Array<{ id: string | number; name: string; email?: string; status: string }>;
  onOpenEnquiry?: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (error) return <RelatedError message={error.message} />;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const emptyFilters: EnquiryColumnFilters = {};
  return (
    <div className="space-y-3">
      <EnquiryList
        records={items}
        users={users}
        userColumnMode="both"
        showActions
        showViewAction
        emptyState="No enquiries for this contact."
        visibleColumns={{ customer: false }}
        showInlineFilters={false}
        columnFilters={emptyFilters}
        onColumnFilterChange={() => undefined}
        onHideInlineFilters={() => undefined}
        loading={loading}
        onShow={(record) => onOpenEnquiry?.(record.id)}
        openingCallId={null}
        panelClassName="rounded-t-none"
      />
      {totalPages > 1 ? (
        <WorkspacePagination
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[20, 50, 100]}
          showingLabel={buildShowingLabel(page, pageSize, total)}
          singularLabel="enquiry"
          totalCount={total}
          totalPages={totalPages}
          onNextPage={() => onPageChange(Math.min(totalPages, page + 1))}
          onPageChange={onPageChange}
          onPreviousPage={() => onPageChange(Math.max(1, page - 1))}
          onRowsPerPageChange={onPageSizeChange}
        />
      ) : null}
    </div>
  );
}

function ContactActivities({
  items,
  loading,
  error
}: {
  items: ContactActivity[];
  loading: boolean;
  error: Error | null;
}) {
  if (error) return <RelatedError message={error.message} />;
  return (
    <WorkspaceTablePanel className="rounded-t-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">By</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border/70" key={`${item.enquiryId}-${item.id}`}>
                <td className="px-4 py-3 font-medium">{item.action.replaceAll("-", " ")}</td>
                <td className="px-4 py-3">{item.details}</td>
                <td className="px-4 py-3">#{item.enquiryNo}</td>
                <td className="px-4 py-3">{item.createdBy}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <p className="p-4 text-sm text-muted-foreground">Loading activities…</p> : null}
        {!loading && items.length === 0 ? (
          <WorkspaceTableEmptyState>
            No activities have been recorded for this contact.
          </WorkspaceTableEmptyState>
        ) : null}
      </div>
    </WorkspaceTablePanel>
  );
}

function TabLabel({ icon, text, count }: { icon: ReactNode; text: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {text}
      {count !== undefined ? (
        <span className="rounded-full bg-muted px-1.5 text-xs">{count}</span>
      ) : null}
    </span>
  );
}

function RelatedError({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </p>
  );
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
