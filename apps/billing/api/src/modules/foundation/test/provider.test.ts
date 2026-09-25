import test from "node:test";
import assert from "node:assert/strict";
import { BillingFoundationProvider } from "../provider.js";

test("declares the billing provider contract", () => assert.equal(new BillingFoundationProvider().manifest.id, "billing.foundation"));
