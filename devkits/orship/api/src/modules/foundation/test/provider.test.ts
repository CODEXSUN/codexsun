import test from "node:test";
import assert from "node:assert/strict";
import { OrshipFoundationProvider } from "../provider";

test("declares the orship provider contract", () => assert.equal(new OrshipFoundationProvider().manifest.id, "orship.foundation"));
