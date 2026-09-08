# Zetro Response Actions

## Outcome

Zetro responses now use a separated message layout with a compact icon toolbar.
The chat no longer shows internal worktree paths or identifiers.

## Ownership

The Agent Chat web module owns the response layout and actions. This change does
not add an API, database, migration, or worktree lifecycle operation.

## Actions

- A user prompt shows Copy and Analysis.
- An assistant response shows Copy and the planned work actions.
- Actions, Review prompt, Review chat, and Send to task open placeholder menus.
- Archive moves the active chat to Archived chats.
- Delete stays disabled until the user opens Archived chats.

## Interface decisions

- A subtle border separates each message.
- Each toolbar appears on message hover or keyboard focus.
- The icon toolbar uses fixed action slots for each message role.
- The three-dot trigger appears only on an assistant response.
- One separator follows each combined user and assistant turn.
- The message stream always uses relaxed spacing.
- The Chat display control and saved density setting are removed.
- The layout uses shared shadcn components and Tailwind utilities.
- The interface does not show a workflow, worktree path, or conversation identifier.

## Verification

- The Zetro web type check and production build passed.
- Browser verification passed for the toolbar, placeholder popups, overflow
  menu, message borders, Copy feedback, and Archive flow.
- Browser verification confirmed one separator for each prompt-response turn.
- Browser verification confirmed relaxed spacing and no Chat display control.
- The archive test chat was restored to active history after verification.
- The complete repository `check` command passed.
- The browser produced no new warnings or errors after the menu fix.
- `git diff --check` passed.
