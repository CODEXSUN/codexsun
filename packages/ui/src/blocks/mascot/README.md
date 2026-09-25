# Mascot block

The Mascot block provides the shared runtime for a cursor-aware, clickable character.

## Asset contract

Each character supplies two aligned 3x3 sprite atlases:

- `directions`: nine head directions in clockwise pointer order with `center` in the middle.
- `reactions`: nine expressions, including `blink`, `heart`, `sparkle`, and `dizzy`.

The app owns these served or imported asset URLs. This keeps the package reusable across apps and
allows each app to select a character or generate its own atlases without changing the component.
Set `trackPointer={false}` for dense variant galleries where only click reactions are needed.

## Runtime behavior

The component selects a direction from the pointer sector, uses a dead zone and hysteresis to avoid
jitter, and pre-mounts the reaction sheet so the first click does not fetch it late. Clicks cycle
through payoff reactions, trigger `dizzy` after four quick boops, and respect
`prefers-reduced-motion` for the squash animation.
