import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  createEnquiryJobComment,
  listEnquiryJobComments,
  updateEnquiryJobComment
} from "./connection.job-comments.js";

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

const settings = {
  baseUrl: "https://frappe.example/",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};

test("Job Comments reads use the documented Frappe list API and enquiry link fields", async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/v2/method/frappe.client.get_list");
    assert.equal(init?.method, "POST");
    assert.equal(
      (init?.headers as Record<string, string> | undefined)?.Authorization,
      "token key:secret"
    );
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(body.doctype, "Job Comments");
    assert.deepEqual(body.filters, [
      ["job_type", "=", "Enquiry"],
      ["job_id", "in", ["Q930", "ENQ27"]]
    ]);
    assert.deepEqual(body.fields, ["*"]);
    return Response.json({ message: [{ name: "JOBCOM-1", job_type: "Enquiry", job_id: "Q930" }] });
  };

  const comments = await listEnquiryJobComments(settings, ["Q930", "ENQ27", "Q930"]);
  assert.equal(comments[0]?.name, "JOBCOM-1");
});

test("Job Comments writes use the document API and require explicit export permission", async () => {
  let writes = 0;
  globalThis.fetch = async (input, init) => {
    writes += 1;
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/v2/document/Job%20Comments");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      job_type: "Enquiry",
      job_id: "Q930",
      comment: "Follow up",
      mode: "Reply",
      parent_comment: "JOBCOM-1"
    });
    return Response.json({ data: { name: "JOBCOM-2" } });
  };
  await assert.rejects(
    createEnquiryJobComment(settings, {
      enquiryName: "Q930",
      comment: "Follow up",
      mode: "Reply",
      parentName: "JOBCOM-1"
    }),
    /Sending records to Frappe is disabled/
  );
  assert.equal(writes, 0);

  const created = await createEnquiryJobComment(
    settings,
    {
      enquiryName: "Q930",
      comment: "Follow up",
      mode: "Reply",
      parentName: "JOBCOM-1"
    },
    true
  );
  assert.equal(created.name, "JOBCOM-2");
  assert.equal(writes, 1);
});

test("Job Comments updates use the document API with explicit export permission", async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/v2/document/Job%20Comments/JOBCOM-1");
    assert.equal(init?.method, "PUT");
    assert.deepEqual(JSON.parse(String(init?.body)), { comment: "Updated note" });
    return Response.json({ data: { name: "JOBCOM-1" } });
  };
  const updated = await updateEnquiryJobComment(
    settings,
    "JOBCOM-1",
    { comment: "Updated note" },
    true
  );
  assert.equal(updated?.name, "JOBCOM-1");
});
