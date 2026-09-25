import test from "node:test";
import assert from "node:assert/strict";
import { EcommerceFoundationProvider } from "../provider.js";

test("declares the ecommerce provider contract", () => assert.equal(new EcommerceFoundationProvider().manifest.id, "ecommerce.foundation"));
