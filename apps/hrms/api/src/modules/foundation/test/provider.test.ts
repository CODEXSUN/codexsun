import test from "node:test";
import assert from "node:assert/strict";
import { HrmsFoundationProvider } from "../provider.js";

test("declares the hrms provider contract", () => assert.equal(new HrmsFoundationProvider().manifest.id, "hrms.foundation"));
