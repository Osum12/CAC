# Alpharetta Civic App — Team Implementation PRD

**Version:** 1.0  
**Purpose:** Repository context and execution contract for the student team and AI coding agents  
**Project mode:** CAC demonstrator / prototype, not a production civic platform  
**Geographic scope:** Alpharetta, Georgia only  
**Status:** Working implementation baseline; the project lead may revise it

> **Read this first:** This document coordinates implementation. `PRODUCT_PRD.md` defines what the product should do. `docs/DATA_CONTRACT.md` defines how data is represented. `AGENTS.md` and `CLAUDE.md` tell coding agents how to work in this repo. Read the task file for the feature you have been assigned before changing code.

## 1. Purpose and product target

Build a polished, interactive, repeatable demonstration of an Alpharetta civic information app. The user should be able to browse citywide civic activity, explore locally relevant issues using a demo location, and navigate a curated archive of meeting records and documents.

The project is intentionally **demo-first**. It must not attempt to become a complete civic data platform before the CAC submission. Build the P0 workflows against the supplied local JSON fixtures, keep the records replaceable, and defer automation that is not required to demonstrate the user experience.

The goal is not to fake the existence of a live service. It is to make the prototype experience function end-to-end while clearly distinguishing mock data, curated real records, and any genuinely live integration.

## 2. Source-of-truth hierarchy

When instructions conflict, use this order:

1. A direct, explicit instruction from the project lead.
2. `TEAM_IMPLEMENTATION_PRD.md` for role ownership, integration rules, and development workflow.
3. `PRODUCT_PRD.md` for product scope and user experience.
4. `docs/DATA_CONTRACT.md` and the existing JSON fixtures for record shapes and relationships.
5. Existing code conventions, then the team's agreed framework/lint/test configuration.

Do not infer that a feature should be added simply because it would be impressive. The deadline and demo scope take priority over speculative production architecture.

## 3. Team roles and ownership

Assignments below are the proposed baseline. The project lead can reassign tasks without changing the product goal. One person owns each area; others can review but should not make overlapping edits independently.

| Owner | Primary responsibility | Owns | Must coordinate before changing |
|---|---|---|---|
| Project lead (you) | Architecture, foundation, Citywide, issue details, integration, source-data QA | App shell, routes, shared types, data service/repository, Citywide page, issue detail page, integration branch, release to `main` | Shared types, package/config files, routing, common design tokens, root instructions |
| Eshan | Near Me experience | Address/preset-location UI, issue feed, map shell/markers, selected-issue interactions, relevance explanation UI | Shared types, data service, map dependencies, app routing, global styling/config |
| Shalin | Archive and meeting records | Archive page, record-type filters, meeting detail page, related record navigation, missing-link states | Shared types, data service, app routing, global styling/config |
| Whole team | Demo readiness | Smoke tests, broken-link checks, responsive review, practice run, bug reports | Any change spanning more than one owned feature |

### Ownership rule

The owner may change files in their assigned feature area. Shared files are not “free for all.” If a feature appears to require a shared-file change, open a short proposal or tell the project lead before editing it. Do not independently rename fields, routes, IDs, or service methods.

## 4. Version 1 scope

### P0 — required for the demo

- Primary navigation: Citywide, Near Me, Archive.
- Citywide dashboard reading from the shared data service.
- Reusable meeting, issue, and document cards/components where appropriate.
- Issue detail pages that show summary, status, location if available, and related sources.
- Meeting detail pages and Archive browsing.
- Working navigation among related meetings, issues, and documents.
- Archive record-type filters for available videos, agendas, and documents (records without playable video/URL should show a safe unavailable state rather than a dead link).
- Near Me feed using the local issue fixtures and a preset demo location. Address entry may be UI-only if actual geocoding is not integrated.
- Map markers only for records with coordinates; fixture coordinates must be visibly identified as mock.
- Loading, empty, error, missing-source, and missing-location states.
- A persistent visible marker for records in `dataMode: "mock"` or `mockOnly: true` in development/demo builds.
- No made-up official URLs, real-world claims, approvals, meeting titles, or addresses.

### P1 — implement only after P0 works

- Search across available local meeting, issue, and document fields.
- Topic/date filtering beyond the basic Archive record-type filter.
- Feed/map selection synchronization.
- Small polish improvements that do not risk integration.

### P2 / future — explicitly out of scope for this submission unless the lead approves

- Scraping/syncing all city records automatically.
- Automated transcription or summarization of every full-length meeting.
- Real-time monitoring, live meeting-running-late detection, or push notifications.
- Production accounts, profile sync, or large backend/database infrastructure.
- Precise parcel-level impact claims or legal/land-use predictions.
- Multiple municipalities.
- An answer bot that responds without evidence from selected records.

## 5. Technical strategy and boundaries

### Architecture principle

Use the project's existing stack if it is already configured. Do not replace a working framework, build tool, router, styling system, or test setup without explicit approval. If the repository is empty or the stack is genuinely undecided, the project lead chooses the stack before independent feature work begins.

The intended dependency direction is:

`Page / component -> civic data service -> local JSON fixtures`

Later, the service can be backed by a real data adapter without rewriting every page. For this demo, a local JSON-backed service is enough. Do not add a backend, database, geocoding API, auth system, or paid service merely to make the architecture appear more complete.

### Expected responsibility boundaries

- **Pages/components:** render and interact with data; do not each import JSON fixtures independently.
- **Data service/repository:** centralize loading, filtering, ID lookup, and relationships.
- **Types/contracts:** define one shared Meeting, Issue, and Document model.
- **Fixture files:** keep mock content separate from UI source code.
- **Source content:** mock until replaced with records actually checked against original city sources.
- **Map behavior:** only map coordinates included in a record; if coordinates are null, do not invent a marker.

### Suggested repository structure

Adapt these paths to the existing framework rather than forcing this exact tree if the project already has conventions.

```text
/
  AGENTS.md
  CLAUDE.md
  TEAM_IMPLEMENTATION_PRD.md
  PRODUCT_PRD.md
  docs/
    DATA_CONTRACT.md
    BRANCH_WORKFLOW.md
  tasks/
    00-foundation.md
    01-citywide-issue-details.md
    02-near-me.md
    03-archive.md
    04-integration-qa.md
  data/
    meetings.json
    issues.json
    documents.json
  src/
    components/
    pages-or-routes/
    services/
    types/
  .github/
    PULL_REQUEST_TEMPLATE.md
```

## 6. Data contract and integrity

`docs/DATA_CONTRACT.md` is the common contract. The current mock fixtures in `data/` are the concrete reference for the existing field names. Do not independently redesign those records in individual feature branches.

- Meetings reference their related documents and issues by stable IDs.
- Issues reference their meetings and documents by stable IDs.
- Documents reference meetings/issues by stable IDs.
- Relationship IDs must resolve, or the UI must safely handle a missing related record.
- URLs may be `null`. Never render a null URL as a working link.
- Issue status must be one of the agreed values. Use `unknown` where evidence is insufficient.
- Location may be `null`. Do not create location data just to make a map look populated.
- Preserve `dataMode` and `mockOnly` semantics.
- `dataMode: "mock"` or `mockOnly: true` means the content is fictional test data; it must not be shown as official civic information.
- Curated real data can be marked as curated only after the underlying official record has been inspected and its source URL recorded. Keep the verification date when available.

### Mock data in the CAC demo

During development, mock data must be visible as mock data. For a final presentation, replace the records that are used to make factual claims with verified, source-linked records where feasible. A curated subset of real records is fine; complete citywide coverage is not required. Never imply that the Archive is exhaustive or auto-synchronized if it is not.

## 7. Work sequence and dependencies

### Phase 0 — Foundation (project lead; blocks feature branches; branch: `feature/foundation`)

1. Inspect the repository and identify the actual stack, scripts, routes, conventions, and current state.
2. Confirm/establish the app shell and primary navigation.
3. Copy/retain the three JSON fixture files in a single agreed data directory.
4. Define or validate shared types against `docs/DATA_CONTRACT.md` and fixtures.
5. Build the data service/repository with basic list and ID-lookup methods.
6. Add a small mock-data label/badge convention that feature pages can reuse.
7. Commit this foundation and merge it to `integration`.
8. Only then ask other owners to branch from the latest `integration` commit.

### Phase 1 — Parallel feature work

- Project lead: branch `feature/citywide` from updated `integration`; implement the Citywide dashboard and issue detail pages, then coordinate integration.
- Eshan: Near Me feed/map/location interactions.
- Shalin: Archive and meeting details.

Each feature should read the same service and record types. Work on separate branches or worktrees so agents do not edit the same working directory concurrently.

### Phase 2 — Integration

1. Merge one feature branch to `integration` at a time.
2. Run the repository's actual lint/build/test scripts after each merge.
3. Test cross-page navigation and shared data relationships.
4. Fix P0 issues before adding P1 polish.
5. Test the demo path from a fresh app start.
6. Merge the verified release from `integration` to `main`.

## 8. Git and parallel-agent workflow

### Branches

- `main`: stable, tested demo/release branch. No direct feature work.
- `integration`: temporary shared branch for assembling the features.
- `feature/foundation`: project lead's initial app shell, shared types, data service, and fixtures.
- `feature/citywide`: project lead's Citywide/issue-detail implementation, branched from updated `integration`.
- `feature/near-me`: Eshan's Near Me feature.
- `feature/archive`: Shalin's Archive/meeting-detail feature.
- `fix/<short-description>`: small targeted fixes.

Use the current agreed branch names if the repository already has an established naming system. Do not rewrite history on a shared branch or force-push unless the project lead explicitly approves it.

### Merge rules

1. Start feature branches from the latest `integration` after foundation is merged. The lead’s foundation branch is `feature/foundation`; the lead’s separate UI branch is `feature/citywide`.
2. Keep commits narrow and descriptive.
3. Push and open a PR to `integration`; do not merge unreviewed feature work directly to `main`.
4. Before merge, report files changed, behavior implemented, checks run, and anything incomplete.
5. Resolve merge conflicts with the file owner; don't silently choose one implementation if behavior may change.
6. After every merge, run the available checks and smoke-test affected routes.
7. Merge `integration` to `main` only after the whole P0 demo works.

### Worktrees / parallel compute

A Git branch is the logical line of work; a worktree is a separate working directory for a branch. On one machine, give each concurrent Codex/Claude agent its own worktree and branch. If teammates use separate computers/clones, a worktree is optional. Never let multiple agents modify the same physical working directory at the same time. Do not run multiple agents on the same shared files unless that work is explicitly coordinated.

## 9. Feature acceptance criteria

### Citywide and issue details — project lead

- Dashboard shows records from the shared service rather than hand-written per-page arrays.
- Issue cards open the correct issue detail by stable ID.
- Issue details render summary, status, associated meeting/document links, source state, and optional location.
- Status and mock labels are derived from data fields, not manually overridden to look more convincing.
- Missing IDs, null URLs, empty collections, and unknown status do not crash the app.

### Near Me — Eshan

- A user can reach Near Me without sharing an address; a preset demo location can be used for the prepared journey.
- Issue feed is driven by the shared issue data service.
- Map markers only render when the location has valid coordinates.
- Mock markers and mock issue records remain visibly identified as sample data.
- Selecting an issue leads to its real detail route/ID. If P1 synchronization is added, feed and marker selection stay synchronized.
- The UI distinguishes proximity from potential impact; do not claim an issue affects an address without supporting data.
- Invalid/unsupported address input gives a useful message instead of false matching.

### Archive and meeting details — Shalin

- Archive lists meetings and documents drawn from the shared service.
- Basic record-type filters function on the loaded data.
- Meeting detail shows meeting metadata, available official/recording links, agenda/supporting documents, and related issues.
- Null links show unavailable/not provided states and never create dead actions.
- Clicking a related issue/document opens the correct internal page or valid external source.
- Search is P1 and must not delay P0 browsing/relationships.

### Integration — whole team, coordinated by lead

- Main navigation routes correctly.
- Related IDs are consistent across the three JSON files.
- No console errors on the primary demo journey.
- Layout remains usable at desktop width and a narrow mobile width.
- The app survives empty lists and records with missing links/locations.
- Build/lint/tests pass where scripts exist. If no automated tests exist, use a documented manual smoke test.

## 10. Definition of done for each task

A task is done only when all relevant points below are true:

- The implementation stays inside its assigned scope unless the lead approved a change.
- Shared types and service methods are reused; no parallel schema is invented.
- Mock data remains explicitly marked; no fictional item is described as a real Alpharetta record.
- The target pages render and work with the supplied fixtures.
- Empty/missing/error states are handled where applicable.
- The actual repository lint/build/test commands are run and results reported accurately.
- No secrets, personal addresses, or API keys are committed.
- The branch can be reviewed and merged without depending on undocumented local edits.
- The owner provides a short handoff: changed files, behavior, verification performed, known limitations, and next step.

## 11. AI coding-agent operating rules

Every Codex/Claude session must:

1. Read the root instructions (`AGENTS.md` for Codex-compatible tools; `CLAUDE.md` for Claude Code), this PRD, `PRODUCT_PRD.md`, the data contract, and the assigned task file.
2. Inspect the repository before editing. Do not assume a framework, file tree, script name, or route convention that is not present.
3. State its short plan, then implement only the assigned task.
4. Prefer small changes and use the project's existing libraries and patterns.
5. Avoid changing shared types, services, router/configuration, package dependencies, and global styles unless the assignment requires it and the lead approves.
6. Never invent official civic facts, real source URLs, approvals, coordinates, or data provenance.
7. Never describe mock/simulated functionality as live or automated.
8. Run available checks and distinguish “passed,” “failed,” and “not run.” Never claim a test was run when it was not.
9. Summarize changed files, manual steps needed, known issues, and what the next agent needs to know.
10. Do not deploy, publish, alter secrets, rewrite shared history, or merge to `main` unless explicitly asked by the project lead.

Agents should not run broad formatting or rewrite unrelated files. Do not add new dependencies before checking if existing packages cover the need. If blocked by a missing shared contract or ambiguous product decision, report the smallest specific blocker rather than making a large unilateral choice.

## 12. Demo presentation integrity

The demonstrator may use prepared content and local JSON fixtures. For the Congressional App Challenge presentation, describe what genuinely works and what remains planned accurately. Do not call mocked source ingestion “live ingestion,” prepared summaries “automatic AI analysis,” sample map markers real projects, or a selected set of records a complete official archive. Use source-linked, verified records for factual claims in the submitted demo wherever feasible.

## 13. Final demo checklist

- [ ] A fresh start works from the documented setup steps, and Citywide shows the selected records.
- [ ] Issue detail pages open correctly, and related meeting/document links resolve.
- [ ] Near Me works with the preset demo location; the feed renders and only records with coordinates create mock-labeled map markers.
- [ ] Archive filters work; missing links, empty states, and unavailable records behave safely.
- [ ] Mock-only records are clearly identified or replaced by source-verified, curated records for factual claims.
- [ ] No dead buttons, broken routes, or console errors appear on the demo path; desktop and narrow-mobile layouts are usable; the team can accurately explain mock vs. curated/live behavior, verify factual sources/statuses, and identify the tested release commit.
