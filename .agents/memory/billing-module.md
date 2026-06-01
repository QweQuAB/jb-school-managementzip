---
name: Billing Sub-App
description: Self-contained school bill generator living in the billing section. All settings in localStorage under BILL_KEY='saSchoolBillSettings'. No server calls.
---

## Architecture
- All logic in `school-system/public/js/billing.js` (~600 lines vanilla JS)
- Loaded via `<script src="js/billing.js">` BEFORE app.js in index.html (critical for setupBilling to be defined when app.js's loaders object is created)
- `setupBilling()` is the entry point — called by app.js navigate() loaders map
- State: `_BS` (billing settings), `_billPage`, `_billForm1/2`, `_billActiveLv`, modal flags

## Layout Integration
- Billing section uses full-height layout via `.billing-active` class toggled on `#content`
- CSS: `#content.billing-active { padding:0; overflow:hidden; display:flex; flex-direction:column }`
- navigate() in app.js toggles this class: `content.classList.toggle('billing-active', section==='billing')`
- `#billing-root` div in HTML is populated entirely by _bRender()

## Data Model (localStorage)
- Key: `saSchoolBillSettings`
- 6 levels: creche, nursery, kg, lp, up, jhs — each with items[], feeding{1,2,3}, hasArrears, classes[]
- 5 transport zones (+ none) with fees per level
- school, academic, bank, watermark, background, logoSize, _blank

## Features Built
- Individual bill + Full Sheet (2 per A4) generator with live preview
- Bill renderer: letterhead, fee table, watermark, SVG background pattern
- Print preview modal → window.open() → pt-unit bill → window.print()
- Settings tab: 8 sections (school, academic, appearance, background, fees, transport, bank, import/export)
- Setup wizard (6 steps) + Admin setup wizard (7 steps, for wiped/blank state)

**Why:** The spec required a complete standalone bill generator embedded in the main app, not an external link. All billing data is independent from the main SQLite settings — stored in localStorage only.

**How to apply:** When modifying billing, edit billing.js only. The setupBilling function name must remain as-is (referenced in app.js loaders). All billing state functions are prefixed with `b` or `bill` to avoid collisions.
