import {
  createDesignSystemSelection,
  resolveDesignSystemBlockVariant,
  resolveDesignSystemComponentVariant,
  resolveDesignSystemPageVariant,
  resolveDesignSystemTemplateVariant,
} from "./selection";
import { designSystemManifest, getDesignSystemAsset } from "./agent-manifest";
import type { DesignSystemAssetKind, DesignSystemSelectionInput } from "./contracts";

const toolDefinitions = [
  {
    name: "ui.list_assets",
    description: "List package-owned UI assets that can be composed by an application.",
    inputSchema: { type: "object", properties: { kind: { type: "string" }, query: { type: "string" } } },
  },
  {
    name: "ui.get_asset",
    description: "Return the complete contract for one UI component, block, page, or template.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" }, kind: { type: "string" } } },
  },
  {
    name: "ui.resolve_variant",
    description: "Resolve and validate one asset variant before generating application code.",
    inputSchema: {
      type: "object",
      required: ["kind", "id"],
      properties: { kind: { type: "string" }, id: { type: "string" }, variantId: { type: "string" } },
    },
  },
  {
    name: "ui.validate_selection",
    description: "Validate package UI selections and reject unknown assets or variants.",
    inputSchema: {
      type: "object",
      properties: {
        blocks: { type: "object" },
        components: { type: "object" },
        pages: { type: "object" },
        templates: { type: "object" },
      },
    },
  },
];

export async function handleUiMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null;
  if (request.method === "notifications/initialized") return null;
  if (request.method === "initialize") {
    return result(id, {
      protocolVersion: "2025-03-26",
      serverInfo: { name: "codexsun-ui", version: "1.0.43" },
      capabilities: { tools: {}, resources: {} },
    });
  }
  if (request.method === "tools/list") return result(id, { tools: toolDefinitions });
  if (request.method === "resources/list") {
    return result(id, {
      resources: [{ uri: "ui://manifest", name: "CODEXSUN UI design-system manifest", mimeType: "application/json" }],
    });
  }
  if (request.method === "resources/read") {
    if (request.params?.uri === "ui://manifest") return result(id, resource("ui://manifest", designSystemManifest));
    return error(id, -32004, "Unknown UI resource.");
  }
  if (request.method !== "tools/call") return error(id, -32601, "Method not found.");

  try {
    return result(id, {
      content: [
        { type: "text", text: JSON.stringify(callTool(request.params?.name, request.params?.arguments ?? {})) },
      ],
    });
  } catch (cause) {
    return error(id, -32002, cause instanceof Error ? cause.message : "UI contract validation failed.");
  }
}

export async function startUiMcpServer() {
  process.stdin.setEncoding("utf8");
  let buffer = "";
  for await (const chunk of process.stdin) {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines.filter(Boolean)) {
      let response: JsonRpcResponse | null;
      try {
        response = await handleUiMcpRequest(JSON.parse(line) as JsonRpcRequest);
      } catch {
        response = error(null, -32700, "Invalid JSON.");
      }
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  }
}

type JsonRpcRequest = {
  id?: string | number | null;
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown>; uri?: string };
};
type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

function callTool(name: string | undefined, input: Record<string, unknown>) {
  if (name === "ui.list_assets") {
    const kind = typeof input.kind === "string" ? input.kind : undefined;
    const query = typeof input.query === "string" ? input.query.toLowerCase() : undefined;
    return designSystemManifest.filter(
      (asset) =>
        (!kind || asset.kind === kind) &&
        (!query || `${asset.id} ${asset.name} ${asset.description}`.toLowerCase().includes(query)),
    );
  }
  if (name === "ui.get_asset") {
    const kind = typeof input.kind === "string" ? (input.kind as DesignSystemAssetKind) : undefined;
    const asset = getDesignSystemAsset(String(input.id), kind);
    if (!asset) throw new Error(`Unknown UI asset: ${String(input.id)}`);
    return asset;
  }
  if (name === "ui.resolve_variant")
    return resolveVariant(
      String(input.kind),
      String(input.id),
      typeof input.variantId === "string" ? input.variantId : undefined,
    );
  if (name === "ui.validate_selection") return createDesignSystemSelection(input as DesignSystemSelectionInput);
  throw new Error(`Unknown UI tool: ${String(name)}`);
}

function resolveVariant(kind: string, id: string, variantId?: string) {
  if (kind === "component") return resolveDesignSystemComponentVariant(id, variantId);
  if (kind === "block") return resolveDesignSystemBlockVariant(id, variantId);
  if (kind === "page") return resolveDesignSystemPageVariant(id, variantId);
  if (kind === "template") return resolveDesignSystemTemplateVariant(id, variantId);
  throw new Error(`Unknown UI asset kind: ${kind}`);
}

function resource(uri: string, value: unknown) {
  return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(value) }] };
}

function result(id: string | number | null, value: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result: value };
}

function error(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

if (process.argv[1]?.endsWith("mcp-server.ts")) void startUiMcpServer();
