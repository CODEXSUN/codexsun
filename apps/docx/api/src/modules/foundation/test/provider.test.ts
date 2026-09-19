import test from "node:test";
import assert from "node:assert/strict";
import { DocxFoundationProvider } from "../provider.js";

test("declares the docx provider contract", () => assert.equal(new DocxFoundationProvider().manifest.id, "docx.foundation"));
