# Claude Code Project Instructions

Use the repository instructions as the source of truth. Before making changes, read `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, and the task file assigned to this session.

This is a **Congressional App Challenge prototype**. The goal is a functional, honest interactive demonstration—not a production-grade civic platform. `data/` holds real Fulton County Board of Commissioners records (51 meetings, 1,303 issues, 4,098 documents, January 8, 2025 to October 21, 2026), built by `scripts/fulton-records/` (see `docs/PIPELINE_ARCHITECTURE.md`).

Follow the same rules as `AGENTS.md`:
- Inspect the repository and existing stack before editing; preserve its conventions.
- Work only in the assigned scope and task-owned files.
- Consume Meeting/Issue/Document records through the shared data service.
- Do not independently alter shared data contracts, service APIs, router/configuration, global styling, or dependencies without the project lead's approval.
- The fictional fixtures in `src/test/fixtures/` are for tests only and must stay marked as mock (`dataMode: "mock"`, `mockOnly: true`); any mock record shown in the UI must be visibly identified. Do not invent or misrepresent official civic facts, source URLs, statuses, or coordinates.
- Handle null links, missing relationships, missing locations, empty states, and errors.
- Do not build live scraping, full-meeting transcription, a production backend, auth, or real notifications unless the lead explicitly changes the scope.
- Do not deploy or merge to `main` without explicit direction. (`integration` was merged to `main` on 2026-10-25.)
- Run only the real scripts present in the repository; report what passed, failed, or was not run.

Before coding, summarize a short plan. At completion, report changed files, what works, checks performed and results, known limitations, and any decision needed from the project lead. See `docs/BRANCH_WORKFLOW.md` for branch/worktree guidance.
