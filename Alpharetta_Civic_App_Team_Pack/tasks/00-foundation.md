# Task Brief 00 — Shared Foundation

**Owner:** Project lead  
**Branch:** `feature/foundation` from `integration`; if `integration` does not exist, create it from the current stable branch first (do not commit feature work directly to `main`)  
**Read first:** `AGENTS.md`, `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, `docs/BRANCH_WORKFLOW.md`

## Goal

Create the minimum stable foundation so all feature owners can work in parallel against the same routes, record types, fixture data, and data-access methods. Do not build the full product in this task.

## Tasks

1. Inspect repository state, current framework, package scripts, routes, UI conventions, and the existing git branch. Preserve the existing stack.
2. Confirm/establish the app shell and primary navigation placeholders for Citywide, Near Me, and Archive.
3. Place the supplied `meetings.json`, `issues.json`, and `documents.json` in one agreed location; preserve the existing record fields/relationships.
4. Define/validate shared types against `docs/DATA_CONTRACT.md` and the actual fixtures.
5. Build the shared data-access module with list, ID lookup, and basic relationship methods needed by the app.
6. Add a shared mock-data indicator that feature pages can reuse.
7. Handle basic missing data and invalid/missing relationship cases at the service boundary where practical.
8. Run the actual scripts available in the repository; report anything not run.
9. Commit to `feature/foundation` and merge it into `integration`. Publish a short handoff before others start.

## Out of scope

Full Citywide UI, Near Me matching/map behavior, Archive filters/detail UI, live data ingestion, backend/database setup, authentication, notifications, and automated meeting transcription.

## Acceptance criteria

- App starts with the documented command for the existing project.
- Shared types/services compile and use the supplied fixture fields.
- Data service can list records and look up a record by ID.
- There is one consistent definition for Meeting, Issue, and Document.
- Mock labels can be reused by all feature pages.
- Placeholder routes render without error.
- Foundation is merged into `integration` before feature owners start their branches.

## Required handoff

Report the actual stack, files changed, route names, type/service names, scripts run and results, known gaps, and the exact integration commit on which feature branches should be based.
