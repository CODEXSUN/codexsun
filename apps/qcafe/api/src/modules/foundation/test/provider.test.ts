import test from "node:test";
import assert from "node:assert/strict";
import { QcafeFoundationProvider } from "../provider.js";

test("declares the qcafe provider contract", () =>
  assert.equal(new QcafeFoundationProvider().manifest.id, "qcafe.foundation"));
