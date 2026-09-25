import test from "node:test";
import assert from "node:assert/strict";
import { AccountsFoundationProvider } from "../provider.js";

test("declares the accounts provider contract", () => assert.equal(new AccountsFoundationProvider().manifest.id, "accounts.foundation"));
