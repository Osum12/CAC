# Claude Code Project Instructions

Use the repository instructions as the source of truth. Before making changes, read `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, and the task file assigned to this session.

This is a **demo-first Congressional App Challenge prototype**. The goal is a functional, honest interactive demonstration using a small dataset—not a production-grade civic platform.

Follow the same rules as `AGENTS.md`:
- Inspect the repository and existing stack before editing; preserve its conventions.
- Work only in the assigned scope and task-owned files.
- Consume Meeting/Issue/Document records through the shared data service.
- Do not independently alter shared data contracts, service APIs, router/configuration, global styling, or dependencies without the project lead's approval.
- Keep current JSON records marked as mock and visibly identify them in the UI. Do not invent or misrepresent official civic facts, source URLs, statuses, or coordinates.
- Handle null links, missing relationships, missing locations, empty states, and errors.
- Do not build live scraping, full-meeting transcription, a production backend, auth, or real notifications unless the lead explicitly changes the scope.
- Do not deploy or merge to `main` without explicit direction.
- Run only the real scripts present in the repository; report what passed, failed, or was not run.

Before coding, summarize a short plan. At completion, report changed files, what works, checks performed and results, known limitations, and any decision needed from the project lead. See `docs/BRANCH_WORKFLOW.md` for branch/worktree guidance.
