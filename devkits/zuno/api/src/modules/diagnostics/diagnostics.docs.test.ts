import assert from "node:assert/strict";
import test from "node:test";
import { DiagnosticsService } from "./diagnostics.service.js";
import { DiagnosticsRepository } from "./diagnostics.repository.js";
test("Zuno advertises and calls the injected developer reference tool", async () => {
  const config = {
    sourceRoot: "",
    platformLogPath: "",
    providerBaseUrl: "https://provider.example.test/v1",
    providerModel: "model",
    providerApiKey: "test"
  };
  let calls = 0;
  let lookup = "";
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      assert.ok(
        request.tools.some(
          (t: { function: { name: string } }) => t.function.name === "search_developer_docs"
        )
      );
      calls++;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message:
                calls === 1
                  ? {
                      content: null,
                      tool_calls: [
                        {
                          id: "doc",
                          type: "function",
                          function: {
                            name: "search_developer_docs",
                            arguments: JSON.stringify({ query: "crm" })
                          }
                        }
                      ]
                    }
                  : {
                      content: "CRM uses the selected provider. Source: crm/workflow.md",
                      tool_calls: []
                    }
            }
          ]
        }),
        { status: 200 }
      );
    };
    const service = new DiagnosticsService(
      new DiagnosticsRepository(config),
      config,
      undefined,
      async (query) => {
        lookup = query;
        return [
          { source: "applications/crm/workflow.md", content: "Local/Frappe enquiry workflow" }
        ];
      }
    );
    const answer = await service.diagnose("Explain the CRM developer workflow");
    assert.equal(lookup, "crm");
    assert.equal(answer.evidence[0]?.source, "applications/crm/workflow.md");
    assert.match(answer.answer, /CRM/);
  } finally {
    globalThis.fetch = original;
  }
});
