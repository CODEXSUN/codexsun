import assert from "node:assert/strict";
import test from "node:test";
import { pricePosLines } from "./pos.service.js";

test("POS uses server prices and rounds fractional quantities to paise", () => {
  const lines = pricePosLines(
    { requestId: "", lines: [{ menuUuid: "1234abcd", quantity: 1.125 }] },
    [{ uuid: "1234abcd", code: "TEA", name: "Tea", price: 1250 }]
  );
  assert.equal(lines[0]?.amount, 1406);
  assert.equal(lines[0]?.rate, 1250);
});

test("POS rejects unavailable items and duplicate lines", () => {
  const line = { menuUuid: "1234abcd", quantity: 1 };
  assert.throws(
    () => pricePosLines({ requestId: "", lines: [line] }, []),
    /inactive or unavailable/u
  );
  assert.throws(
    () =>
      pricePosLines({ requestId: "", lines: [line, line] }, [
        { uuid: "1234abcd", code: "TEA", name: "Tea", price: 1250 }
      ]),
    /duplicate/u
  );
});
