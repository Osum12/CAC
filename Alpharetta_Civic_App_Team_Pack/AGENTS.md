# Instructions for AI Coding Agents (Codex-compatible)

Before editing anything, read:
1. `TEAM_IMPLEMENTATION_PRD.md`
2. `PRODUCT_PRD.md`
3. `docs/DATA_CONTRACT.md`
4. The specific task file assigned to this branch/session

## Non-negotiable rules

- This repository builds a CAC prototype, not a fully automated production civic service.
- Use the existing framework, package scripts, router, styling, and code conventions. Inspect before assuming.
- Work only on the assigned task and owned files. Do not silently modify other feature areas.
- Do not independently change the Meeting/Issue/Document schema, route structure, global configuration, or service API. Ask the project lead before a cross-cutting change.
- Pages consume the shared data service; do not import the JSON fixture files in multiple pages.
- `data/` holds real Fulton County Board of Commissioners records (51 meetings, 1,303 issues, 4,098 documents, January 8, 2025 to October 21, 2026; `dataMode: "curated"`, `mockOnly: false`), built by `scripts/fulton-records/` (see `docs/PIPELINE_ARCHITECTURE.md`). The fictional fixtures live in `src/test/fixtures/`, are used only by tests, and must stay labeled `dataMode: "mock"` / `mockOnly: true`; any mock record shown in the UI must be visibly labeled.
- Never invent official records, URLs, statuses, coordinates, or evidence.
- Never present prepared/mock behavior as a live connection or automatic process.
- Handle null URLs, missing relations, missing location, empty results, and errors gracefully.
- Do not add backend, auth, database, scraping, full-meeting transcription, or notification services unless the project lead explicitly changes scope.
- Do not add a dependency without first checking the existing stack and explaining why it is needed.
- Do not deploy, publish, change secrets, force-push shared branches, or merge to `main` unless explicitly asked. (`integration` was merged to `main` on 2026-10-25.)

## Required workflow

1. Inspect repo state, current branch, existing routes/components, and available scripts.
2. Provide a brief plan.
3. Implement only the assigned feature with small, reviewable changes.
4. Run the actual available checks (build/lint/tests) and report each result accurately; if none exist, say so and provide manual verification.
5. Check the primary affected route and narrow-width layout when possible.
6. Return a handoff containing: summary, changed files, commands/checks and results, known limitations, and any lead decision required.

Read `docs/BRANCH_WORKFLOW.md` before creating branches/worktrees or integrating changes. The project lead owns integration and final release.
