# Canvas Resource UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the goal-detection resource panel with (1) a board resources sidebar that lists resources explicitly added to the board with hover-highlight, (2) a modal for Find Resources search results, and (3) per-source citation icons (🌐 sonar / 🗄️ local) replacing the generic 📎 paperclip.

**Architecture:** `boardResources` and `highlightedStepIds` are added to `CanvasContext` and persisted in Firestore. `BoardResourcesSidebar` reads from context and sets `highlightedStepIds` on hover. `FindResourcesModal` wraps the existing `ResourcePanel` content. Citations on canvas elements change from `string[]` to `{url,title,date,source}[]`, tagged at write time in `savePathwayToBoard` and `handleAskSubmit`.

**Tech Stack:** React 18, Jest + React Testing Library, Tailwind CSS, Firebase Firestore, Cloudflare Workers (Perplexity Sonar API)

**Spec:** `docs/superpowers/specs/2026-05-26-canvas-resource-ux.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/Canvas/Utils/CanvasContext.jsx` | Add boardResources + highlightedStepIds state; extend savePathwayToBoard; extend save/load payload |
| Modify | `src/components/Canvas/Components/CanvasElement.jsx` | Apply gold ring from highlightedStepIds; tag handleAskSubmit citations |
| Create | `src/components/Canvas/Recommendations/BoardResourcesSidebar.jsx` | Right slide-in listing board-added resources with hover-highlight |
| Create | `src/components/Canvas/Recommendations/__tests__/BoardResourcesSidebar.test.jsx` | Tests for BoardResourcesSidebar |
| Modify | `src/components/Canvas/Recommendations/ResourcePanel.jsx` | Strip absolute positioning — modal provides container |
| Create | `src/components/Canvas/Recommendations/FindResourcesModal.jsx` | Centered modal wrapping ResourcePanel |
| Create | `src/components/Canvas/Recommendations/__tests__/FindResourcesModal.test.jsx` | Tests for FindResourcesModal |
| Modify | `src/components/Canvas/Layout/RenderCanvas.jsx` | Replace slide-in with modal + board sidebar; update SparkleButton |
| Modify | `src/components/Canvas/Recommendations/SparkleHoverBadge.jsx` | Per-source icon buttons; normalize citations; show title+date in dropdown |
| Modify | `src/components/Canvas/Recommendations/__tests__/SparkleHoverBadge.test.jsx` | Update existing citation tests; add new source icon tests |
| Modify | `workers/getPathway.js` | Add return_citations; return searchResults from callSubSteps (**external worker repo**) |

---

## Task 1: CanvasContext — boardResources + highlightedStepIds state

**Files:**
- Modify: `src/components/Canvas/Utils/CanvasContext.jsx`

- [ ] **Step 1: Add state declarations**

After line 63 (`const [resourceCount, setResourceCount] = React.useState(0);`), add:

```js
const [boardResources, setBoardResources] = React.useState([]);
const [highlightedStepIds, setHighlightedStepIds] = React.useState([]);
```

- [ ] **Step 2: Load boardResources from Firestore on mount**

Inside the load `useEffect` (around line 76), after the `backgroundScale` block, add:

```js
setBoardResources(canvas.data.boardResources ?? []);
```

- [ ] **Step 3: Add boardResources to the save payload**

In the save `useEffect` (around line 107), update `canvasData`:

```js
const canvasData = {
  elements,
  connections,
  arrows,
  backgroundImage,
  backgroundScale,
  boardResources,
};
```

Also add `boardResources` to the save effect dependency array:

```js
}, [elements, connections, arrows, backgroundImage, backgroundScale, boardResources, canvasId, updateCanvas]);
```

- [ ] **Step 4: Expose in context value**

In the `value` object (around line 1374, in the `// Recommendations` section), replace:

```js
// Recommendations
savePathwayToBoard,
```

With:

```js
// Recommendations
savePathwayToBoard,
boardResources,
setBoardResources,
highlightedStepIds,
setHighlightedStepIds,
```

- [ ] **Step 5: Verify dev server starts clean**

```bash
npm run errorfreedev
```

Expected: server starts, no console errors. Canvas still loads and saves correctly.

- [ ] **Step 6: Commit**

```bash
git add src/components/Canvas/Utils/CanvasContext.jsx
git commit -m "feat(canvas): add boardResources and highlightedStepIds to CanvasContext"
```

---

## Task 2: CanvasContext — citation tagging + boardResources tracking in savePathwayToBoard

**Files:**
- Modify: `src/components/Canvas/Utils/CanvasContext.jsx`

- [ ] **Step 1: Add citationSource variable before the pathwaySteps loop**

Inside `savePathwayToBoard` (around line 644), add this line immediately after the `const stepIds = [];` declaration:

```js
const citationSource = resource.source === 'sonar' ? 'sonar' : 'local';
```

- [ ] **Step 2: Replace the citation spread inside the pathwaySteps loop**

Inside the `for (const step of resource.pathwaySteps)` loop, replace:

```js
...(
  step.citations?.length
    ? { citations: step.citations }
    : resource.citations?.length
    ? { citations: resource.citations }
    : {}
),
```

With:

```js
...((() => {
  const raw = step.citations ?? resource.citations ?? [];
  if (!raw.length) return {};
  return {
    citations: raw.map((c) =>
      typeof c === 'string'
        ? { url: c, title: c, date: null, source: citationSource }
        : { ...c, source: citationSource }
    ),
  };
})()),
```

- [ ] **Step 3: Push to boardResources after elements are created**

After `setArrowsWithSave((prev) => [...prev, ...newArrows]);` (line ~753), add:

```js
setBoardResources((prev) => [
  ...prev,
  {
    id: `${resource.id ?? 'res'}-${baseId}`,
    name: resource.name,
    source: resource.source ?? 'local',
    stepIds: [...stepIds],
  },
]);
```

- [ ] **Step 4: Add setBoardResources to useCallback deps**

The `savePathwayToBoard` useCallback deps (line ~757) currently are:
```js
[elements, setElementsWithSave, setArrowsWithSave]
```

Update to:
```js
[elements, setElementsWithSave, setArrowsWithSave, setBoardResources]
```

- [ ] **Step 5: Manual smoke test**

Run `npm run errorfreedev`. Open the canvas, add a text element with goal-related content, click ✦ → Find resources, add a resource to the board. Open the browser console and check that `boardResources` is logged in the `Saving canvas data:` output with the new resource entry and `stepIds`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Canvas/Utils/CanvasContext.jsx
git commit -m "feat(canvas): tag citations with source in savePathwayToBoard; track boardResources"
```

---

## Task 3: BoardResourcesSidebar — tests then implementation

**Files:**
- Create: `src/components/Canvas/Recommendations/__tests__/BoardResourcesSidebar.test.jsx`
- Create: `src/components/Canvas/Recommendations/BoardResourcesSidebar.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Canvas/Recommendations/__tests__/BoardResourcesSidebar.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import BoardResourcesSidebar from '../BoardResourcesSidebar';
import { useCanvas } from '../../Utils/CanvasContext';

jest.mock('../../Utils/CanvasContext');

const mockSetHighlightedStepIds = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useCanvas.mockReturnValue({
    boardResources: [],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
});

test('shows empty state when no board resources', () => {
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/No resources on your board yet/)).toBeInTheDocument();
});

test('renders resource name and step count', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText('Housing Authority')).toBeInTheDocument();
  expect(screen.getByText('2 steps')).toBeInTheDocument();
});

test('shows Local badge for local source', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Agency', source: 'local', stepIds: ['s1'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/Local/)).toBeInTheDocument();
});

test('shows Live badge for sonar source', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Live Agency', source: 'sonar', stepIds: ['s1'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/Live/)).toBeInTheDocument();
});

test('calls setHighlightedStepIds with stepIds on mouse enter', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  fireEvent.mouseEnter(screen.getAllByRole('listitem')[0]);
  expect(mockSetHighlightedStepIds).toHaveBeenCalledWith(['s1', 's2']);
});

test('calls setHighlightedStepIds with empty array on mouse leave', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  fireEvent.mouseLeave(screen.getAllByRole('listitem')[0]);
  expect(mockSetHighlightedStepIds).toHaveBeenCalledWith([]);
});

test('calls onClose when close button clicked', () => {
  const onClose = jest.fn();
  render(<BoardResourcesSidebar onClose={onClose} />);
  fireEvent.click(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern=BoardResourcesSidebar --watchAll=false
```

Expected: FAIL with "Cannot find module '../BoardResourcesSidebar'"

- [ ] **Step 3: Implement BoardResourcesSidebar**

Create `src/components/Canvas/Recommendations/BoardResourcesSidebar.jsx`:

```jsx
import React from 'react';
import { useCanvas } from '../Utils/CanvasContext';

const BoardResourcesSidebar = ({ onClose }) => {
  const { boardResources, setHighlightedStepIds } = useCanvas();

  return (
    <div
      className="absolute top-0 right-0 h-full bg-white shadow-xl flex flex-col"
      style={{ width: 240, zIndex: 50 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-900">Board Resources</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {boardResources.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No resources on your board yet. Tap ✦ on any element to find and add resources.
          </p>
        ) : (
          boardResources.map((br) => (
            <div
              key={br.id}
              role="listitem"
              className="rounded-lg border border-gray-100 p-3 cursor-default hover:bg-gray-50 transition-colors"
              onMouseEnter={() => setHighlightedStepIds(br.stepIds)}
              onMouseLeave={() => setHighlightedStepIds([])}
            >
              <p className="text-xs font-semibold text-gray-900 leading-tight">{br.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{br.stepIds.length} steps</span>
                <span
                  className="text-xs rounded-full px-2 py-0.5 font-medium"
                  style={
                    br.source === 'sonar'
                      ? { background: '#f0fdf4', color: '#166534' }
                      : { background: '#eff6ff', color: '#1e40af' }
                  }
                >
                  {br.source === 'sonar' ? '⚡ Live' : '🗄 Local'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardResourcesSidebar;
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern=BoardResourcesSidebar --watchAll=false
```

Expected: 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas/Recommendations/BoardResourcesSidebar.jsx src/components/Canvas/Recommendations/__tests__/BoardResourcesSidebar.test.jsx
git commit -m "feat(canvas): add BoardResourcesSidebar with hover-highlight"
```

---

## Task 4: ResourcePanel — strip absolute positioning for modal use

**Files:**
- Modify: `src/components/Canvas/Recommendations/ResourcePanel.jsx`

- [ ] **Step 1: Remove the dim overlay and absolute positioning**

`ResourcePanel.jsx` currently renders a Fragment containing a dim overlay div and an absolutely-positioned panel div. Replace the entire return with a layout-agnostic version:

Replace the outer structure:

```jsx
return (
  <>
    {/* Canvas dim layer */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.15)', zIndex: 40 }}
    />

    {/* Panel */}
    <div
      className="absolute top-0 right-0 h-full bg-white shadow-xl flex flex-col"
      style={{ width: 240, zIndex: 50 }}
    >
```

With:

```jsx
return (
    <div
      className="h-full bg-white flex flex-col"
    >
```

And remove the closing `</div></>` at the end, replacing with a single `</div>`.

- [ ] **Step 2: Verify dev server — ResourcePanel content still renders**

```bash
npm run errorfreedev
```

Open the canvas. Click ✦ on a text element with goal content → "Find resources". The ResourcePanel still appears (as the slide-in for now — modal wiring happens in Task 6). Check its content renders correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas/Recommendations/ResourcePanel.jsx
git commit -m "refactor(canvas): strip absolute positioning from ResourcePanel for modal reuse"
```

---

## Task 5: FindResourcesModal — tests then implementation

**Files:**
- Create: `src/components/Canvas/Recommendations/__tests__/FindResourcesModal.test.jsx`
- Create: `src/components/Canvas/Recommendations/FindResourcesModal.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Canvas/Recommendations/__tests__/FindResourcesModal.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FindResourcesModal from '../FindResourcesModal';

jest.mock('../ResourcePanel', () => ({ goalType, onClose }) => (
  <div data-testid="resource-panel">
    <span>{goalType ?? 'no-goal'}</span>
    <button onClick={onClose}>CloseInner</button>
  </div>
));

test('renders ResourcePanel inside modal', () => {
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={jest.fn()}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  expect(screen.getByTestId('resource-panel')).toBeInTheDocument();
  expect(screen.getByText('employment_search')).toBeInTheDocument();
});

test('calls onClose when backdrop clicked', () => {
  const onClose = jest.fn();
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={onClose}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  fireEvent.click(screen.getByTestId('modal-backdrop'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('passes onClose through to ResourcePanel', () => {
  const onClose = jest.fn();
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={onClose}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  fireEvent.click(screen.getByText('CloseInner'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- --testPathPattern=FindResourcesModal --watchAll=false
```

Expected: FAIL with "Cannot find module '../FindResourcesModal'"

- [ ] **Step 3: Implement FindResourcesModal**

Create `src/components/Canvas/Recommendations/FindResourcesModal.jsx`:

```jsx
import React from 'react';
import ResourcePanel from './ResourcePanel';

const FindResourcesModal = ({ goalType, domain, onClose, onSelectResource, selectedResourceId }) => {
  return (
    <>
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', zIndex: 55 }}
        onClick={onClose}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 60, pointerEvents: 'none' }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            width: 360,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <ResourcePanel
            goalType={goalType}
            domain={domain}
            onClose={onClose}
            onSelectResource={onSelectResource}
            selectedResourceId={selectedResourceId}
          />
        </div>
      </div>
    </>
  );
};

export default FindResourcesModal;
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern=FindResourcesModal --watchAll=false
```

Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas/Recommendations/FindResourcesModal.jsx src/components/Canvas/Recommendations/__tests__/FindResourcesModal.test.jsx
git commit -m "feat(canvas): add FindResourcesModal wrapping ResourcePanel"
```

---

## Task 6: RenderCanvas — wire up board sidebar + modal, update SparkleButton

**Files:**
- Modify: `src/components/Canvas/Layout/RenderCanvas.jsx`

- [ ] **Step 1: Add imports**

At the top of `RenderCanvas.jsx`, add:

```js
import BoardResourcesSidebar from '../Recommendations/BoardResourcesSidebar';
import FindResourcesModal from '../Recommendations/FindResourcesModal';
```

And add `boardResources` to the `useCanvas` destructure (find the line that calls `useCanvas()`):

```js
const { ..., savePathwayToBoard, boardResources } = useCanvas();
```

- [ ] **Step 2: Remove the goal-detection resourceCount effect**

Delete the entire `useEffect` block that sets `resourceCount` (around lines 100–108):

```js
// DELETE THIS ENTIRE BLOCK:
React.useEffect(() => {
  const timer = setTimeout(() => {
    const count = elements.filter(
      (el) => el.type === 'text' && el.content && detectGoal(el.content) !== null,
    ).length;
    setResourceCount(count);
  }, 3000);
  return () => clearTimeout(timer);
}, [elements]);
```

Also delete the `resourceCount` state declaration:
```js
// DELETE:
const [resourceCount, setResourceCount] = React.useState(0);
```

- [ ] **Step 3: Add boardSidebarOpen state**

After the `panelAnchorId` state declaration, add:

```js
const [boardSidebarOpen, setBoardSidebarOpen] = React.useState(false);
```

- [ ] **Step 4: Update SparkleButton**

Replace the current `<SparkleButton ... />` block:

```jsx
<SparkleButton
  resourceCount={resourceCount}
  onOpen={() => {
    const goalEl = [...elements].reverse().find(
      (el) => el.type === 'text' && el.content && detectGoal(el.content),
    );
    const detected = goalEl
      ? detectGoal(goalEl.content)
      : { goalType: null, domain: null };
    setPanelGoal({ goalType: detected.goalType, domain: detected.domain });
    setPanelAnchorId(null);
    setPanelOpen(true);
  }}
/>
```

With:

```jsx
<SparkleButton
  resourceCount={boardResources.length}
  onOpen={() => setBoardSidebarOpen(true)}
/>
```

- [ ] **Step 5: Replace ResourcePanel slide-in with FindResourcesModal + BoardResourcesSidebar**

Replace:

```jsx
{/* Recommendations: slide-in resource panel */}
{panelOpen && (
  <ResourcePanel
    goalType={panelGoal.goalType}
    domain={panelGoal.domain}
    onClose={() => {
      setPanelOpen(false);
      setPanelAnchorId(null);
      setSelectedResource(null);
    }}
    onSelectResource={(resource) => setSelectedResource(resource)}
    selectedResourceId={selectedResource?.id}
  />
)}
```

With:

```jsx
{/* Find Resources modal — triggered by ✦ Find resources on element */}
{panelOpen && (
  <FindResourcesModal
    goalType={panelGoal.goalType}
    domain={panelGoal.domain}
    onClose={() => {
      setPanelOpen(false);
      setPanelAnchorId(null);
      setSelectedResource(null);
    }}
    onSelectResource={(resource) => setSelectedResource(resource)}
    selectedResourceId={selectedResource?.id}
  />
)}

{/* Board resources sidebar — triggered by Resources button */}
{boardSidebarOpen && (
  <BoardResourcesSidebar onClose={() => setBoardSidebarOpen(false)} />
)}
```

- [ ] **Step 6: Verify full flow in dev server**

```bash
npm run errorfreedev
```

Check:
1. Resources button badge shows count of board-added resources (starts at 0).
2. Clicking Resources button opens the right sidebar with "No resources yet" message.
3. Clicking ✦ on a text element → Find resources opens a centered modal (not a slide-in).
4. Adding a resource to board via the modal closes the modal and increments the badge.
5. Resources sidebar now shows the added resource row.
6. Hovering the resource row highlights its steps with a gold ring.

- [ ] **Step 7: Commit**

```bash
git add src/components/Canvas/Layout/RenderCanvas.jsx
git commit -m "feat(canvas): wire BoardResourcesSidebar + FindResourcesModal into RenderCanvas"
```

---

## Task 7: CanvasElement — gold ring for highlightedStepIds

**Files:**
- Modify: `src/components/Canvas/Components/CanvasElement.jsx`

- [ ] **Step 1: Destructure highlightedStepIds from useCanvas**

Find the existing destructure (line ~39):

```js
const { elements, addElement, addArrow } = useCanvas();
```

Replace with:

```js
const { elements, addElement, addArrow, highlightedStepIds } = useCanvas();
```

- [ ] **Step 2: Apply gold ring to the outer div**

Find the outer div (around line 177–187):

```js
boxShadow: isPanelAnchor ? '0 0 0 3px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.35)' : undefined,
```

Replace with:

```js
boxShadow: (isPanelAnchor || highlightedStepIds.includes(element.id))
  ? '0 0 0 3px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.35)'
  : undefined,
```

- [ ] **Step 3: Verify in dev server**

Add a resource to the board. Open the board sidebar. Hover a resource row — its step elements should glow gold. Mouse-leave clears the glow.

- [ ] **Step 4: Commit**

```bash
git add src/components/Canvas/Components/CanvasElement.jsx
git commit -m "feat(canvas): highlight board resource steps with gold ring on sidebar hover"
```

---

## Task 8: CanvasElement — tag handleAskSubmit citations as sonar

**Files:**
- Modify: `src/components/Canvas/Components/CanvasElement.jsx`

- [ ] **Step 1: Update handleAskSubmit to use searchResults**

Find line ~123 inside `handleAskSubmit`:

```js
const el = { ...newElements[i], goalText, ...(result.citations?.length && { citations: result.citations }) };
```

Replace with:

```js
const taggedCitations = (result.searchResults ?? []).map(
  ({ title, url, date }) => ({ url, title, date: date ?? null, source: 'sonar' })
);
const el = {
  ...newElements[i],
  goalText,
  ...(taggedCitations.length && { citations: taggedCitations }),
};
```

- [ ] **Step 2: Verify in dev server**

Click ✦ → "Ask about this" on a text element. Submit a question. The sub-step elements are created. Click ✦ on one of the sub-step elements — if the worker is returning `searchResults`, the 🌐 globe button appears. If the worker is not yet updated (Task 11 not done), no globe button appears — that is expected.

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas/Components/CanvasElement.jsx
git commit -m "feat(canvas): tag sub-step citations with source sonar from searchResults"
```

---

## Task 9: SparkleHoverBadge — source icon buttons + updated tests

**Files:**
- Modify: `src/components/Canvas/Recommendations/__tests__/SparkleHoverBadge.test.jsx`
- Modify: `src/components/Canvas/Recommendations/SparkleHoverBadge.jsx`

- [ ] **Step 1: Update the test file**

Replace the entire contents of `src/components/Canvas/Recommendations/__tests__/SparkleHoverBadge.test.jsx` with:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import SparkleHoverBadge from '../SparkleHoverBadge';

beforeEach(() => jest.clearAllMocks());

// --- Sparkle button (unchanged behavior) ---

test('renders the sparkle badge button', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.getByTitle('More options')).toBeInTheDocument();
});

test('action panel is not visible before click', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByText(/Find resources/)).not.toBeInTheDocument();
});

test('action panel appears on sparkle button click', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  expect(screen.getByText(/Find resources/)).toBeInTheDocument();
  expect(screen.getByText(/Ask about this/)).toBeInTheDocument();
});

test('calls onFindResources when "Find resources" clicked', () => {
  const onFindResources = jest.fn();
  render(<SparkleHoverBadge onFindResources={onFindResources} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  fireEvent.click(screen.getByText(/Find resources/));
  expect(onFindResources).toHaveBeenCalledTimes(1);
});

test('calls onAsk when "Ask about this" clicked', () => {
  const onAsk = jest.fn();
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={onAsk} />);
  fireEvent.click(screen.getByTitle('More options'));
  fireEvent.click(screen.getByText(/Ask about this/));
  expect(onAsk).toHaveBeenCalledTimes(1);
});

test('hides Find Resources button when onFindResources is null', () => {
  render(<SparkleHoverBadge onFindResources={null} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  expect(screen.queryByText(/Find resources/)).not.toBeInTheDocument();
  expect(screen.getByText(/Ask about this/)).toBeInTheDocument();
});

// --- Citation source icon buttons ---

test('no source buttons shown when no citations', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByTitle('Local sources')).not.toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('shows database button for local citations', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Site A', date: null, source: 'local' }]}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('shows globe button for sonar citations', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://b.com', title: 'Site B', date: '2025-01-01', source: 'sonar' }]}
    />
  );
  expect(screen.getByTitle('Live sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Local sources')).not.toBeInTheDocument();
});

test('shows both buttons when citations have both sources', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[
        { url: 'https://a.com', title: 'Site A', date: null, source: 'local' },
        { url: 'https://b.com', title: 'Site B', date: '2025-01-01', source: 'sonar' },
      ]}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.getByTitle('Live sources')).toBeInTheDocument();
});

test('local citations panel shows title on database button click', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Housing Authority', date: null, source: 'local' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.getByText('Housing Authority')).toBeInTheDocument();
});

test('sonar citations panel shows title and date on globe button click', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://b.com', title: 'Job Board', date: '2025-03-15', source: 'sonar' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Live sources'));
  expect(screen.getByText('Job Board')).toBeInTheDocument();
  expect(screen.getByText(/2025-03-15/)).toBeInTheDocument();
});

test('legacy string citation treated as local — shows database button', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={['https://old.com']}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('clicking open panel again closes it', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Site A', date: null, source: 'local' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.getByText('Site A')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.queryByText('Site A')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — expect FAIL on citation tests**

```bash
npm test -- --testPathPattern=SparkleHoverBadge --watchAll=false
```

Expected: original sparkle tests pass; citation tests fail ("Local sources" not found, etc.).

- [ ] **Step 3: Implement the updated SparkleHoverBadge**

Replace the entire contents of `src/components/Canvas/Recommendations/SparkleHoverBadge.jsx` with:

```jsx
import React, { useState, useRef, useEffect } from 'react';

const SparkleHoverBadge = ({ onFindResources, onAsk, citations = [] }) => {
  const [sparkleOpen, setSparkleOpen] = useState(false);
  const [citationPanel, setCitationPanel] = useState(null); // null | 'sonar' | 'local'
  const containerRef = useRef(null);

  useEffect(() => {
    if (!sparkleOpen && !citationPanel) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSparkleOpen(false);
        setCitationPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sparkleOpen, citationPanel]);

  const toggleSparkle = () => {
    setSparkleOpen((prev) => !prev);
    setCitationPanel(null);
  };

  const toggleCitationPanel = (type) => {
    setCitationPanel((prev) => (prev === type ? null : type));
    setSparkleOpen(false);
  };

  const normalized = citations.map((c) =>
    typeof c === 'string'
      ? { url: c, title: c, date: null, source: 'local' }
      : c
  );
  const sonarCitations = normalized.filter((c) => c.source === 'sonar');
  const localCitations = normalized.filter((c) => c.source === 'local');

  const activeCitations = citationPanel === 'sonar' ? sonarCitations : localCitations;

  return (
    <div
      ref={containerRef}
      className="absolute flex gap-1"
      style={{ top: -10, right: -10, zIndex: 40 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Citation panel dropdown */}
      {citationPanel && activeCitations.length > 0 && (
        <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            {citationPanel === 'sonar' ? '🌐 Live Sources' : '🗄️ Local Sources'}
          </p>
          {activeCitations.map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline mb-1"
            >
              <span className="font-medium">
                {c.title && c.title !== c.url ? c.title : c.url}
              </span>
              {c.date && (
                <span className="text-gray-400 ml-1">· {c.date}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Sparkle options panel */}
      {sparkleOpen && (
        <div className="absolute right-0 bottom-full mb-2 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 whitespace-nowrap">
          {onFindResources && (
            <>
              <button
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => { onFindResources(); setSparkleOpen(false); }}
              >
                ✨ Find resources
              </button>
              <span className="text-gray-300 select-none">|</span>
            </>
          )}
          <button
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => { onAsk(); setSparkleOpen(false); }}
          >
            ✦ Ask about this
          </button>
        </div>
      )}

      {/* Local (database) source button */}
      {localCitations.length > 0 && (
        <button
          title="Local sources"
          className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
            citationPanel === 'local'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleCitationPanel('local')}
        >
          🗄️
        </button>
      )}

      {/* Sonar (globe) source button */}
      {sonarCitations.length > 0 && (
        <button
          title="Live sources"
          className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
            citationPanel === 'sonar'
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleCitationPanel('sonar')}
        >
          🌐
        </button>
      )}

      {/* Sparkle button */}
      <button
        title="More options"
        className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
          sparkleOpen
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
        }`}
        onClick={toggleSparkle}
      >
        ✦
      </button>
    </div>
  );
};

export default SparkleHoverBadge;
```

- [ ] **Step 4: Run all SparkleHoverBadge tests — expect PASS**

```bash
npm test -- --testPathPattern=SparkleHoverBadge --watchAll=false
```

Expected: 14 tests passing.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: all 41+ tests passing (41 original + new tests from this plan).

- [ ] **Step 6: Commit**

```bash
git add src/components/Canvas/Recommendations/SparkleHoverBadge.jsx src/components/Canvas/Recommendations/__tests__/SparkleHoverBadge.test.jsx
git commit -m "feat(canvas): replace paperclip with globe/database citation source icons"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: all tests pass.

- [ ] **Step 2: Full manual walkthrough**

Run `npm run errorfreedev`. Test these flows:

1. **Empty board:** Resources button badge shows 0. Click it → sidebar opens → "No resources yet" message.
2. **Add resource:** Click ✦ on a text element with goal keywords → Find resources → modal opens → hover a resource card → PathwayOverlay appears on canvas behind modal → click Add to board → modal closes, badge increments.
3. **Board sidebar highlight:** Click Resources button → sidebar lists the added resource → hover a row → its steps glow gold → mouse leave clears glow.
4. **Citation icons (local):** The pathway steps added in step 2 should show 🗄️ if local source. Click it → dropdown shows source title.
5. **Ask about this:** Click ✦ → Ask about this → submit query → sub-steps appear. If worker is updated (Task 11), sub-steps show 🌐. If not, no citation buttons — that is expected until the worker is deployed.
6. **Legacy backward compat:** Any element with old string citations shows 🗄️ database button.

- [ ] **Step 3: Commit if any minor fixes were made during manual testing**

---

## Task 11: Worker — add return_citations + searchResults passthrough (external)

> **Note:** This task modifies `workers/getPathway.js` in the Cloudflare Worker deployment repository, which is separate from this repo. The worker URL is `https://project-rebound-getpathway.sabavatakshat.workers.dev`. Locate the worker source before starting this task.

**Files:**
- Modify: `workers/getPathway.js` (external repo)

- [ ] **Step 1: Find the callSubSteps function**

Open `workers/getPathway.js`. Locate the `callSubSteps` function. Find:
1. The `fetch('https://api.perplexity.ai/chat/completions', ...)` call and its request body.
2. The line `const data = await response.json()` (the raw Perplexity response object).
3. The `return { steps }` or `return { steps: ... }` at the end of the function.

- [ ] **Step 2: Add return_citations to the Perplexity request body**

Inside the `JSON.stringify(...)` body of the fetch call, add `return_citations: true` after `max_tokens`:

```js
body: JSON.stringify({
  model: 'sonar',
  messages: [...],
  max_tokens: 600,
  return_citations: true,   // ← add this line
}),
```

Skip this step if `return_citations: true` is already present.

- [ ] **Step 3: Add searchResults to the return value**

Change the return statement from:

```js
return { steps };
```

To:

```js
return { steps, searchResults: data.search_results ?? [] };
```

`data` is the raw `await response.json()` object. `data.search_results` is an array of `{ title, url, date }` objects returned by Perplexity when `return_citations: true` is set.

- [ ] **Step 4: Verify the /substeps handler passes searchResults through**

Find the `/substeps` route handler. If it does `JSON.stringify(result)` where `result` is the `callSubSteps` return value, no change needed — `searchResults` propagates automatically.

If it destructures like `const { steps } = await callSubSteps(...)`, update to:
```js
const { steps, searchResults } = await callSubSteps(...);
return new Response(JSON.stringify({ steps, searchResults }), { ... });
```

- [ ] **Step 5: Deploy the worker**

```bash
wrangler deploy
```

- [ ] **Step 6: Test the full citation flow end to end**

In the running app, click ✦ → Ask about this on a canvas element → submit a query. The sub-step elements appear. Click ✦ on a sub-step — the 🌐 globe button should now appear (if Perplexity returned search results for that query). Click the globe button → dropdown shows source titles and dates.
