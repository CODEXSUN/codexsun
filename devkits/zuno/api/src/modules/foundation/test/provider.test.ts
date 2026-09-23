import test from "node:test";
import assert from "node:assert/strict";
import { ZunoFoundationProvider } from "../provider";

test("declares the zuno provider contract", () => assert.equal(new ZunoFoundationProvider().manifest.id, "zuno.foundation"));
