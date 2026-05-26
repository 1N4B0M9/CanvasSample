# Canvas Resource UX — Spec
**Date:** 2026-05-26
**Branch:** `feature/canvas-element-labeling`

---

## Overview

Two related improvements to how resources are surfaced and sourced on the canvas:

1. **Board Resources Sidebar** — The right sidebar (currently the "Find Resources" slide-in panel) becomes a consolidated list of all resources explicitly added to the board. "Find Resources" moves to a modal.
2. **Citation Source Icons** — The generic 📎 paperclip on canvas elements is replaced by per-source-type icon buttons: 🌐 for live Perplexity/sonar citations, 🗄️ for local Firestore citations.

---

## Feature 1: Board Resources Sidebar

### Goal
Give users a persistent, at-a-glance list of every resource they've committed to their board, with hover-to-highlight to orient them spatially.

### Current behavior
- Resources button (bottom-right) counts text elements with detected goal keywords.
- Clicking opens a right slide-in panel that queries Firestore + Perplexity for matching resources.

### New behavior
- **Badge number** = `boardResources.length` (resources explicitly added to board via "+ Add to board").
- **Clicking the button** opens the right sidebar showing the board resources list.
- **Sidebar content:** name, source badge (workshop / 211pa / sonar), step count per resource.
- **Hover on a resource row** → highlights the corresponding canvas step elements with a gold ring.
- **Mouse-leave** → clears highlight.
- **Empty state:** "No resources on your board yet. Tap ✦ on any element to find and add resources."

### "Find Resources" → Modal
The existing `ResourcePanel` (resource search results + pathway preview) moves from the right slide-in to a centered modal overlay. Behavior inside the modal is unchanged: loads Firestore + sonar resources, shows cards, hover shows `PathwayOverlay` on canvas behind modal, "Add to board" commits to board.

### Data model

**New type — `BoardResource`:**
```js
{
  id: string,          // resource.id from Firestore or sonar
  name: string,
  source: string,      // 'workshop' | '211pa' | 'sonar'
  stepIds: string[],   // canvas element IDs created by savePathwayToBoard for this resource
}
```

**CanvasContext changes:**
- Add `boardResources: BoardResource[]` state, initialized to `[]`.
- Add `highlightedStepIds: string[]` state, initialized to `[]`.
- Expose `setBoardResources` and `setHighlightedStepIds` via context.
- `savePathwayToBoard(resource, originElementId)` extended: after creating elements, push a `BoardResource` entry to `boardResources`.
- Canvas save payload gains `boardResources` field; restored on load via `canvas.data.boardResources ?? []`.

**Canvas element highlight:**
- Elements whose `id` is in `highlightedStepIds` render with a 2px gold (`#f59e0b`) ring in `CanvasElement`.
- This is CSS only — no Konva layer change needed since elements are HTML-overlay rendered.

### Components

| Component | Change |
|-----------|--------|
| `CanvasContext.jsx` | Add `boardResources`, `highlightedStepIds` state; extend `savePathwayToBoard`; extend save/load payload |
| `RenderCanvas.jsx` | Replace `resourceCount` derivation; add `boardSidebarOpen` state; wire `SparkleButton.onOpen` to open sidebar; render `BoardResourcesSidebar` and `FindResourcesModal` |
| `SparkleButton.jsx` | `resourceCount` prop is now board count; tooltip text update |
| `BoardResourcesSidebar.jsx` | **New.** Right slide-in (240px). Lists `boardResources` from context. Hover sets `highlightedStepIds`. |
| `FindResourcesModal.jsx` | **New.** Centered modal wrapping current `ResourcePanel` content. Triggered by "✨ Find resources" on element badge. |
| `ResourcePanel.jsx` | Repurposed as inner content of `FindResourcesModal` (no positional styling changes needed — modal provides the container). |
| `CanvasElement.jsx` | Apply gold ring when element id ∈ `highlightedStepIds`. |

---

## Feature 2: Citation Source Icons

### Goal
Each canvas step element visually signals which types of sources back it — live web vs local database — without having to open a panel.

### Current behavior
- `element.citations: string[]` — plain URL array, no source metadata.
- A single 📎 paperclip button in `SparkleHoverBadge` opens a dropdown listing all URLs.

### New behavior
- `element.citations: { url: string, source: 'sonar' | 'local' }[]`
- `SparkleHoverBadge` renders:
  - 🌐 button if any citation has `source === 'sonar'`
  - 🗄️ button if any citation has `source === 'local'`
  - Each button click opens a dropdown filtered to that source type
  - No citations → no buttons (unchanged)
  - Both sources present → both buttons shown side by side

### Data model

**`savePathwayToBoard` tagging logic:**
```js
const citationSource = resource.source === 'sonar' ? 'sonar' : 'local';
const taggedCitations = (step.citations ?? resource.citations ?? []).map(
  (url) => (typeof url === 'string' ? { url, source: citationSource } : url)
);
// stored as element.citations = taggedCitations (if length > 0)
```

**Backward compatibility:**
- `SparkleHoverBadge` normalizes each citation entry: `typeof c === 'string' ? { url: c, source: 'local' } : c`
- Old elements with plain string citations continue to work, rendered as local source.

### Components

| Component | Change |
|-----------|--------|
| `CanvasContext.jsx` | Update `savePathwayToBoard` to tag citations with source |
| `SparkleHoverBadge.jsx` | Replace single paperclip button with per-source icon buttons; normalize citation entries; filter dropdown by source |

---

## What Does NOT Change

- `PathwayOverlay` — unchanged; still overlays canvas when a resource card is hovered inside the modal.
- `useGetPathway.js` — unchanged; still queries Firestore + Cloudflare Worker.
- `SparkleHoverBadge` sparkle (✦) button and "Ask about this" — unchanged.
- `useGoalDetection.js` / `resourceTagMap.js` — unchanged; still used to decide whether "✨ Find resources" appears on an element.
- All existing tests — no behavior changes to currently-tested paths.

---

## Open Questions / Assumptions

- **Board resources persistence across sessions:** `boardResources` is saved in the Firestore canvas document alongside `elements`. If a user deletes a step element manually, the `boardResources` entry still lists it — stale `stepIds` produce no highlight (no element found), which is acceptable. No cleanup logic needed in v1.
- **Modal z-index:** `FindResourcesModal` sits above the canvas overlay (z-index 60), below browser chrome. `PathwayOverlay` (z-index 45) renders behind the modal intentionally.
- **No deduplication:** Adding the same resource twice appends a second entry to `boardResources`. Acceptable for v1.
