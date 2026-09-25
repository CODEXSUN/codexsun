import test from "node:test";
import assert from "node:assert/strict";
import { AuditorFoundationProvider } from "../provider.js";

test("declares the auditor provider contract", () => assert.equal(new AuditorFoundationProvider().manifest.id, "auditor.foundation"));
