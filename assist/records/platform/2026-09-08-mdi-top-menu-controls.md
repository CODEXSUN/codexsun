# MDI Top-Menu Controls

## Outcome

The shared MDI top menu now uses one visual tone for its utility controls.
The notification button opens a dropdown and shows an animated unread indicator.
The notification trigger has no circular frame.
The application launcher uses a nine-dot symbol. The profile button shows an avatar or name letter.
The compact search button opens a global search dialog and replaces the full-width field.

## Authoritative references

- Owner README: `packages/ui/README.md`
- Architecture contract: `packages/ui/src/layouts/README.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

`packages/ui` owns the buttons, popovers, motion, avatar fallback, and public types.
Each app owns its notification records, user identity, avatar URL, and action handlers.
The shared package does not fetch notifications or store user data.

## Binding properties

| Producer   | Consumer     | Binding                                            | Version or key                  |
| ---------- | ------------ | -------------------------------------------------- | ------------------------------- |
| App        | `MdiMain`    | `notifications` and `notificationCount`            | Optional properties             |
| App        | `MdiMain`    | `user.avatarUrl`, `user.name`, and actions         | `MdiUser`                       |
| App        | `MdiMain`    | Search value, callback, and navigation             | Existing optional properties    |
| `MdiMain`  | Top menu     | Shared utility control state                       | `@codexsun/ui/layouts/mdi-main` |
| UI catalog | All MDI apps | Platform, UI, Docs, DevKit, and Zetro destinations | Documented local web ports      |

## Parallel work

The worktree contained concurrent Docs, Zetro, DevKit, runtime, and root configuration changes.
This change did not edit their private source files.
The package installation preserved the existing root workspace dependency updates.
The full check found formatting drift in the shared topology inspector.
Prettier changed its formatting and preserved the concurrent behavior.

## Decisions

- Keep a 40-pixel hit area for each utility control.
- Use an unframed ghost icon for the notification trigger.
- Use Framer Motion only for the unread ripple.
- Combine a restrained center-dot pulse with a slower expanding ripple.
- Reset the ripple only while fully transparent so the loop has no visible burst.
- Stop the ripple when the browser requests reduced motion.
- Keep the static red dot visible when motion stops.
- Use the first letter of `user.name` when no avatar URL exists.
- Keep `notificationCount` compatible with existing apps.
- Replace the full search field with a compact command button.
- Open the search dialog with a pointer or `Ctrl+K`.
- Close the search dialog with `Escape`.
- Filter app and navigation destinations inside the shared dialog.
- Continue to send query changes to the application callback.
- Hide the button text on narrow screens to prevent top-menu overflow.
- Use named Tailwind utilities before arbitrary values.
- Share one Tailwind surface style across the search and circular controls.
- Keep custom component stylesheets out of the MDI controls.
- Keep runtime CSS variables only for the sidebar width and topology marker colors.
- Keep one package-owned launcher catalog and allow deployed apps to replace it through `apps`.
- Resolve local launcher destinations from the current hostname and each documented web port.
- Keep Framer Motion values for the requested unread ripple sequence.
- Position global search at 14 percent from the top of the viewport.
- Use the standard Tailwind `sm:max-w-3xl` width for global search.
- Separate the command bar and desk with a one-pixel Tailwind gap.
- Keep full-strength one-pixel borders on the command bar and desk so the sidebar
  and canvas share one sharp, slim double-line transition.
- Place the shared theme cycle beside the profile avatar and reuse the top-menu
  button tone for a consistent utility-control language.

## Verification

- Passed the shared UI type check.
- Opened Platform UI Gallery at `http://127.0.0.1:6021/ui`.
- Confirmed the aligned button tone, nine-dot launcher, and initial fallback.
- Opened the notification, application launcher, and profile dropdowns.
- Confirmed all five launcher entries expose the documented local destinations.
- Navigated from Zetro to UI through the launcher and confirmed route activation.
- Passed the complete root check after centralizing the launcher catalog.
- Confirmed accessible names and unread status in the browser tree.
- The utility-control baseline passed the complete root check before the concurrent Zetro module appeared.
- Confirmed the search dialog is absent from the closed accessibility tree.
- Opened global search by pointer and `Ctrl+K`.
- Filtered the destination list to Docs.
- Closed global search with `Escape`.
- Passed focused lint and formatting checks.
- Built shared UI, Platform web, Docs web, and DevKit web.
- Passed the production chunk-budget check for 124 chunks.
- The full root check stopped at concurrent Zetro Development documentation.
- The missing files are its module README and catalog entry.
- Replaced the custom control shadow with the Tailwind `shadow-sm` utility.
- Replaced fixed arbitrary widths and sizes with Tailwind spacing utilities.
- Replaced the custom topology highlight shadow with Tailwind ring utilities.
- Kept arbitrary values only for runtime colors, viewport limits, and the canvas grid.
- Observed the unread indicator at its reset and mid-cycle phases in the live DOM.
- Confirmed the ripple resets at zero opacity while the center dot continues pulsing.
- Passed the complete root check after the pulse-and-ripple adjustment.
- Confirmed a 1-pixel command-bar-to-desk gap in the live DOM.
- Verified the sharp one-pixel edges in light and dark themes.
- Passed the shared UI and Platform web type checks and the Platform production build.
- The final root check stopped on pre-existing formatting drift in two concurrent
  Zetro Agent Chat files; this MDI change did not edit them.
- Verified the profile theme button, System, Light, and Dark icons, complete cycle,
  accessible state labels, and reload persistence in the browser.
- Measured the refined live boundary as a one-pixel gap between two full-strength
  one-pixel borders and passed the complete root check.

## Follow-up work

Apps can supply real notification records and avatar URLs through the public layout contract.
