import type {
  StateGraphEdge,
  StateGraphNode,
  SweTaskPhase,
} from "../contracts/swe-contracts.js";

export class SweStateGraphService {
  private readonly nodes: Map<SweTaskPhase, StateGraphNode> = new Map();
  private readonly edges: StateGraphEdge[] = [];
  private readonly retryMap = new Map<string, number>();

  constructor() {
    this.initDefaultGraph();
  }

  private initDefaultGraph(): void {
    const defaultNodes: StateGraphNode[] = [
      { id: "intake", label: "Requirement Intake", description: "Parse task prompt and ground target scope", retryCount: 0, maxRetries: 1, requiresHumanApproval: false },
      { id: "grounding", label: "Context Grounding", description: "Inspect AST symbols and repository boundaries", retryCount: 0, maxRetries: 1, requiresHumanApproval: false },
      { id: "planning", label: "Patch Planning", description: "Formulate minimal safe patch and test invariant plan", retryCount: 0, maxRetries: 2, requiresHumanApproval: false },
      { id: "execution", label: "Autonomous Execution", description: "Apply code changes within repository sandbox", retryCount: 0, maxRetries: 3, requiresHumanApproval: true },
      { id: "verification", label: "Verification Gate", description: "Run TypeScript compiler, lint proofs, and test suites", retryCount: 0, maxRetries: 3, requiresHumanApproval: false },
      { id: "review", label: "Non-Regression Review", description: "Verify changelog and non-regression criteria", retryCount: 0, maxRetries: 1, requiresHumanApproval: false },
      { id: "completed", label: "Task Completed", description: "Acceptance verified with zero defects", retryCount: 0, maxRetries: 0, requiresHumanApproval: false },
      { id: "failed", label: "Task Failed", description: "Terminal failure state requiring intervention", retryCount: 0, maxRetries: 0, requiresHumanApproval: false },
    ];

    for (const node of defaultNodes) {
      this.nodes.set(node.id, node);
    }

    // Cyclical edges (LangGraph-like conditional graph):
    // verification -> passed -> review
    // verification -> failed (retry < max) -> execution (cycle back to self-heal!)
    // verification -> failed (retry >= max) -> failed
    this.edges.push(
      { from: "intake", to: "grounding", condition: "always" },
      { from: "grounding", to: "planning", condition: "always" },
      { from: "planning", to: "execution", condition: "always" },
      { from: "execution", to: "verification", condition: "on_human_approved" },
      { from: "verification", to: "review", condition: "on_passed" },
      { from: "verification", to: "execution", condition: "on_failed" }, // Cyclical loop
      { from: "review", to: "completed", condition: "always" },
    );
  }

  getNodes(): StateGraphNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): StateGraphEdge[] {
    return [...this.edges];
  }

  determineNextPhase(
    currentPhase: SweTaskPhase,
    event: "success" | "failure" | "approved",
    taskId: string,
  ): { nextPhase: SweTaskPhase; cycled: boolean; retriesRemaining: number } {
    if (currentPhase === "verification" && event === "failure") {
      const retries = this.retryMap.get(taskId) ?? 0;
      const maxRetries = this.nodes.get("verification")?.maxRetries ?? 3;
      if (retries < maxRetries) {
        this.retryMap.set(taskId, retries + 1);
        return {
          nextPhase: "execution", // LangGraph cycle back to execution for self-healing
          cycled: true,
          retriesRemaining: maxRetries - (retries + 1),
        };
      }
      return { nextPhase: "failed", cycled: false, retriesRemaining: 0 };
    }

    if (currentPhase === "intake") return { nextPhase: "grounding", cycled: false, retriesRemaining: 3 };
    if (currentPhase === "grounding") return { nextPhase: "planning", cycled: false, retriesRemaining: 3 };
    if (currentPhase === "planning") return { nextPhase: "execution", cycled: false, retriesRemaining: 3 };
    if (currentPhase === "execution") return { nextPhase: "verification", cycled: false, retriesRemaining: 3 };
    if (currentPhase === "verification" && event === "success") {
      this.retryMap.delete(taskId);
      return { nextPhase: "review", cycled: false, retriesRemaining: 0 };
    }
    if (currentPhase === "review") return { nextPhase: "completed", cycled: false, retriesRemaining: 0 };

    return { nextPhase: "completed", cycled: false, retriesRemaining: 0 };
  }
}
