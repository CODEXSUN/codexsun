# Zetro Build Version Status

## Outcome

The Zetro status bar shows the current web package version at its right edge.
The shared web bundle gives the browser and desktop the same version label.

## Ownership

- `MdiMain` owns the optional right-side status slot.
- Zetro supplies its build version and muted gray text style.
- Vite reads the version from `apps/zetro/web/package.json` during the build.

## Interface review

- The version aligns with the right status-bar edge.
- Gray 600 text keeps the version secondary to workspace status.
- The label uses one line and does not change the status-bar height.

## Verification

- Shared UI and Zetro web type checks passed.
- Shared UI and Zetro web lint passed.
- The Zetro production build passed without chunk warnings.
- Browser review confirmed `v0.1.6` at the far-right status-bar edge.
- The fresh browser session had no console warnings or errors.
- The Windows WiX MSI build passed for Zetro `0.1.6`.
- MSI SHA-256: `F8549B71D105E2DAA89356077521870A268407C92F5248D1B9E75DF178DD69A0`.
