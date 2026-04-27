# Simulation History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a main-page history panel that lists previous simulations and lets the user reopen completed, failed, or still-running scenarios.

**Architecture:** Add a compact history listing endpoint backed by `mirofish_scenarios`, a small normalization helper for history rows, and a dedicated `ScenarioHistory` UI component. Keep ownership of history fetching, selection, and active scenario polling in `app/page.tsx` so the existing detail flow remains the single source of truth.

**Tech Stack:** Next.js App Router, React client components, Supabase admin client, existing simulation contract helpers, Node `node:test` regression tests.

---

### Task 1: Add History Types And Normalization Helper

**Files:**
- Create: `lib/simulation-history.ts`
- Modify: `types/simulation.ts`
- Test: `tests/simulation-history.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests covering compact history extraction from a completed row, an in-progress row, and a stale/failed row.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/simulation-history.test.ts`
Expected: FAIL because `lib/simulation-history.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a `SimulationHistoryItem` type and a helper that converts raw scenario rows into a compact display shape with counts, summary excerpt, and workflow/progress metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/simulation-history.test.ts`
Expected: PASS

### Task 2: Add History API Endpoint

**Files:**
- Create: `app/api/simulate/history/route.ts`
- Modify: `lib/simulation-history.ts`
- Test: `tests/simulation-history.test.ts`

- [ ] **Step 1: Extend failing tests**

Add a helper-level assertion for the response shape expected by the history endpoint so the list contract is explicit.

- [ ] **Step 2: Run tests to verify the new assertion fails**

Run: `node --test tests/simulation-history.test.ts`
Expected: FAIL on missing response-normalization support.

- [ ] **Step 3: Write minimal implementation**

Create `GET /api/simulate/history` returning recent `mirofish_scenarios` rows ordered by `updated_at DESC`, with compact fields only.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/simulation-history.test.ts`
Expected: PASS

### Task 3: Build The History Panel Component

**Files:**
- Create: `components/ScenarioHistory.tsx`
- Modify: `types/simulation.ts`

- [ ] **Step 1: Implement a focused presentational component**

Render loading, empty, error, and populated history states. Include active-row highlighting and a click callback.

- [ ] **Step 2: Keep the component stateless**

Accept props for items, current scenario id, selection callback, loading, and error. Do not fetch inside the component.

### Task 4: Wire History Into The Main Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/Header.tsx` only if small navigation polish is needed
- Use: `components/ScenarioHistory.tsx`

- [ ] **Step 1: Add page state**

Track history items, loading state, and a compact history error string in `app/page.tsx`.

- [ ] **Step 2: Fetch history on page load**

Load `GET /api/simulate/history` on mount without blocking the rest of the page.

- [ ] **Step 3: Update history on new submissions and poll progress**

Insert the new scenario at the top immediately, then update the matching item as polling changes its state.

- [ ] **Step 4: Add selection behavior**

When a history item is clicked, fetch `GET /api/simulate?id=<id>`, normalize it with the existing scenario contract helper, and load it into the current detail view.

- [ ] **Step 5: Resume polling for running selections**

If a selected history item is still running, keep using the existing poll loop instead of creating a second live-update path.

### Task 5: Verify And Polish

**Files:**
- Test: `tests/simulation-history.test.ts`
- Test: `tests/simulation-contract.test.ts`
- Verify: `app/page.tsx`, `components/ScenarioHistory.tsx`

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/simulation-history.test.ts tests/simulation-contract.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Deploy**

Run: `vercel --prod --yes`
Expected: production deployment succeeds and the history panel is live.

## Self-Review

- Spec coverage: covered history API, main-page panel, selection behavior, compact row contract, and reuse of existing detail flow.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: the plan uses one compact `SimulationHistoryItem` type, one new API route, and keeps full detail loading on the existing `/api/simulate?id=...` contract.
