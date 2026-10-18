import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { Kysely } from "kysely";
import type { EnquiryInput, EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "../connection/index.js";
import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const defaults = {
  baseUrl: "https://frappe.example.com/",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};

function database(
  link?: {
    enquiryId: number;
    syncedAt: string;
    updatedAt: string;
    source: string;
    contactId: number | null;
    assignedUserId: number | null;
    listInId: number | null;
  },
  lookups: string[] = [],
  existing?: {
    id: number;
    source: string;
    updatedAt: string;
    contactId: number | null;
    assignedUserId: number | null;
    listInId: number | null;
  }
) {
  let saved = false;
  const query = (table: string) => {
    const builder = {
      selectAll: () => builder,
      select: () => builder,
      where: (...args: unknown[]) => {
        if (
          (table === "crm_enquiry_statuses" || table === "crm_enquiry_priorities") &&
          args[0] === "name"
        )
          lookups.push(String(args[2]));
        return builder;
      },
      innerJoin: () => builder,
      execute: async () => [],
      executeTakeFirst: async () => {
        if (table === "frappe_connection_settings") return null;
        if (table === "frappe_enquiry_sync as sync") return link ?? null;
        if (table === "crm_enquiries") return existing ?? null;
        if (table === "crm_enquiry_statuses") return { id: 2, code: "new" };
        if (table === "crm_enquiry_priorities") return { id: 3 };
        return null;
      }
    };
    return builder;
  };
  const insert = {
    values: () => insert,
    onDuplicateKeyUpdate: () => insert,
    execute: async () => {
      saved = true;
    }
  };
  return {
    value: {
      selectFrom: query,
      insertInto: () => insert
    } as unknown as Kysely<FrappeDatabase>,
    wasSaved: () => saved
  };
}

test("previews remote enquiries and their local link", async () => {
  const scope = database();
  globalThis.fetch = async (input) =>
    String(input).includes("get_count")
      ? Response.json({ message: 1 })
      : Response.json({ data: [{ name: "ENQ27", title: "Machine issue", date: "2026-10-06" }] });
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => {
        throw new Error("Unexpected create");
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  assert.deepEqual(await service.preview(1), {
    hasMore: false,
    page: 1,
    pageSize: 50,
    total: 1,
    items: [
      {
        name: "ENQ27",
        title: "Machine issue",
        mobile: null,
        date: "2026-10-06",
        status: null,
        priority: null,
        modifiedAt: null,
        localEnquiryId: null
      }
    ]
  });
});

test("previews a page beyond the former 1,000 enquiry limit", async () => {
  const scope = database();
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("get_count")) return Response.json({ message: 1001 });
    assert.equal(url.searchParams.get("limit_start"), "1000");
    assert.equal(url.searchParams.get("limit_page_length"), "100");
    assert.equal(url.searchParams.get("order_by"), "creation asc");
    return new Response(JSON.stringify({ data: [{ name: "ENQ1001" }] }), { status: 200 });
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => {
        throw new Error("Unexpected create");
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  const result = await service.preview(11, 100);
  assert.equal(result.items[0]?.name, "ENQ1001");
  assert.equal(result.hasMore, false);
  assert.equal(result.total, 1001);
  assert.equal(result.pageSize, 100);
});

test("imports unlinked enquiries across multiple remote batches", async () => {
  const scope = database();
  const names = Array.from({ length: 51 }, (_, index) => `ENQ${index + 1}`);
  const created: string[] = [];
  const reports: number[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/Enquiry")) {
      const start = Number(url.searchParams.get("limit_start"));
      assert.equal(url.searchParams.get("order_by"), "creation asc");
      return new Response(
        JSON.stringify({ data: names.slice(start, start + 50).map((name) => ({ name })) }),
        { status: 200 }
      );
    }
    const name = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    return new Response(
      JSON.stringify({
        data: {
          name,
          creation: "2026-10-06 10:00:00.000000",
          modified: "2026-10-07 11:30:00.000000",
          owner: "agent@example.com",
          mobile: "9994885548",
          date: "2026-10-06",
          status: "New",
          priority: "Normal"
        }
      }),
      { status: 200 }
    );
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async (input) => {
        created.push(input.sourceReference ?? "");
        return { id: created.length } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  const result = await service.importUnlinked(async (progress) => {
    reports.push(progress.scanned);
  });
  assert.equal(result.created, 51);
  assert.equal(result.failed, 0);
  assert.deepEqual(reports, [50, 51]);
  assert.deepEqual(created, names);
});

test("queued import stops when the Frappe connection has changed", async () => {
  const scope = database();
  globalThis.fetch = async () => {
    throw new Error("Unexpected Frappe request");
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => {
        throw new Error("Unexpected create");
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  await assert.rejects(
    () => service.importUnlinked(async () => {}, "https://old.example.com/"),
    /connection changed/i
  );
});

test("pull creates a local enquiry and records the remote identity", async () => {
  const scope = database();
  const created: EnquiryInput[] = [];
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          name: "ENQ27",
          creation: "2026-10-06 10:00:00.000000",
          modified: "2026-10-07 11:30:00.000000",
          owner: "agent@example.com",
          title: "Machine issue",
          enquiry_details: "Machine stopped",
          mobile: "9994885548",
          user_employee: "HR-EMP-00011",
          assigned_to_employee: "HR-EMP-00011",
          group: "Office",
          date: "2026-10-06",
          status: "New",
          priority: "Normal"
        }
      }),
      { status: 200 }
    );
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createImportedEnquiry: async (input, source) => {
        created.push(input);
        assert.deepEqual(source, {
          enquiryNo: 27,
          createdAt: "2026-10-06T10:00:00.000Z",
          updatedAt: "2026-10-07T11:30:00.000Z",
          createdBy: "agent@example.com"
        });
        return { id: 42 } as EnquiryRecord;
      },
      createEnquiry: async () => {
        throw new Error("Unexpected legacy create");
      },
      localActorForFrappeUser: async () => null,
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async (employeeCode) => {
        assert.equal(employeeCode, "HR-EMP-00011");
        return 7;
      },
      listInForName: async (name) => {
        assert.equal(name, "Office");
        return 9;
      }
    },
    defaults,
    "secret"
  );
  assert.deepEqual(await service.pull("ENQ27"), {
    remoteName: "ENQ27",
    enquiryId: 42,
    status: "created"
  });
  assert.equal(created[0]?.source, "frappe");
  assert.equal(created[0]?.sourceReference, "ENQ27");
  assert.equal(created[0]?.statusId, 2);
  assert.equal(created[0]?.assignedUserId, 7);
  assert.equal(created[0]?.listInId, 9);
  assert.equal(scope.wasSaved(), true);
});

test("pull repairs an imported enquiry missing its Frappe link and resumes comments", async () => {
  const scope = database(undefined, [], {
    id: 42,
    source: "frappe",
    updatedAt: "2026-10-07 11:30:00",
    contactId: 12,
    assignedUserId: 7,
    listInId: 9
  });
  let updated = false;
  const importedComments: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/Comment"))
      return Response.json({
        data: [
          {
            name: "COMM-1",
            content: "Followed up",
            owner: "agent@example.com",
            creation: "2026-10-07 12:30:00",
            comment_type: "Comment"
          }
        ]
      });
    return Response.json({
      data: {
        name: "ENQ27",
        creation: "2026-10-06 10:00:00",
        modified: "2026-10-07 11:30:00",
        owner: "agent@example.com",
        title: "Machine issue",
        mobile: "9994885548",
        date: "2026-10-06",
        status: "New",
        priority: "Normal"
      }
    });
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => {
        throw new Error("Unexpected create");
      },
      updateImportedEnquiry: async (id, input, source) => {
        assert.equal(id, 42);
        assert.equal(input.sourceReference, "ENQ27");
        assert.equal(source.createdAt, "2026-10-06T10:00:00.000Z");
        updated = true;
        return { id } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected legacy update");
      },
      importComment: async (_id, comment) => {
        importedComments.push(comment.id);
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );

  assert.deepEqual(await service.pull("ENQ27"), {
    remoteName: "ENQ27",
    enquiryId: 42,
    status: "updated"
  });
  assert.equal(updated, true);
  assert.deepEqual(importedComments, ["COMM-1"]);
  assert.equal(scope.wasSaved(), true);
});

test("pull translates Frappe status, priority, and Indian mobile formatting", async () => {
  const lookups: string[] = [];
  const scope = database(undefined, lookups);
  const created: EnquiryInput[] = [];
  globalThis.fetch = async () =>
    Response.json({
      data: {
        name: "ENQ28",
        creation: "2026-10-06 10:00:00.000000",
        modified: "2026-10-07 11:30:00.000000",
        title: "Service enquiry",
        mobile: "+91 99948 85548",
        date: "2026-10-06",
        status: "Pending",
        priority: "Medium"
      }
    });
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async (input) => {
        created.push(input);
        return { id: 43 } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  await service.pull("ENQ28");
  assert.equal(created[0]?.capturedPhone, "9994885548");
  assert.deepEqual(lookups, ["Open", "Normal"]);
});

test("pull imports Frappe comments with mapped author and source timestamp", async () => {
  const scope = database();
  const imported: Array<{
    enquiryId: number;
    comment: { id: string; content: string; author: string; createdAt: string };
  }> = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/Customer/C123"))
      return Response.json({ data: { customer_name: "Example Customer" } });
    if (url.pathname.endsWith("/Comment"))
      return Response.json({
        data: [
          {
            name: "COMM-1",
            content: "Followed up",
            owner: "agent@example.com",
            creation: "2026-10-07 12:30:00",
            comment_type: "Comment"
          }
        ]
      });
    return Response.json({
      data: {
        name: "ENQ29",
        creation: "2026-10-06 10:00:00",
        modified: "2026-10-07 11:30:00",
        owner: "agent@example.com",
        customer: "C123",
        mobile: "9994885548",
        date: "2026-10-06"
      }
    });
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => ({ id: 42 }) as EnquiryRecord,
      createImportedEnquiry: async (_input, source) => {
        assert.equal(source.externalCustomer?.code, "C123");
        assert.equal(source.externalCustomer?.name, "Example Customer");
        assert.equal(source.externalCustomer?.mobile, "9994885548");
        return { id: 42 } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      localActorForFrappeUser: async () => "local-agent@example.com",
      importComment: async (enquiryId, comment) => {
        imported.push({ enquiryId, comment });
      },
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  await service.pull("ENQ29");
  assert.deepEqual(imported, [
    {
      enquiryId: 42,
      comment: {
        id: "COMM-1",
        content: "Followed up",
        author: "local-agent@example.com",
        createdAt: "2026-10-07T12:30:00.000Z"
      }
    }
  ]);
});

test("pull rejects a linked enquiry with newer local edits", async () => {
  const scope = database({
    enquiryId: 42,
    syncedAt: "2026-10-06 10:00:00",
    updatedAt: "2026-10-06 11:00:00",
    source: "frappe",
    contactId: null,
    assignedUserId: null,
    listInId: null
  });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { name: "ENQ27" } }), { status: 200 });
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => {
        throw new Error("Unexpected create");
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );
  await assert.rejects(() => service.pull("ENQ27"), /local enquiry changed/i);
  assert.equal(scope.wasSaved(), false);
});
