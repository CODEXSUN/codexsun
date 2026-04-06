import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEmptyRow,
  createLookupValue,
  createSampleRows,
  defaultCityOptionsByState,
  defaultStateOptions,
  getNextRowId,
} from "../../apps/ui/src/components/blocks/inline-editable-table.utils";

test("createLookupValue normalizes labels", () => {
  assert.equal(
    createLookupValue("state", "Tamil Nadu West"),
    "state:tamil-nadu-west",
  );
});

test("getNextRowId increments from existing rows", () => {
  assert.equal(getNextRowId(createSampleRows()), "row-004");
});

test("buildEmptyRow uses first state and matching default city", () => {
  const row = buildEmptyRow([], defaultStateOptions, defaultCityOptionsByState);

  assert.equal(row.id, "row-001");
  assert.equal(row.state, "state:tn");
  assert.equal(row.city, "city:chn");
  assert.equal(row.quantity, 1);
  assert.equal(row.published, false);
});
