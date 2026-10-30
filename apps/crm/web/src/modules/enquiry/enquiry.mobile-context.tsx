import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, HardHat, PenLine, Phone, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { formatDate } from "@codexsun/ui/workspace";
import { CrmStatusBadge, prioritySwatch } from "../../crm-colors";
import { listEnquiryPage } from "./enquiry.services";
import { enquiryPhoneKey } from "./enquiry.phone";
import { enquiryTableText } from "./enquiry.table-text";
import type { EnquiryLookup, EnquiryRecord } from "./enquiry.types";

const recentLimit = 8;

export function EnquiryMobileContext({
  mobile,
  contactId,
  users,
  onSelectMobile,
  onSeeMoreEnquiries,
  onOpenEnquiry
}: {
  mobile: string | null;
  contactId: number | null;
  users: EnquiryLookup[];
  onSelectMobile: (mobile: string) => void;
  onSeeMoreEnquiries?: ((mobile: string, contactId: number | null) => void) | undefined;
  onOpenEnquiry?: ((id: string, mobile: string, contactId: number | null) => void) | undefined;
}) {
  const [recent, setRecent] = useState<string[]>(readRecentMobiles);
  const [search, setSearch] = useState("");
  const key = enquiryPhoneKey(mobile);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setSearch(mobile === key && key.length === 10 ? key : ""),
      350
    );
    return () => window.clearTimeout(timer);
  }, [key, mobile]);

  useEffect(() => {
    if (key.length !== 10 || mobile !== key) return;
    const timer = window.setTimeout(() => {
      setRecent((current) => {
        const next = [
          mobile.trim(),
          ...current.filter((item) => enquiryPhoneKey(item) !== key)
        ].slice(0, recentLimit);
        sessionStorage.setItem(recentStorageKey(), JSON.stringify(next));
        return next;
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [key, mobile]);

  const enquiries = useQuery({
    queryKey: ["crm", "enquiries", "mobile-context", search, contactId],
    queryFn: () =>
      listEnquiryPage({
        scope: "all",
        page: 1,
        pageSize: 5,
        search: "",
        mobile: search,
        ...(contactId ? { contactId } : {}),
        filter: "all"
      }),
    enabled: mobile === key && key.length === 10 && search === key,
    refetchInterval: 15000
  });
  const validMobile = mobile === key && key.length === 10;
  const currentSearch = validMobile && search === key;
  const matches = enquiries.data?.items ?? [];

  return (
    <aside className="min-w-0 space-y-4" aria-label="Mobile enquiry context">
      <Card className="rounded-md shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold">
          <span>Existing enquiries</span>
          {enquiries.data && currentSearch && enquiries.data.total > 0 ? (
            <span className="text-xs font-normal text-muted-foreground">
              {enquiries.data.total} found
            </span>
          ) : null}
        </div>
        {currentSearch ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mx-3 mt-2"
            disabled={enquiries.isFetching}
            onClick={() => void enquiries.refetch()}
            aria-label="Refresh existing enquiries"
          >
            <RefreshCw className="mr-2 size-3.5" /> Refresh
          </Button>
        ) : null}
        <div className="space-y-2 px-4 py-2">
          {!validMobile ? (
            <ContextMessage>
              Enter a 10-digit mobile number to see matching enquiries.
            </ContextMessage>
          ) : enquiries.isPending || !currentSearch ? (
            <ContextMessage>Searching enquiries...</ContextMessage>
          ) : enquiries.isError ? (
            <ContextMessage>Unable to load matching enquiries. Try Refresh.</ContextMessage>
          ) : matches.length === 0 ? (
            <ContextMessage>No existing enquiries for this mobile number.</ContextMessage>
          ) : (
            matches.map((item) => (
              <EnquiryContextRow
                key={item.id}
                item={item}
                users={users}
                onOpen={onOpenEnquiry ? () => onOpenEnquiry(item.id, search, contactId) : undefined}
              />
            ))
          )}
        </div>
        {onSeeMoreEnquiries && enquiries.data && currentSearch && enquiries.data.total > 0 ? (
          <div className="border-t px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => onSeeMoreEnquiries(search, contactId)}
            >
              See more in All Enquiries
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </Card>
      <Card className="rounded-md shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="size-4 text-muted-foreground" />
            Recent mobile numbers
          </div>
          {recent.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                sessionStorage.removeItem(recentStorageKey());
                setRecent([]);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
        <div className="p-2">
          {recent.length === 0 ? (
            <ContextMessage>Numbers entered here will appear in this tab.</ContextMessage>
          ) : (
            recent.map((number) => (
              <button
                key={enquiryPhoneKey(number)}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSelectMobile(number)}
              >
                <Phone className="size-3.5 text-muted-foreground" />
                <span>{number}</span>
              </button>
            ))
          )}
        </div>
      </Card>
    </aside>
  );
}

function EnquiryContextRow({
  item,
  users,
  onOpen
}: {
  item: EnquiryRecord;
  users: EnquiryLookup[];
  onOpen?: (() => void) | undefined;
}) {
  const assignedTo = users.find((user) => String(user.id) === String(item.assignedUserId))?.name;
  const creator =
    users.find((user) => user.email?.toLowerCase() === item.createdBy.toLowerCase())?.name ??
    item.createdBy;
  const message = enquiryTableText(item.description || item.title) || "Untitled enquiry";
  const date = formatDate(item.createdAt);
  return (
    <button
      type="button"
      className="block w-full space-y-3 rounded-sm border-b px-1 py-3 text-left text-sm last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
      aria-label={`Open enquiry #${item.enquiryNo}`}
      disabled={!onOpen}
      onClick={onOpen}
    >
      <div className="flex items-start gap-2 font-medium">
        <span
          aria-hidden="true"
          className={`mt-1 size-2.5 shrink-0 rounded-full ${prioritySwatch(item.priority)}`}
        />
        <span className="shrink-0">#{item.enquiryNo}</span>
        <span className="min-w-0 line-clamp-2 break-words">{message}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1" title={`Creator: ${creator}`}>
          <PenLine className="size-3.5" aria-hidden="true" />
          {creator}
        </span>
        <span aria-hidden="true">·</span>
        <span>{date}</span>
        <span aria-hidden="true">·</span>
        <span
          className="inline-flex items-center gap-1"
          title={`Assigned to: ${assignedTo ?? "Unassigned"}`}
        >
          <HardHat className="size-3.5" aria-hidden="true" />
          {assignedTo ?? "—"}
        </span>
        {item.closurePending ? (
          <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-900">
            Closure pending
          </span>
        ) : (
          <CrmStatusBadge code={item.status} label={item.statusName} />
        )}
      </div>
    </button>
  );
}

function ContextMessage({ children }: { children: string }) {
  return <p className="py-4 text-xs text-muted-foreground">{children}</p>;
}

function recentStorageKey() {
  const tenant = sessionStorage.getItem("codexsun_tenant_id") ?? "unknown";
  let user = "unknown";
  try {
    const identity = JSON.parse(sessionStorage.getItem("codexsun.auth.identity") ?? "null") as {
      email?: string;
    } | null;
    user = identity?.email ?? user;
  } catch {
    // Keep history scoped to the tenant if session identity is unavailable.
  }
  return `codexsun_crm_recent_mobiles:${tenant}:${user}`;
}

function readRecentMobiles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(recentStorageKey()) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").slice(0, recentLimit)
      : [];
  } catch {
    return [];
  }
}
