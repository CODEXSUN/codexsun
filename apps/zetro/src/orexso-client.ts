/**
 * Orexso API Client
 *
 * Provides TypeScript bindings for the Orexso local AI model server.
 * Base URL: http://localhost:6005 (configurable)
 *
 * Supports:
 * - Basic chat requests
 * - Streaming chat with Server-Sent Events
 * - Structured agent task API
 * - Task interruption and rollback
 * - File read/write operations
 * - Memory indexing
 * - MCP integration
 */

export interface OrexsoConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

type RequestHeaders = Record<string, string>;

export interface ChatRequest {
  message: string;
  session_id?: string;
  use_model?: boolean;
  history?: Array<{ role: string; content: string }>;
}

export interface ChatActivity {
  tool: string;
  status: string;
  detail: string;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  activities: ChatActivity[];
  generated_by: string;
  rollback_actions: RollbackAction[];
}

export interface RollbackAction {
  task_id?: string;
  snapshot_id?: string;
  git_stash_ref?: string;
  path?: string;
}

export interface StreamEvent {
  type: "status" | "metadata" | "chunk" | "done" | "error";
  data: unknown;
}

export interface StreamMetadata {
  task_id: string;
  discovered_files: string[];
  tool_calls: unknown[];
  generated_by: string;
  rollback_actions: RollbackAction[];
}

export interface StreamDone {
  task_id: string;
  reply: string;
  activities: ChatActivity[];
  generated_by: string;
  status: string;
  rollback_actions: RollbackAction[];
}

export interface AgentTaskRequest {
  instruction: string;
  mode: "chat" | "explain" | "fix" | "edit";
  active_file?: string;
  selection?: string;
  project_id?: string;
  session_id?: string;
  use_model?: boolean;
  apply_changes?: boolean;
  verify_command?: string | null;
  max_files?: number;
}

export interface PlanStep {
  id?: string;
  description: string;
}

export interface Plan {
  summary: string;
  assumptions: string[];
  steps: PlanStep[];
  generated_by: string;
}

export interface AgentTaskResponse {
  task_id: string;
  summary: string;
  discovered_files: string[];
  plan: Plan;
  tool_calls: unknown[];
  verification: unknown[];
  assistant_message: string;
  generated_by: string;
  rollback_actions: RollbackAction[];
}

export interface HealthStatus {
  status: string;
  app: string;
  environment: string;
  chat_model: string;
  warmup_ready: boolean;
  warmup_status: string;
  warmup_detail: string;
  ide_mode: string;
  qdrant_url: string;
  ollama_url: string;
  auth_required: boolean;
}

export interface AuthStatus {
  enabled: boolean;
  authenticated: boolean;
  header_name: string;
  notes: string[];
}

export interface InterruptResponse {
  task_id: string;
  cancelled: boolean;
  status: string;
  notes: string[];
}

export interface RollbackResponse {
  restored: boolean;
  path?: string;
  snapshot_id?: string;
  git_stash_ref?: string | null;
  notes: string[];
}

export interface FileReadResponse {
  path: string;
  content: string;
  language?: string;
}

export interface FileWriteRequest {
  path: string;
  content: string;
  create_directories?: boolean;
}

export interface FileWriteResponse {
  path: string;
  written: boolean;
  snapshot_id?: string;
  notes: string[];
}

export interface MemoryIndexRequest {
  project_id?: string;
  include_glob?: string | null;
  limit_files?: number;
}

export interface MemoryIndexResponse {
  indexed_count: number;
  skipped_count: number;
  notes: string[];
}

/**
 * OrexsoClient provides a TypeScript API for communicating with Orexso.
 */
export class OrexsoClient {
  private config: Required<OrexsoConfig>;

  constructor(config: OrexsoConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "http://localhost:6005",
      apiKey: config.apiKey || "",
      timeout: config.timeout || 120000,
      headers: config.headers || {},
    };
  }

  private getHeaders(overrides: Record<string, string> = {}): RequestHeaders {
    const headers: RequestHeaders = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...overrides,
    };

    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    return headers;
  }

  private async fetchJson<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const fetchOptions: RequestInit = {
      ...options,
      headers: this.getHeaders(
        (options.headers as Record<string, string>) || {}
      ),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Orexso ${response.status}: ${errorText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check authentication status
   */
  async getAuthStatus(): Promise<AuthStatus> {
    return this.fetchJson<AuthStatus>("/api/v1/auth/status");
  }

  /**
   * Check Orexso health and readiness
   */
  async getHealth(): Promise<HealthStatus> {
    return this.fetchJson<HealthStatus>("/health");
  }

  /**
   * Send a chat message and get a complete response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.fetchJson<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Stream a chat response as Server-Sent Events
   * Yields events as they arrive from the server
   */
  async *stream(
    request: ChatRequest
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const url = `${this.config.baseUrl}/api/v1/chat/stream`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          const eventLine = lines
            .find((l) => l.startsWith("event:"))
            ?.slice(6)
            .trim();
          const dataLine = lines
            .find((l) => l.startsWith("data:"))
            ?.slice(5)
            .trim();

          if (!eventLine || !dataLine) continue;

          try {
            const data = JSON.parse(dataLine);
            yield {
              type: eventLine as StreamEvent["type"],
              data,
            } as StreamEvent;
          } catch (error) {
            // Skip malformed JSON
            console.error("Failed to parse stream event data:", error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Execute a structured agent task with discover-plan-execute-verify loop
   */
  async executeTask(request: AgentTaskRequest): Promise<AgentTaskResponse> {
    return this.fetchJson<AgentTaskResponse>("/api/v1/agent/task", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Interrupt a running task by task_id
   */
  async interruptTask(taskId: string): Promise<InterruptResponse> {
    return this.fetchJson<InterruptResponse>(
      `/api/v1/agent/tasks/${taskId}/interrupt`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * Rollback changes from a task
   */
  async rollback(options: {
    taskId?: string;
    sessionId?: string;
    snapshotId?: string;
    gitStashRef?: string;
    path?: string;
  }): Promise<RollbackResponse> {
    return this.fetchJson<RollbackResponse>("/api/v1/agent/rollback", {
      method: "POST",
      body: JSON.stringify({
        task_id: options.taskId,
        session_id: options.sessionId,
        snapshot_id: options.snapshotId,
        git_stash_ref: options.gitStashRef,
        path: options.path,
      }),
    });
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<FileReadResponse> {
    return this.fetchJson<FileReadResponse>(
      `/api/v1/agent/files?path=${encodeURIComponent(path)}`
    );
  }

  /**
   * Write a file
   */
  async writeFile(request: FileWriteRequest): Promise<FileWriteResponse> {
    return this.fetchJson<FileWriteResponse>("/api/v1/agent/files", {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * Index files for memory/vector search
   */
  async indexMemory(request: MemoryIndexRequest): Promise<MemoryIndexResponse> {
    return this.fetchJson<MemoryIndexResponse>("/api/v1/agent/memory/index", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get MCP metadata
   */
  async getMcpMetadata(): Promise<unknown> {
    return this.fetchJson("/mcp");
  }

  /**
   * Call MCP method via JSON-RPC
   */
  async callMcpMethod(
    method: string,
    params: unknown = {}
  ): Promise<unknown> {
    return this.fetchJson("/mcp", {
      method: "POST",
      headers: {
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });
  }
}

/**
 * Create a default Orexso client with local defaults
 */
export function createOrexsoClient(
  config: OrexsoConfig = {}
): OrexsoClient {
  return new OrexsoClient({
    baseUrl:
      config.baseUrl || process.env.OREXSO_API_URL || "http://localhost:6005",
    apiKey: config.apiKey || process.env.OREXSO_API_KEY || "",
    timeout: config.timeout || 120000,
    ...config,
  });
}
