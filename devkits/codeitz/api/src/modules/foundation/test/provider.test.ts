import test from "node:test";
import assert from "node:assert/strict";
import { CodeitzFoundationProvider } from "../provider.js";

test("declares the codeitz provider contract", () => assert.equal(new CodeitzFoundationProvider().manifest.id, "codeitz.foundation"));
