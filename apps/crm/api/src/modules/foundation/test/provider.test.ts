import test from "node:test";
import assert from "node:assert/strict";
import { CrmFoundationProvider } from "../provider.js";

test("declares the crm provider contract", () => assert.equal(new CrmFoundationProvider().manifest.id, "crm.foundation"));
