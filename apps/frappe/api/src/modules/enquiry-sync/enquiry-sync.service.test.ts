import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { Kysely } from "kysely";
import type { EnquiryInput, EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "../connection/index.js";
import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";
import { enquiryCommentRemoteName } from "./enquiry-sync.comment-identity.js";

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
  },
  outboundComments: Array<{ idempotency_key: string; remote_name: string | null }> = [],
  unsentUpsert = false
) {
  let saved = false;
  let insertingTable = "";
  const query = (table: string) => {
    const builder = {
      selectAll: () => builder,
      set: () => builder,
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
      execute: async () => (table === "crm_enquiry_sync_events" ? outboundComments : []),
      executeTakeFirst: async () => {
        if (table === "frappe_connection_settings") return null;
        if (table === "frappe_enquiry_sync as sync") return link ?? null;
        if (table === "crm_enquiries") return existing ?? null;
        if (table === "crm_enquiry_sync_events") return unsentUpsert ? { id: 99 } : null;
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
      if (insertingTable === "frappe_enquiry_sync") saved = true;
    }
  };
  return {
    value: {
      selectFrom: query,
      updateTable: query,
      insertInto: (table: string) => {
        insertingTable = table;
        return insert;
      }
    } as unknown as Kysely<FrappeDatabase>,
    wasSaved: () => saved
  };
}

test("previews remote enquiries and their local link", async () => {
  const scope = database();
  globalThis.fetch = async (input) =>
    String(input).includes("get_count")
      ? Response.json({ message: 1 })
      : Response.json({
          data: [
            {
              name: "ENQ27",
              title: '<div class="ql-editor read-mode"><p>Machine issue</p></div>',
              date: "2026-10-06"
            }
          ]
        });
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

test("bulk import reconciles source values over newer local timestamps", async () => {
  const scope = database({
    enquiryId: 42,
    syncedAt: "2026-10-18 10:00:00",
    updatedAt: "2026-10-18 17:05:00",
    source: "frappe",
    contactId: null,
    assignedUserId: null,
    listInId: null
  });
  const updated: Array<{ createdAt: string; updatedAt: string; createdBy: string }> = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/Enquiry")) return Response.json({ data: [{ name: "ENQ27" }] });
    if (url.pathname.endsWith("/get_count")) return Response.json({ message: 1 });
    return Response.json({
      data: {
        name: "ENQ27",
        creation: "2026-10-06 10:00:00",
        modified: "2026-10-18 17:05:00",
        owner: "agent@example.com",
        title: "Machine issue",
        enquiry_details: "Machine stopped",
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
      updateEnquiry: async () => {
        throw new Error("Unexpected local update");
      },
      updateImportedEnquiry: async (_id, _input, source) => {
        updated.push(source);
        return { id: 42 } as EnquiryRecord;
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );

  const result = await service.importUnlinked(async () => {});

  assert.equal(result.scanned, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.skipped, 1);
  assert.equal(updated[0]?.updatedAt, "2026-10-18T11:35:00.000Z");
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
          title: '<div class="ql-editor read-mode"><p>Machine&nbsp;issue</p></div>',
          enquiry_details: '<p>Machine stopped</p><img src="/files/evidence.png">',
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
          createdAt: "2026-10-06T04:30:00.000Z",
          updatedAt: "2026-10-07T06:00:00.000Z",
          createdBy: "mapped-employee@example.com"
        });
        return { id: 42 } as EnquiryRecord;
      },
      createEnquiry: async () => {
        throw new Error("Unexpected legacy create");
      },
      localActorForFrappeUser: async () => "mapped-owner@example.com",
      localActorForEmployee: async (employeeCode) => {
        assert.equal(employeeCode, "HR-EMP-00011");
        return "mapped-employee@example.com";
      },
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
  assert.equal(created[0]?.title, "Machine issue");
  assert.equal(created[0]?.description, '<p>Machine stopped</p><img src="/files/evidence.png">');
  assert.equal(created[0]?.statusId, 2);
  assert.equal(created[0]?.assignedUserId, 7);
  assert.equal(created[0]?.listInId, 9);
  assert.equal(scope.wasSaved(), true);
});

test("pull accepts Q930 and keeps the remote document name as its link identity", async () => {
  const scope = database();
  let created: EnquiryInput | undefined;
  globalThis.fetch = async () =>
    Response.json({
      data: {
        name: "Q930",
        creation: "2026-10-06 10:00:00",
        modified: "2026-10-07 11:30:00",
        title: "Current-format enquiry",
        mobile: "9994885548",
        date: "2026-10-06",
        status: "New",
        priority: "Normal"
      }
    });
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createImportedEnquiry: async (input, source) => {
        created = input;
        assert.equal(source.enquiryNo, 930);
        return { id: 930 } as EnquiryRecord;
      },
      createEnquiry: async () => {
        throw new Error("Unexpected legacy create");
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

  assert.deepEqual(await service.pull("Q930"), {
    remoteName: "Q930",
    enquiryId: 930,
    status: "created"
  });
  assert.equal(created?.sourceReference, "Q930");
  assert.equal(created?.title, "Current-format enquiry");
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
    if (url.pathname === "/api/v2/method/frappe.client.get_list")
      return Response.json({ message: [] });
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
        assigned_to_employee: null,
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
        assert.equal(input.assignedUserId, null);
        assert.equal(source.createdAt, "2026-10-06T04:30:00.000Z");
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

test("bidirectional imports update linked CRM enquiries but block unsent local edits", async () => {
  globalThis.fetch = async () =>
    Response.json({
      data: {
        name: "Q930",
        creation: "2026-10-06 10:00:00",
        modified: "2026-10-07 11:30:00",
        title: "Remote edit",
        mobile: "9994885548",
        date: "2026-10-06",
        status: "New",
        priority: "Normal"
      }
    });
  for (const unsent of [false, true]) {
    const scope = database(
      {
        enquiryId: 42,
        syncedAt: "2026-10-07 10:00:00",
        updatedAt: "2026-10-06 11:00:00",
        source: "manual",
        contactId: null,
        assignedUserId: null,
        listInId: null
      },
      [],
      undefined,
      [],
      unsent
    );
    let updates = 0;
    const service = new FrappeEnquirySyncService(
      {
        database: scope.value,
        createEnquiry: async () => {
          throw new Error("Unexpected create");
        },
        updateEnquiry: async (id, input) => {
          updates++;
          assert.equal(id, 42);
          assert.equal(input.title, "Remote edit");
          return { id } as EnquiryRecord;
        },
        localUserForEmployee: async () => null,
        listInForName: async () => null
      },
      defaults,
      "secret",
      true
    );
    if (unsent) await assert.rejects(service.pull("Q930"), /unsent CRM changes/);
    else assert.equal((await service.pull("Q930")).status, "updated");
    assert.equal(updates, unsent ? 0 : 1);
  }
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
  const outboundKey = "comment-add:42:9:stable-retry-key";
  const echoName = enquiryCommentRemoteName(defaults.baseUrl, outboundKey);
  const scope = database(undefined, [], undefined, [
    { idempotency_key: outboundKey, remote_name: null }
  ]);
  const imported: Array<{
    enquiryId: number;
    comment: { id: string; content: string; author: string; createdAt: string };
  }> = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/Customer/C123"))
      return Response.json({ data: { customer_name: "Example Customer" } });
    if (url.pathname === "/api/v2/method/frappe.client.get_list")
      return Response.json({
        message: [
          {
            name: echoName,
            job_type: "Enquiry",
            job_id: "ENQ29",
            comment: "Already stored locally",
            creation: "2026-10-06 10:30:00"
          },
          {
            name: "JOBCOM-1",
            job_type: "Enquiry",
            job_id: "ENQ29",
            comment: "Source enquiry message",
            owner: "agent@example.com",
            creation: "2026-10-06 10:30:00",
            mode: "Comment"
          }
        ]
      });
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
        id: "JOBCOM-1",
        content: "Source enquiry message",
        parentSourceId: null,
        author: "local-agent@example.com",
        createdAt: "2026-10-06T05:00:00.000Z"
      }
    },
    {
      enquiryId: 42,
      comment: {
        id: "COMM-1",
        content: "Followed up",
        author: "local-agent@example.com",
        createdAt: "2026-10-07T07:00:00.000Z"
      }
    }
  ]);
});

test("live import filters by the Frappe-local modified time and preserves source dates", async () => {
  const scope = database();
  let listFilters: unknown;
  let importedAt = "";
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/v2/method/frappe.client.get_list")
      return Response.json({ message: [] });
    if (url.pathname.endsWith("/Comment")) return Response.json({ data: [] });
    if (url.pathname.endsWith("/Enquiry") && !url.pathname.endsWith("/ENQ27")) {
      listFilters = JSON.parse(url.searchParams.get("filters") ?? "null");
      return Response.json({
        data:
          url.searchParams.get("limit_start") === "0"
            ? [{ name: "ENQ27", modified: "2026-10-18 19:00:00" }]
            : []
      });
    }
    return Response.json({
      data: {
        name: "ENQ27",
        creation: "2026-05-28 18:53:48",
        modified: "2026-10-18 19:00:00",
        owner: "agent@example.com",
        title: "Machine issue",
        mobile: "9994885548",
        date: "2026-05-28",
        status: "New",
        priority: "Normal"
      }
    });
  };
  const service = new FrappeEnquirySyncService(
    {
      database: scope.value,
      createEnquiry: async () => ({ id: 42 }) as EnquiryRecord,
      createImportedEnquiry: async (_input, source) => {
        importedAt = source.createdAt;
        return { id: 42 } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected local update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    },
    defaults,
    "secret"
  );

  const result = await service.importModifiedSince(
    "2026-10-18T13:25:00.000Z",
    async () => {},
    defaults.baseUrl
  );

  assert.deepEqual(listFilters, [["Enquiry", "modified", ">", "2026-10-18 18:55:00"]]);
  assert.equal(importedAt, "2026-05-28T13:23:48.000Z");
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
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
