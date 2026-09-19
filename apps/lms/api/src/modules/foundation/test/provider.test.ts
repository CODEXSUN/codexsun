import test from "node:test";
import assert from "node:assert/strict";
import { LmsFoundationProvider } from "../provider.js";

test("declares the lms provider contract", () => assert.equal(new LmsFoundationProvider().manifest.id, "lms.foundation"));
