export type LookupOption = {
  label: string;
  value: string;
};

export type EditableTableRow = {
  id: string;
  city: string;
  deliveryDate?: Date;
  itemName: string;
  notes: string;
  published: boolean;
  quantity: number;
  state: string;
};

export const INLINE_TABLE_FIRST_COLUMN_WIDTH = "w-[72px]";
export const INLINE_TABLE_LAST_COLUMN_WIDTH = "w-[52px]";

export const defaultStateOptions: LookupOption[] = [
  { label: "Tamil Nadu", value: "state:tn" },
  { label: "Karnataka", value: "state:ka" },
  { label: "Maharashtra", value: "state:mh" },
  { label: "Telangana", value: "state:ts" },
];

export const defaultCityOptionsByState: Record<string, LookupOption[]> = {
  "state:tn": [
    { label: "Chennai", value: "city:chn" },
    { label: "Coimbatore", value: "city:cjb" },
    { label: "Tiruppur", value: "city:trp" },
  ],
  "state:ka": [
    { label: "Bengaluru", value: "city:blr" },
    { label: "Mysuru", value: "city:mys" },
    { label: "Hubballi", value: "city:hub" },
  ],
  "state:mh": [
    { label: "Mumbai", value: "city:bom" },
    { label: "Pune", value: "city:pnq" },
    { label: "Nagpur", value: "city:nag" },
  ],
  "state:ts": [
    { label: "Hyderabad", value: "city:hyd" },
    { label: "Warangal", value: "city:wgl" },
    { label: "Karimnagar", value: "city:krn" },
  ],
};

export function createLookupValue(prefix: string, label: string) {
  return `${prefix}:${label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export function getCityOptions(
  state: string,
  cityOptionsByState: Record<string, LookupOption[]>,
) {
  return cityOptionsByState[state] ?? [];
}

export function getDefaultCity(
  state: string,
  cityOptionsByState: Record<string, LookupOption[]>,
) {
  return getCityOptions(state, cityOptionsByState)[0]?.value ?? "";
}

export function createSampleRows(): EditableTableRow[] {
  return [
    {
      id: "row-001",
      itemName: "North yard dispatch",
      quantity: 24,
      deliveryDate: new Date("2026-04-09"),
      state: "state:tn",
      city: "city:trp",
      notes: "Priority first truck",
      published: true,
    },
    {
      id: "row-002",
      itemName: "Retail launch bundle",
      quantity: 14,
      deliveryDate: new Date("2026-04-12"),
      state: "state:ka",
      city: "city:blr",
      notes: "Artwork proof attached",
      published: false,
    },
    {
      id: "row-003",
      itemName: "Trade sample follow-up",
      quantity: 8,
      deliveryDate: new Date("2026-04-15"),
      state: "state:mh",
      city: "city:pnq",
      notes: "Hold invoice till approval",
      published: true,
    },
  ];
}

export function getNextRowId(rows: EditableTableRow[]) {
  const nextNumber =
    rows.reduce((highest, row) => {
      const match = row.id.match(/row-(\d+)/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;

  return `row-${String(nextNumber).padStart(3, "0")}`;
}

export function buildEmptyRow(
  rows: EditableTableRow[],
  stateOptions: LookupOption[],
  cityOptionsByState: Record<string, LookupOption[]>,
): EditableTableRow {
  const state = stateOptions[0]?.value ?? "";

  return {
    id: getNextRowId(rows),
    itemName: "",
    quantity: 1,
    deliveryDate: undefined,
    state,
    city: getDefaultCity(state, cityOptionsByState),
    notes: "",
    published: false,
  };
}
