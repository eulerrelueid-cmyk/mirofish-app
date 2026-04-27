# Simulation History Design

## Goal

Add a first-pass history feature so users can reopen previous simulations from the main app without changing the existing simulation detail experience.

## User Experience

The main page keeps its current structure and gains a `Previous simulations` panel near the current scenario/session area.

Each history item shows:
- Scenario title
- Current status
- Last updated time
- Compact result snapshot when available
  - agent count
  - post count
  - round count
  - short summary excerpt

Clicking a history item loads that simulation into the existing feed, network, timeline, stats, and results sections.

If the selected simulation is still running, the page resumes polling for that scenario and keeps the existing live-progress behavior.

## Scope

Included in this pass:
- Scenario history list on the main page
- API endpoint to list recent scenarios
- Ability to load a selected scenario into the current page
- Reuse of existing `GET /api/simulate?id=...` for full scenario detail

Explicitly out of scope:
- Search
- Filters
- Pagination
- Delete or rename actions
- Dedicated scenario detail route
- Auth or per-user access model changes

## Data Contract

Add a new API endpoint:

- `GET /api/simulate/history`

Response should return recent scenarios ordered by `updated_at DESC`.

Each item should include:
- `id`
- `title`
- `description`
- `status`
- `created_at`
- `updated_at`
- `workflowRunId`
- `mockMode`
- `progress`
- `error`
- compact counts when final results exist
  - `agents`
  - `posts`
  - `events`
  - `rounds`
- `summary` excerpt when final results exist

This endpoint is for the history panel only. It should not return the full agents/posts/events payload.

## Frontend Behavior

On page load:
- fetch scenario history
- render the list in a dedicated panel

On new simulation creation:
- optimistically insert the new scenario at the top of history

On poll updates:
- update both `currentScenario` and the matching history item

On history item click:
- fetch `GET /api/simulate?id=<scenarioId>`
- normalize the response using the existing scenario contract helpers
- set `currentScenario`
- if the loaded scenario is `running`, continue polling from that scenario

## Component Structure

Add a new presentational component for the history panel rather than embedding the full list directly into `app/page.tsx`.

Proposed component:
- `components/ScenarioHistory.tsx`

Responsibilities:
- render the history list
- highlight the active scenario
- expose selection callback
- show loading, empty, and compact failure states

Keep data fetching and selection state in `app/page.tsx` to avoid splitting current page state across multiple owners.

## Types

Add a lightweight history type in `types/simulation.ts`.

Suggested shape:
- `SimulationHistoryItem`

This should model the compact list response, separate from the full `SimulationScenario` shape.

## Error Handling

History list fetch failures should:
- not block the rest of the page
- show a compact non-fatal error in the history panel

Scenario selection failures should:
- keep the current selected scenario unchanged
- surface a clear load error message

Stale running scenarios should continue using the existing stale/failure detection logic in the scenario detail fetch path.

## Testing

Add focused regression coverage for:
- history item normalization from API payload
- loading a running scenario from history resumes polling
- loading a completed scenario from history shows persisted results
- stale or failed scenarios remain visible in history

## Implementation Plan

1. Add compact history types and normalization helpers.
2. Add `GET /api/simulate/history`.
3. Build `ScenarioHistory` component.
4. Wire history fetch, selection, and in-memory updates into `app/page.tsx`.
5. Add regression tests for history normalization and selection behavior.
6. Run build verification and deploy.

## Self-Review

- No placeholders remain.
- Scope is limited to a single-page history panel.
- The data contract is separate for history and full scenario detail.
- The design reuses the existing scenario detail route and polling model instead of introducing a second detail architecture.
