import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { ContactForm } from "./contact.form";
import {
  contactLookupsQueryKey,
  contactsQueryKey,
  useContactLookups,
  useContacts
} from "./contact.hooks";
import { ContactList, type ContactColumnFilters } from "./contact.list";
import {
  createContact,
  createAddressTypeLookup,
  createBankNameLookup,
  createCityLookup,
  createContactGroupLookup,
  createContactTypeLookup,
  createCountryLookup,
  createDistrictLookup,
  createPincodeLookup,
  createStateLookup,
  forceDeleteContact,
  setContactActive,
  updateContact
} from "./contact.services";
import type {
  ContactLookupCreate,
  ContactLookups,
  ContactRecord,
  ContactSavePayload
} from "./contact.types";

const emptyLookups: ContactLookups = {
  contactTypes: [],
  contactGroups: [],
  addressTypes: [],
  bankNames: [],
  countries: [],
  states: [],
  districts: [],
  cities: [],
  pincodes: []
};
const contactColumns = [
  { id: "contact", label: "Contact" },
  { id: "code", label: "Code" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "status", label: "Status" }
] as const;

export function ContactWorkspace({
  basePath = "/app/core/master/contact",
  hideSinglePagePagination = false,
  showListHeader = true
}: {
  basePath?: string;
  hideSinglePagePagination?: boolean;
  showListHeader?: boolean;
}) {
  const client = useQueryClient(),
    [search, setSearch] = useWorkspaceQueryValue("q", ""),
    [page, setPage] = useWorkspaceQueryValue("page", 1),
    [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100),
    [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all"),
    [editing, setLocalEditing] = useState<ContactRecord | null | undefined>(undefined),
    query = useContacts(search),
    lookupsQuery = useContactLookups(),
    records = query.data ?? [];
  const listTools = useWorkspaceListTools(
    Object.fromEntries(contactColumns.map((column) => [column.id, column.label]))
  );
  const showInlineFilters = listTools.showFilters;
  const columnFilters: ContactColumnFilters = listTools.filters;
  const visibleColumns = Object.fromEntries(
    contactColumns.map((column) => [column.id, !listTools.hidden.includes(column.id)])
  );
  const location = useLocation();
  const navigate = useNavigate();
  function setEditing(record: ContactRecord | null | undefined) {
    setLocalEditing(record);
    const path =
      record === undefined
        ? basePath
        : record === null
          ? `${basePath}/new`
          : `${basePath}/${encodeURIComponent(record.id)}/edit`;
    if (location.pathname !== path) void navigate({ to: path, search: location.search });
  }
  useEffect(() => {
    const tail = location.pathname.slice(basePath.length).split("/").filter(Boolean);
    if (tail.length === 0) {
      setLocalEditing(undefined);
      return;
    }
    if (tail[0] === "new" && tail.length === 1) {
      setLocalEditing(null);
      return;
    }
    if (tail.length > 2 || (tail[1] && tail[1] !== "edit")) return;
    let id: string;
    try {
      id = decodeURIComponent(tail[0]!);
    } catch {
      return;
    }
    const record = query.data?.find((entry) => String(entry.id) === id);
    setLocalEditing((current) =>
      current && record && current.id === record.id ? current : record
    );
  }, [basePath, location.pathname, query.data]);
  const filteredRecords = records.filter((record) => {
    if (statusFilter === "active" && !record.isActive) return false;
    if (statusFilter === "inactive" && record.isActive) return false;
    return contactColumns.every(({ id }) => {
      const value = columnFilters[id as keyof ContactColumnFilters]?.trim().toLowerCase();
      if (!value) return true;
      const text =
        id === "contact"
          ? record.name
          : id === "code"
            ? record.code
            : id === "phone"
              ? record.primaryPhone
              : id === "email"
                ? record.primaryEmail
                : record.isActive
                  ? "active"
                  : "inactive";
      return (text ?? "").toLowerCase().includes(value);
    });
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const save = useMutation({
    mutationFn: (payload: ContactSavePayload) =>
      editing ? updateContact(editing.id, payload) : createContact(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: contactsQueryKey });
      toast.success("Contact saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save contact", { description: error.message })
  });
  const action = useMutation({
    mutationFn: ({ record, type }: { record: ContactRecord; type: "delete" | "toggle" }) =>
      type === "delete"
        ? forceDeleteContact(record.id)
        : setContactActive(record.id, !record.isActive),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: contactsQueryKey });
    },
    onError: (error) => toast.error("Unable to update contact", { description: error.message })
  });
  const refreshLookups = async <Record,>(work: () => Promise<Record>) => {
    const record = await work();
    await client.invalidateQueries({ queryKey: contactLookupsQueryKey });
    return record;
  };
  const createLookup: ContactLookupCreate = {
    contactType: (name) => refreshLookups(() => createContactTypeLookup(name)),
    contactGroup: (name) => refreshLookups(() => createContactGroupLookup(name)),
    addressType: (name) => refreshLookups(() => createAddressTypeLookup(name)),
    bankName: (name) => refreshLookups(() => createBankNameLookup(name)),
    country: (name) => refreshLookups(() => createCountryLookup(name)),
    state: (name, countryId) => refreshLookups(() => createStateLookup(name, countryId)),
    district: (name, stateId) => refreshLookups(() => createDistrictLookup(name, stateId)),
    city: (name, districtId) => refreshLookups(() => createCityLookup(name, districtId)),
    pincode: (postalCode, area, cityId) =>
      refreshLookups(() => createPincodeLookup(postalCode, area, cityId))
  };
  if (editing !== undefined)
    return (
      <ContactForm
        key={editing?.id ?? "new"}
        createLookup={createLookup}
        error={save.error?.message ?? ""}
        loading={save.isPending}
        lookups={lookupsQuery.data ?? emptyLookups}
        lookupsLoading={lookupsQuery.isLoading}
        record={editing}
        onBack={() => {
          setEditing(undefined);
        }}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage title="" className="w-full max-w-none py-0 lg:w-full lg:py-0">
      {showListHeader ? (
        <WorkspaceHeaderActions>
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New contact
          </Button>
        </WorkspaceHeaderActions>
      ) : null}
      <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions.map((column) => ({
          ...column,
          disabled: column.id === "contact"
        }))}
        onShowAllColumns={listTools.onShowAllColumns}
        searchPlaceholder="Search code, contact, phone, or email"
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterValue={statusFilter}
        showSelectedFilterChip
        onFilterValueChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All contacts", count: records.length },
          {
            id: "active",
            label: "Active",
            count: records.filter((record) => record.isActive).length
          },
          {
            id: "inactive",
            label: "Inactive",
            count: records.filter((record) => !record.isActive).length
          }
        ]}
      />
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <ContactList
        loading={query.isFetching && !query.data}
        records={visibleRecords}
        visibleColumns={visibleColumns}
        showInlineFilters={showInlineFilters}
        columnFilters={columnFilters}
        onColumnFilterChange={(column, value) => {
          listTools.setColumnFilter(column, value);
          setPage(1);
        }}
        onHideInlineFilters={listTools.hideFilters}
        onEdit={setEditing}
        onForceDelete={(record) => {
          if (confirm(`Force delete ${record.name}?`)) action.mutate({ record, type: "delete" });
        }}
        onToggle={(record) => action.mutate({ record, type: "toggle" })}
      />
      {!hideSinglePagePagination || totalPages > 1 ? (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRecords.length)}
          singularLabel="contact"
          totalCount={filteredRecords.length}
          totalPages={totalPages}
          onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      ) : null}
    </WorkspacePage>
  );
}
