import test from "node:test";
import assert from "node:assert/strict";
import { ZunoFoundationProvider } from "../provider.js";

test("declares the zuno provider contract", () => assert.equal(new ZunoFoundationProvider().manifest.id, "zuno.foundation"));
