import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MasterForm,
  MasterList,
  MasterListDesk,
  type MasterField,
  type MasterRecord,
} from "../src/blocks/master-list/index";
import { designSystemTemplates } from "../src/design-system/index";

const fields: MasterField[] = [
  { id: "code", label: "Code", required: true },
  { id: "name", label: "Name", required: true },
  { id: "status", label: "Status", type: "select", options: [{ label: "Active", value: "active" }] },
  { id: "notes", label: "Notes", type: "textarea", showInList: false },
];
const records: MasterRecord[] = [
  { id: "one", code: "CAT-01", name: "Retail", status: "active", notes: "Private note" },
];

test("master list renders configured fields in table and cards", () => {
  for (const variant of ["table", "cards"] as const) {
    const html = renderToStaticMarkup(createElement(MasterList, { fields, records, title: "Categories", variant }));
    assert.match(html, /Categories/);
    assert.match(html, /CAT-01/);
    assert.match(html, /Retail/);
    assert.doesNotMatch(html, /Private note/);
  }
});

test("master form renders fields from one definition", () => {
  const html = renderToStaticMarkup(
    createElement(MasterForm, {
      fields,
      values: { code: "CAT-01", name: "Retail", status: "active", notes: "" },
      onValueChange: () => {},
      onSubmit: () => {},
      onCancel: () => {},
      title: "Edit category",
    }),
  );
  assert.match(html, /Edit category/);
  assert.match(html, /CAT-01/);
  assert.match(html, /Notes/);
  assert.match(html, /Save/);
});

test("master list registers four page versions", () => {
  const template = designSystemTemplates.find(({ id }) => id === "master-list");

  assert.equal(template?.defaultVariantId, "v1");
  assert.deepEqual(
    template?.variants.map(({ id }) => id),
    ["v1", "v2", "v3", "v4"],
  );
});

test("desk master list renders quick filters and dense record controls", () => {
  const deskRecords = [{ id: "ENQ-1", name: "Laptop enquiry", customer: "Northstar", age: "2 w" }];
  const html = renderToStaticMarkup(
    createElement(MasterListDesk, {
      columns: [
        { id: "name", label: "Enquiry Details", render: (record: (typeof deskRecords)[number]) => record.name },
        { id: "customer", label: "Customer", render: (record: (typeof deskRecords)[number]) => record.customer },
      ],
      filters: [{ id: "customer", label: "Customer" }],
      getFilterValue: (record: (typeof deskRecords)[number], filterId: string) =>
        String(record[filterId as keyof (typeof deskRecords)[number]] ?? ""),
      primaryActionLabel: "Add Enquiry",
      records: deskRecords,
      title: "Enquiry",
    }),
  );

  assert.match(html, /List View/);
  assert.match(html, /Saved Filters/);
  assert.match(html, /Laptop enquiry/);
  assert.match(html, /Load More/);
});
