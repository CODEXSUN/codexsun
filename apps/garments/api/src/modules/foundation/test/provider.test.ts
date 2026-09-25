import test from "node:test";
import assert from "node:assert/strict";
import { GarmentsFoundationProvider } from "../provider.js";

test("declares the garments provider contract", () => assert.equal(new GarmentsFoundationProvider().manifest.id, "garments.foundation"));
