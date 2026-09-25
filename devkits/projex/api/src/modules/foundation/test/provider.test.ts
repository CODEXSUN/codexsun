import test from "node:test";
import assert from "node:assert/strict";
import { ProjexFoundationProvider } from "../provider.js";

test("declares the projex provider contract", () => assert.equal(new ProjexFoundationProvider().manifest.id, "projex.foundation"));
