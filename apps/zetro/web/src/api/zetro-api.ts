import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage";
import type {
  ZetroGuardrailTemplate,
  ZetroOutputMode,
  ZetroOutputModeId,
  ZetroPlaybook,
  ZetroPlaybookPhase,
  ZetroSampleFinding,
  ZetroSampleRun,
} from "../../../shared/index";

export type ZetroDashboardSummary = {
  playbooks: number;
  activePlaybooks: number;
  approvalRequiredPlaybooks: number;
  highestPlaybookRisk: string | null;
  runs: number;
  activeRuns: number;
  findings: number;
  openFindings: number;
  guardrails: number;
  outputModes: number;
  defaultOutputMode: string;
  runnerMode: string;
  commandExecution: string;
};

export type ZetroPersistedPlaybookPhase = ZetroPlaybookPhase & {
  playbookId: string;
  sequence: number;
};

export type ZetroPersistedPlaybook = Omit<ZetroPlaybook, "phases"> & {
  phases: ZetroPersistedPlaybookPhase[];
};

export type ZetroRunEvent = {
  id: string;
  runId: string;
  sequence: number;
  kind:
    | "note"
    | "status"
    | "approval"
    | "finding"
    | "command-proposal"
    | "output";
  summary: string;
  detail?: string;
  createdAt: string;
};

export type ZetroRunOutputSection = {
  id: string;
  runId: string;
  sequence: number;
  section: string;
  content: string;
  createdAt: string;
};

export type ZetroCommandProposalStatus = "pending" | "approved" | "rejected";

export type ZetroCommandProposal = {
  id: string;
  runId: string;
  command: string;
  args: string[];
  summary: string;
  rationale: string;
  status: ZetroCommandProposalStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

export type ZetroFinding = ZetroSampleFinding;

export type ZetroRunWithDetails = ZetroSampleRun & {
  events: ZetroRunEvent[];
  findings: ZetroFinding[];
  outputSections: ZetroRunOutputSection[];
  commandProposals: ZetroCommandProposal[];
};

export type ZetroCreateRunPayload = {
  title: string;
  playbookId: string;
  status?: ZetroSampleRun["status"];
  outputMode?: ZetroOutputModeId;
  summary: string;
};

export type ZetroCreateRunEventPayload = {
  kind?: ZetroRunEvent["kind"];
  summary: string;
  detail?: string;
};

export type ZetroCreateFindingPayload = {
  runId?: string;
  title: string;
  category: ZetroFinding["category"];
  severity: ZetroFinding["severity"];
  confidence: number;
  status?: ZetroFinding["status"];
  summary: string;
};

export type ZetroSettingsSnapshot = {
  runtimeLock: {
    runnerMode: "manual";
    commandExecution: "disabled";
    llmCalls: "disabled";
    networkCalls: "disabled";
    autonomousLoop: "disabled";
  };
  outputModes: {
    defaultOutputMode: ZetroOutputModeId;
    modes: ZetroOutputMode[];
  };
};

type ListResponse<T> = {
  items: T[];
};

const zetroQueryKeys = {
  summary: ["zetro", "summary"] as const,
  playbooks: ["zetro", "playbooks"] as const,
  runs: ["zetro", "runs"] as const,
  run: (runId: string | null) => ["zetro", "run", runId] as const,
  findings: ["zetro", "findings"] as const,
  guardrails: ["zetro", "guardrails"] as const,
  settings: ["zetro", "settings"] as const,
  loopState: (runId: string | null) =>
    ["zetro", "loop", "state", runId] as const,
  loopEvents: (runId: string | null) =>
    ["zetro", "loop", "events", runId] as const,
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken();
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ??
        payload?.message ??
        `Request failed with status ${response.status}.`,
    );
  }

  return payload as T;
}

export function getZetroSummary() {
  return requestJson<ZetroDashboardSummary>("/internal/v1/zetro/summary");
}

export function listZetroPlaybooks() {
  return requestJson<ListResponse<ZetroPersistedPlaybook>>(
    "/internal/v1/zetro/playbooks",
  );
}

export function listZetroRuns() {
  return requestJson<ListResponse<ZetroSampleRun>>("/internal/v1/zetro/runs");
}

export function getZetroRun(runId: string) {
  return requestJson<ZetroRunWithDetails>(
    `/internal/v1/zetro/run?id=${encodeURIComponent(runId)}`,
  );
}

export function createZetroRun(payload: ZetroCreateRunPayload) {
  return requestJson<ZetroSampleRun>("/internal/v1/zetro/runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function appendZetroRunEvent(
  runId: string,
  payload: ZetroCreateRunEventPayload,
) {
  return requestJson<ZetroRunEvent>(
    `/internal/v1/zetro/run/events?id=${encodeURIComponent(runId)}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function listZetroFindings() {
  return requestJson<ListResponse<ZetroFinding>>("/internal/v1/zetro/findings");
}

export function createZetroFinding(payload: ZetroCreateFindingPayload) {
  return requestJson<ZetroFinding>("/internal/v1/zetro/findings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateZetroFindingStatus(
  findingId: string,
  status: ZetroFinding["status"],
) {
  return requestJson<ZetroFinding>(
    `/internal/v1/zetro/finding?id=${encodeURIComponent(findingId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function listZetroGuardrails() {
  return requestJson<ListResponse<ZetroGuardrailTemplate>>(
    "/internal/v1/zetro/guardrails",
  );
}

export function getZetroSettings() {
  return requestJson<ZetroSettingsSnapshot>("/internal/v1/zetro/settings");
}

export type ZetroCreateOutputSectionPayload = {
  runId: string;
  section: string;
  content: string;
};

export type ZetroReplaceOutputSectionsPayload = {
  runId: string;
  sections: Array<{ section: string; content: string }>;
};

export function createZetroOutputSection(
  payload: ZetroCreateOutputSectionPayload,
) {
  return requestJson<ZetroRunOutputSection>(
    "/internal/v1/zetro/run/output-sections",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function replaceZetroRunOutputSections(
  payload: ZetroReplaceOutputSectionsPayload,
) {
  return requestJson<ZetroRunOutputSection[]>(
    "/internal/v1/zetro/run/output-sections",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function useZetroSummaryQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.summary,
    queryFn: getZetroSummary,
  });
}

export function useZetroPlaybooksQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.playbooks,
    queryFn: listZetroPlaybooks,
    select: (payload) => payload.items,
  });
}

export function useZetroRunsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.runs,
    queryFn: listZetroRuns,
    select: (payload) => payload.items,
  });
}

export function useZetroRunQuery(runId: string | null) {
  return useQuery({
    queryKey: zetroQueryKeys.run(runId),
    queryFn: () => getZetroRun(runId ?? ""),
    enabled: Boolean(runId),
  });
}

export function useCreateZetroRunMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createZetroRun,
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.summary });
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.runs });
      void queryClient.invalidateQueries({
        queryKey: zetroQueryKeys.run(run.id),
      });
    },
  });
}

export function useAppendZetroRunEventMutation(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ZetroCreateRunEventPayload) => {
      if (!runId) {
        throw new Error("Select a Zetro run before adding an event.");
      }

      return appendZetroRunEvent(runId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: zetroQueryKeys.run(runId),
      });
    },
  });
}

export function useZetroFindingsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.findings,
    queryFn: listZetroFindings,
    select: (payload) => payload.items,
  });
}

export function useCreateZetroFindingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createZetroFinding,
    onSuccess: (finding) => {
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.summary });
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.findings });

      if (finding.runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(finding.runId),
        });
      }
    },
  });
}

export function useUpdateZetroFindingStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      findingId,
      status,
    }: {
      findingId: string;
      status: ZetroFinding["status"];
    }) => updateZetroFindingStatus(findingId, status),
    onSuccess: (finding) => {
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.summary });
      void queryClient.invalidateQueries({ queryKey: zetroQueryKeys.findings });

      if (finding.runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(finding.runId),
        });
      }
    },
  });
}

export function useZetroGuardrailsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.guardrails,
    queryFn: listZetroGuardrails,
    select: (payload) => payload.items,
  });
}

export function useZetroSettingsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.settings,
    queryFn: getZetroSettings,
  });
}

export function useCreateZetroOutputSectionMutation(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<ZetroCreateOutputSectionPayload, "runId">) => {
      if (!runId) {
        throw new Error("Select a Zetro run before adding an output section.");
      }

      return createZetroOutputSection({ ...payload, runId });
    },
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(runId),
        });
      }
    },
  });
}

export function useReplaceZetroRunOutputSectionsMutation(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sections: Array<{ section: string; content: string }>) => {
      if (!runId) {
        throw new Error("Select a Zetro run before replacing output sections.");
      }

      return replaceZetroRunOutputSections({ runId, sections });
    },
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(runId),
        });
      }
    },
  });
}

export type ZetroCreateCommandProposalPayload = {
  runId: string;
  command: string;
  args?: string[];
  summary: string;
  rationale?: string;
};

export type ZetroUpdateCommandProposalStatusPayload = {
  status: ZetroCommandProposalStatus;
  reviewedBy?: string;
};

export function createZetroCommandProposal(
  payload: ZetroCreateCommandProposalPayload,
) {
  return requestJson<ZetroCommandProposal>(
    "/internal/v1/zetro/run/command-proposals",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateZetroCommandProposalStatus(
  proposalId: string,
  payload: ZetroUpdateCommandProposalStatusPayload,
) {
  return requestJson<ZetroCommandProposal>(
    `/internal/v1/zetro/command-proposal?id=${encodeURIComponent(proposalId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function useCreateZetroCommandProposalMutation(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<ZetroCreateCommandProposalPayload, "runId">) => {
      if (!runId) {
        throw new Error(
          "Select a Zetro run before creating a command proposal.",
        );
      }

      return createZetroCommandProposal({ ...payload, runId });
    },
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(runId),
        });
      }
    },
  });
}

export function useUpdateZetroCommandProposalStatusMutation(
  runId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalId,
      payload,
    }: {
      proposalId: string;
      payload: ZetroUpdateCommandProposalStatusPayload;
    }) => updateZetroCommandProposalStatus(proposalId, payload),
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.run(runId),
        });
      }
    },
  });
}

export type ZetroLoopState = {
  runId: string;
  status:
    | "idle"
    | "running"
    | "paused"
    | "completed"
    | "cancelled"
    | "failed"
    | "timed-out";
  currentIteration: number;
  startedAt: string | null;
  endedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  configuration: {
    maxIterations: number;
    timeoutMs: number;
    stopConditions: Array<{ type: string; threshold?: number }>;
    dryRun: boolean;
  };
};

export type ZetroIterationEvent = {
  id: string;
  runId: string;
  iteration: number;
  kind: string;
  summary: string;
  detail?: string;
  createdAt: string;
};

export type ZetroLoopStateResponse = {
  exists: boolean;
  state?: ZetroLoopState;
  defaultConfiguration: ZetroLoopState["configuration"];
};

export function getZetroLoopState(runId: string) {
  return requestJson<ZetroLoopStateResponse>(
    `/internal/v1/zetro/loop/state?id=${encodeURIComponent(runId)}`,
  );
}

export function createZetroLoopConfiguration(
  runId: string,
  payload: {
    maxIterations?: number;
    timeoutMs?: number;
    dryRun?: boolean;
  },
) {
  return requestJson<ZetroLoopState>(
    `/internal/v1/zetro/loop/configure?id=${encodeURIComponent(runId)}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function startZetroLoop(runId: string) {
  return requestJson<ZetroLoopState>(
    `/internal/v1/zetro/loop/start?id=${encodeURIComponent(runId)}`,
    { method: "POST" },
  );
}

export function stopZetroLoop(runId: string) {
  return requestJson<ZetroLoopState>(
    `/internal/v1/zetro/loop/stop?id=${encodeURIComponent(runId)}`,
    { method: "POST" },
  );
}

export function cancelZetroLoop(runId: string) {
  return requestJson<ZetroLoopState>(
    `/internal/v1/zetro/loop/cancel?id=${encodeURIComponent(runId)}`,
    { method: "POST" },
  );
}

export function listZetroLoopEvents(runId: string) {
  return requestJson<{ items: ZetroIterationEvent[] }>(
    `/internal/v1/zetro/loop/events?id=${encodeURIComponent(runId)}`,
  );
}

export function useZetroLoopStateQuery(runId: string | null) {
  return useQuery({
    queryKey: zetroQueryKeys.loopState(runId),
    queryFn: () => getZetroLoopState(runId ?? ""),
    enabled: Boolean(runId),
  });
}

export function useZetroLoopEventsQuery(runId: string | null) {
  return useQuery({
    queryKey: zetroQueryKeys.loopEvents(runId),
    queryFn: () => listZetroLoopEvents(runId ?? ""),
    enabled: Boolean(runId),
    select: (payload) => payload.items,
  });
}

export function useZetroLoopControlMutation(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: "start" | "stop" | "cancel") => {
      if (!runId) throw new Error("Run ID is required");
      switch (action) {
        case "start":
          return startZetroLoop(runId);
        case "stop":
          return stopZetroLoop(runId);
        case "cancel":
          return cancelZetroLoop(runId);
      }
    },
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.loopState(runId),
        });
        void queryClient.invalidateQueries({
          queryKey: zetroQueryKeys.loopEvents(runId),
        });
      }
    },
  });
}

export type ZetroMemorySearchResult = {
  id: string;
  content: string;
  contentType: "finding" | "run-summary" | "chat-message" | "command-output";
  similarity: number;
  findingId?: string;
  runId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ZetroMemoryVector = {
  id: string;
  findingId?: string;
  runId?: string;
  content: string;
  contentType: "finding" | "run-summary" | "chat-message" | "command-output";
  provider: string;
  model?: string;
  createdAt: string;
};

export type ZetroMemoryStats = {
  total: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  config: {
    provider: string;
    ollamaUrl: string;
    ollamaModel: string;
  };
};

export function searchZetroMemory(
  query: string,
  options?: {
    limit?: number;
    threshold?: number;
    contentType?: string;
  },
) {
  const params = new URLSearchParams({ q: query });
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.threshold) params.set("threshold", String(options.threshold));
  if (options?.contentType) params.set("contentType", options.contentType);

  return requestJson<{ items: ZetroMemorySearchResult[] }>(
    `/internal/v1/zetro/memory/search?${params}`,
  );
}

export function findSimilarZetroFindings(
  findingId: string,
  title: string,
  summary: string,
) {
  return requestJson<{
    items: ZetroMemorySearchResult[];
    query: { findingId: string; title: string; summary: string };
  }>(
    `/internal/v1/zetro/memory/similar-findings?id=${encodeURIComponent(findingId)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`,
  );
}

export function storeZetroMemoryVector(payload: {
  findingId?: string;
  runId?: string;
  content: string;
  contentType: "finding" | "run-summary" | "chat-message" | "command-output";
}) {
  return requestJson<ZetroMemoryVector>("/internal/v1/zetro/memory/store", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listZetroMemoryVectors(options?: {
  contentType?: string;
  runId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.contentType) params.set("contentType", options.contentType);
  if (options?.runId) params.set("runId", options.runId);
  if (options?.limit) params.set("limit", String(options.limit));

  return requestJson<{ items: ZetroMemoryVector[] }>(
    `/internal/v1/zetro/memory/vectors?${params}`,
  );
}

export function getZetroMemoryStats() {
  return requestJson<ZetroMemoryStats>("/internal/v1/zetro/memory/stats");
}

export function useZetroMemorySearchQuery(
  query: string | null,
  options?: { limit?: number; threshold?: number; contentType?: string },
) {
  return useQuery({
    queryKey: ["zetro", "memory", "search", query, options],
    queryFn: () => searchZetroMemory(query ?? "", options),
    enabled: Boolean(query),
    select: (data) => data.items,
  });
}

export function useZetroMemoryVectorsQuery(options?: {
  contentType?: string;
  runId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["zetro", "memory", "vectors", options],
    queryFn: () => listZetroMemoryVectors(options),
    select: (data) => data.items,
  });
}

export function useZetroMemoryStatsQuery() {
  return useQuery({
    queryKey: ["zetro", "memory", "stats"],
    queryFn: () => getZetroMemoryStats(),
  });
}

export function useStoreZetroMemoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof storeZetroMemoryVector>[0]) =>
      storeZetroMemoryVector(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["zetro", "memory", "vectors"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["zetro", "memory", "stats"],
      });
    },
  });
}
