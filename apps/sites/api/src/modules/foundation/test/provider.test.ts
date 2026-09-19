import test from "node:test";
import assert from "node:assert/strict";
import { SitesFoundationProvider } from "../provider.js";

test("declares the sites provider contract", () => assert.equal(new SitesFoundationProvider().manifest.id, "sites.foundation"));
