# Zetro Compact Sidebar Navigation

Date: 2026-09-08

## Outcome

The Zetro sidebar now shows Chat and Tasks as compact icon tabs. Unpinned
conversation titles start below the tabs without a group heading.

## Ownership

- `zetro.desk.web` owns the Chat and Tasks feature tabs.
- `zetro.agent-chat.web` owns the flat conversation list and Pinned group.
- The API and stored records did not change.

## Interface

The two tabs keep visible counts and accessible names. Hover titles identify
each icon. Unpinned titles use a direct flat list. Smaller gaps and controls use
more of the sidebar for conversation titles.
New chat uses a black primary button above the lower Archived chats action.

## Verification

- Passed the Zetro web type check and production build.
- Passed the scoped lint and format checks.
- Verified both icon tabs, counts, hover titles, and the flat chat list at `/zetro`.
- Verified the New chat color, action order, and eight-pixel footer inset.
- Confirmed that the browser console had no errors or warnings.
- The root file-length check remains blocked by the concurrent 725-line changelog.

No commit or push was created.
