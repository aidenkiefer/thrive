# Assignment: admin media library (2026-11-22)

Direct owner request: Codex builds a view-only repository photo library in admin while Cursor completes #150 themes/transitions and Claude completes #147 DatePicker. Issue #152. No uploads, media mutations, schema or live-service setup.

## Scope / ownership

Codex owns new admin/media page and guarded image route, new MediaLibrary component, file-backed catalog/types, preview build script, its targeted tests, and the additive admin-sections/dashboard count integration. Package/lock, tracing and ignore changes are explicitly necessary for reproducible private previews. Do not edit AdminShell, admin.css, theme preferences/global styles/tokens, DatePicker or existing date editors.

1. **Catalog/previews — M:** enumerate repository image assets (including originals outside public), generate bounded optimized thumbnails/full previews before dev/build; staff-only image route uses known IDs, not arbitrary paths. No runtime image processing and no new public original copies.
2. **Gallery/viewer — M:** default three-column desktop grid, responsive narrow layout, darkened native modal, full image, top-right close, Escape, wrapping previous/next arrow controls/keys and touch swipe; keyboard focus returns to the opener. Integrate one Media library dashboard/sidebar entry without creating a fake database count.

Verification: repository inventory coverage; active-staff guard/invalid request tests; build packaging; representative browser grid/modal/keyboard/swipe/focus checks; full gate. Real staff session verification requires available owner session; do not create a persisted auth bypass. No new tests mirroring markup. Author opens PR and never self-merges.
