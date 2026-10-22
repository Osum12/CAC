# Ready-to-Copy Team Kickoff Prompts

Use the appropriate prompt below in each person's own coding-agent session. Each agent must work on a separate branch/worktree or clone. Do not start the parallel feature branches until the project lead has merged `feature/foundation` to `integration`.

## 1. Project lead — foundation first

```text
You are helping build the Alpharetta Civic App, a demo-first Congressional App Challenge prototype. Read AGENTS.md, TEAM_IMPLEMENTATION_PRD.md, PRODUCT_PRD.md, docs/DATA_CONTRACT.md, docs/BRANCH_WORKFLOW.md, and tasks/00-foundation.md.

Work only on the shared foundation first. Inspect the existing repo and preserve its stack and conventions. Build the app shell/placeholder routes, shared Meeting/Issue/Document types, local JSON-backed data service, and reusable mock-data indicator. Do not implement all pages in this task. Do not add a backend or live ingestion. Keep all fixture rows explicitly marked as mock. If integration does not exist, create it from the current stable branch first; then use branch feature/foundation from integration. Run the real available checks, and report changed files, service/type names, commands/results, and the exact foundation commit. Do not merge to main.
```

After foundation is merged to `integration`, start a new session/branch for `tasks/01-citywide-issue-details.md`.

## 2. Eshan — Near Me

```text
You are responsible for the Near Me feature of the Alpharetta Civic App CAC demo. Do not start until the project lead confirms that the shared foundation is merged into integration. Read AGENTS.md, TEAM_IMPLEMENTATION_PRD.md, PRODUCT_PRD.md, docs/DATA_CONTRACT.md, docs/BRANCH_WORKFLOW.md, and tasks/02-near-me.md.

Branch from the latest integration commit as feature/near-me. Inspect the existing app and implement only the Near Me feed, preset demo-location/address UI, map markers for records that actually have coordinates, relevance explanations, and safe missing/invalid states. Use the shared service and types. Do not alter the core schema, service API, router, global config, or Archive/Citywide components without project-lead approval. The location data is mock; keep it visibly labeled and do not imply real geocoding or impact prediction. Run available checks and report changed files, functionality, test results, and limitations. Do not merge to main or deploy.
```

## 3. Shalin — Archive and meeting details

```text
You are responsible for the Archive and meeting-detail feature of the Alpharetta Civic App CAC demo. Do not start until the project lead confirms that the shared foundation is merged into integration. Read AGENTS.md, TEAM_IMPLEMENTATION_PRD.md, PRODUCT_PRD.md, docs/DATA_CONTRACT.md, docs/BRANCH_WORKFLOW.md, and tasks/03-archive.md.

Branch from the latest integration commit as feature/archive. Inspect the existing app and implement only Archive browsing, All/Videos/Agendas/Documents filters, meeting-detail views, and related issue/document navigation. Use the shared services and types. Do not alter the core schema, data service, router, global config, or Near Me/Citywide components without project-lead approval. All current JSON rows are fictional mock records. Null URLs must not become clickable dead links. Run available checks and report changed files, filters/routes, test results, and limitations. Do not merge to main or deploy.
```

## 4. Integration / QA — project lead

```text
Read AGENTS.md, TEAM_IMPLEMENTATION_PRD.md, PRODUCT_PRD.md, docs/DATA_CONTRACT.md, docs/BRANCH_WORKFLOW.md, and tasks/04-integration-qa.md. Inspect the repository and integrate one feature branch at a time into integration. After each merge, run the actual available build/lint/test scripts and smoke-test the affected routes. Resolve conflicts with the file owner; don't silently change product behavior. Check Citywide -> issue -> related meeting/document, Near Me feed/map, Archive filters/meeting details, null links/locations, empty states, mock labels, desktop/narrow widths, and console errors. Do not merge to main until P0 demo paths pass. Report checks and known limitations truthfully.
```
