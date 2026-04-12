export type ZetroOutputModeId = "brief" | "normal" | "detailed" | "maximum" | "audit"

export type ZetroOutputMode = {
  id: ZetroOutputModeId
  name: string
  summary: string
  sections: string[]
}

export const zetroOutputModes: ZetroOutputMode[] = [
  {
    id: "brief",
    name: "Brief",
    summary: "Short answer with the next action only.",
    sections: ["Answer", "Next action"],
  },
  {
    id: "normal",
    name: "Normal",
    summary: "Useful summary with key files and recommended steps.",
    sections: ["Summary", "Files", "Steps"],
  },
  {
    id: "detailed",
    name: "Detailed",
    summary: "Full implementation context with file map, sequence, and tests.",
    sections: ["Context", "Plan", "Files", "Tests", "Risks"],
  },
  {
    id: "maximum",
    name: "Maximum",
    summary: "Maximum useful output for implementation planning and review.",
    sections: [
      "Intent",
      "Repo context",
      "Architecture",
      "Implementation plan",
      "Database impact",
      "API impact",
      "UI impact",
      "Risk register",
      "Test plan",
      "Done criteria",
    ],
  },
  {
    id: "audit",
    name: "Audit",
    summary: "Maximum output plus approvals, command log, assumptions, and follow-up records.",
    sections: [
      "Intent",
      "Assumptions",
      "Approvals",
      "Command log",
      "Findings",
      "Decisions",
      "Follow ups",
    ],
  },
]

export const zetroDefaultOutputMode: ZetroOutputModeId = "maximum"
