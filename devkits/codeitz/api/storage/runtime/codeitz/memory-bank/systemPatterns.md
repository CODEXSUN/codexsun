# System Patterns

## System Architecture
Codeitz adopts a modular, contract-driven architecture:
- Foundation Provider: Core identity, config, and system bootstrapping.
- Engineering Provider: SWE Task Runner, GitOps, Worktrees, Code Patcher, and State Graph.
- Capabilities Provider: Sandboxed terminal, vision analysis, speech transcription, multi-model LLM router.
- Memory Provider: Tri-format persistent Memory Bank (Markdown, SQLite, JSON).
- Skills Provider: Skill Reader, Skill Organiser, and Skill Distiller.
- Learning Provider: Empirical self-learning and heuristic synthesis.

## Key Design Patterns
- Tri-Format Parity: Always keep Markdown documents, SQLite relational tables, and JSON snapshots synchronized.
- FIFO Git Mutex: Serialize repository status, stage, and commit operations with withGitLock to prevent index collision.
- LangGraph Cyclical Loop: Allow failed verification to loop back to execution with remaining retry decrements.
