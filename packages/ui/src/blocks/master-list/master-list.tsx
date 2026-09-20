import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  createDataTableColumnHelper,
  DataTableBlock,
  DataTableRowActions,
  type DataTableColumn,
} from "@codexsun/ui/blocks/table";
import type { InterfaceTopologyController } from "@codexsun/ui/features/interface-topology";
import type { MasterField, MasterRecord, MasterValue } from "./types";

export type MasterListProps = {
  fields: readonly MasterField[];
  records: readonly MasterRecord[];
  title: string;
  description?: string;
  emptyMessage?: string;
  createLabel?: string;
  variant?: "table" | "cards";
  showHeader?: boolean;
  showHeaderDivider?: boolean;
  topology?: InterfaceTopologyController;
  topologyIds?: {
    header: string;
    search: string;
    content: string;
    pagination: string;
    searchBar?: string;
    columnFilter?: string;
    rowHeader?: string;
    rows?: string;
    pageSize?: string;
    pageNavigation?: string;
  };
  onCreate?: () => void;
  onView?: (record: MasterRecord) => void;
  onEdit?: (record: MasterRecord) => void;
  onDelete?: (record: MasterRecord) => void;
};

const columnHelper = createDataTableColumnHelper<MasterRecord>();

function displayValue(field: MasterField, record: MasterRecord) {
  const value: MasterValue = record[field.id];
  if (field.format) return field.format(value, record);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value ?? "—";
}

function recordActions(record: MasterRecord, props: MasterListProps) {
  return [
    ...(props.onView ? [{ id: "view", label: "View", onSelect: () => props.onView?.(record) }] : []),
    ...(props.onEdit ? [{ id: "edit", label: "Edit", onSelect: () => props.onEdit?.(record) }] : []),
    ...(props.onDelete
      ? [
          {
            id: "delete",
            label: "Delete",
            tone: "destructive" as const,
            separatorBefore: true,
            onSelect: () => props.onDelete?.(record),
          },
        ]
      : []),
  ];
}

function MasterCards(props: MasterListProps & { visibleFields: readonly MasterField[] }) {
  const [search, setSearch] = useState("");
  const headingField = props.visibleFields.find((field) => field.id === "name") ?? props.visibleFields[0];
  const filtered = props.records.filter((record) =>
    props.visibleFields.some((field) =>
      String(record[field.id] ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ),
  );
  return (
    <section className="w-full space-y-4">
      {props.showHeader !== false ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{props.title}</h2>
            {props.description ? <p className="mt-1 text-sm text-muted-foreground">{props.description}</p> : null}
          </div>
          {props.onCreate ? (
            <Button onClick={props.onCreate}>
              <Plus />
              {props.createLabel ?? "Add record"}
            </Button>
          ) : null}
        </header>
      ) : null}
      <Input
        aria-label={`Search ${props.title}`}
        className="max-w-sm"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search records"
        value={search}
      />
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((record) => (
            <article className="min-w-0 rounded-lg border bg-card p-4 shadow-sm" key={record.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-semibold">{String(record[headingField?.id] ?? record.id)}</h3>
                <DataTableRowActions actions={recordActions(record, props)} label={`Actions for ${record.id}`} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                {props.visibleFields
                  .filter((field) => field.id !== headingField?.id)
                  .map((field) => (
                    <div className="flex justify-between gap-3" key={field.id}>
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="min-w-0 truncate text-right">{displayValue(field, record)}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {props.emptyMessage ?? "No records found."}
        </p>
      )}
    </section>
  );
}

export function MasterList(props: MasterListProps) {
  const visibleFields = useMemo(() => props.fields.filter((field) => field.showInList !== false), [props.fields]);
  const statusField = visibleFields.find((field) => field.id === "status");
  const columns = useMemo(() => {
    const result: DataTableColumn<MasterRecord>[] = visibleFields.map((field) =>
      columnHelper.display({ id: field.id, header: field.label, cell: ({ row }) => displayValue(field, row.original) }),
    );
    if (props.onView || props.onEdit || props.onDelete) {
      result.push(
        columnHelper.display({
          id: "actions",
          header: () => <MoreHorizontal aria-label="Actions" size={16} />,
          enableHiding: false,
          cell: ({ row }) => (
            <DataTableRowActions
              actions={recordActions(row.original, props)}
              label={`Actions for ${row.original.id}`}
            />
          ),
        }),
      );
    }
    return result;
  }, [visibleFields, props.onView, props.onEdit, props.onDelete]);

  if (props.variant === "cards") return <MasterCards {...props} visibleFields={visibleFields} />;
  return (
    <DataTableBlock
      columns={columns}
      data={[...props.records]}
      description={props.showHeader === false ? undefined : props.description}
      emptyMessage={props.emptyMessage ?? "No records found."}
      getRowId={(row) => row.id}
      getSearchText={(row) => visibleFields.map((field) => String(row[field.id] ?? "")).join(" ")}
      filterOptions={statusField?.options}
      getFilterValue={(row) => String(row.status ?? "")}
      itemLabel="records"
      pageWidth="full"
      showHeaderDivider={props.showHeaderDivider}
      primaryAction={
        props.showHeader === false ? undefined : props.onCreate ? (
          <Button onClick={props.onCreate}>
            <Plus />
            {props.createLabel ?? "Add record"}
          </Button>
        ) : undefined
      }
      title={props.showHeader === false ? undefined : props.title}
      topology={props.topology}
      topologyIds={props.topologyIds}
    />
  );
}
