import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { CompanyForm } from "./company.form";
import {
  companiesQueryKey,
  companyLookupsQueryKey,
  useCompanies,
  useCompanyLookups
} from "./company.hooks";
import { CompanyList, companyColumns } from "./company.list";
import {
  activateCompany,
  createAddressTypeLookup,
  createBankNameLookup,
  createCityLookup,
  createCompany,
  createCountryLookup,
  createDistrictLookup,
  createPincodeLookup,
  createStateLookup,
  deactivateCompany,
  forceDeleteCompany,
  updateCompany
} from "./company.services";
import type {
  CompanyLookupCreate,
  CompanyLookups,
  CompanyRecord,
  CompanySavePayload
} from "./company.types";

const emptyLookups: CompanyLookups = {
  industries: [],
  addressTypes: [],
  bankNames: [],
  countries: [],
  states: [],
  districts: [],
  cities: [],
  pincodes: []
};
export function CompanyWorkspace() {
  const [listStatus, setListStatus] = useWorkspaceQueryValue("status", "all");
  const listTools = useWorkspaceListTools(
    Object.fromEntries(companyColumns.map((column) => [column.id, column.label]))
  );

  const client = useQueryClient(),
    [search, setSearch] = useWorkspaceQueryValue("q", ""),
    [editing, setLocalEditing] = useState<CompanyRecord | null | undefined>(undefined),
    query = useCompanies(search),
    lookupsQuery = useCompanyLookups(),
    records = query.data ?? [];
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/organisation/company";
  function setEditing(record: CompanyRecord | null | undefined) {
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
  }, [location.pathname, query.data]);
  const save = useMutation({
    mutationFn: (payload: CompanySavePayload) =>
      editing ? updateCompany(editing.id, payload) : createCompany(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: companiesQueryKey });
      toast.success("Company saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save company", { description: error.message })
  });
  const lifecycle = useMutation({
    mutationFn: ({
      record,
      type
    }: {
      record: CompanyRecord;
      type: "force-delete" | "restore" | "suspend";
    }) =>
      type === "force-delete"
        ? forceDeleteCompany(record.id)
        : type === "restore"
          ? activateCompany(record.id)
          : deactivateCompany(record.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: companiesQueryKey });
      toast.success("Company status updated");
    },
    onError: (error) => toast.error("Unable to update company", { description: error.message })
  });
  const refreshLookups = async <Record,>(work: () => Promise<Record>) => {
    const result = await work();
    await client.invalidateQueries({ queryKey: companyLookupsQueryKey });
    return result;
  };
  const createLookup: CompanyLookupCreate = {
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
      <CompanyForm
        createLookup={createLookup}
        error={save.error?.message ?? ""}
        loading={save.isPending}
        lookups={lookupsQuery.data ?? emptyLookups}
        lookupsLoading={lookupsQuery.isLoading}
        record={editing}
        records={records}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage title="" className="w-full max-w-none py-0 lg:w-full lg:py-0">
      <WorkspaceHeaderActions>
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          New company
        </Button>
      </WorkspaceHeaderActions>
      <WorkspaceFilters
        filterValue={listStatus}
        onFilterValueChange={setListStatus}
        filterOptions={[
          { id: "all", label: "All records" },
          {
            id: "active",
            label: "Active",
            count: (query.data ?? []).filter((record) => record.isActive).length
          },
          {
            id: "inactive",
            label: "Inactive",
            count: (query.data ?? []).filter((record) => !record.isActive).length
          }
        ]}
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        showSelectedFilterChip
        searchPlaceholder="Search code, company, phone, or email"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <CompanyList
        listTools={listTools}
        loading={query.isFetching && !query.data}
        records={records.filter(
          (record) =>
            listTools.matches({ ...record, status: record.isActive ? "active" : "inactive" }) &&
            (listStatus === "all" || (record.isActive ? "active" : "inactive") === listStatus)
        )}
        onEdit={setEditing}
        onForceDelete={(record) => {
          if (window.confirm(`Force delete ${record.name}?`))
            lifecycle.mutate({ record, type: "force-delete" });
        }}
        onRestore={(record) => lifecycle.mutate({ record, type: "restore" })}
        onSuspend={(record) => lifecycle.mutate({ record, type: "suspend" })}
      />
    </WorkspacePage>
  );
}
