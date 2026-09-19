import test from "node:test";
import assert from "node:assert/strict";
import { HimsxFoundationProvider } from "../provider.js";

test("declares the himsx provider contract", () => assert.equal(new HimsxFoundationProvider().manifest.id, "himsx.foundation"));
