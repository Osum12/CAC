# Copy/Paste Prompt Template for Codex or Claude

Use this after assigning a task and creating a dedicated branch/worktree. Fill in the task file path and branch name.

---

You are working in the Alpharetta Civic App repository for a Congressional App Challenge demo.

Before editing, read the root instructions for your tool (`AGENTS.md` for Codex-compatible tools or `CLAUDE.md` for Claude Code), then read `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, and `TASK_FILE_PATH`.

Your assigned task is only: `TASK_FILE_PATH`.
Your branch is: `BRANCH_NAME`.

First inspect the repository, current branch, existing framework/router/components, and available scripts. Give a short plan, then implement only the assigned scope. Do not change shared data types, service APIs, router/config, global styles, package dependencies, fixtures, or another feature's files unless the task requires it and the project lead approves. Reuse the shared data service; do not import fixture JSON independently across pages. Treat the current fixture records as fictional mock data and keep their mock markers visible. Never invent official civic records, source URLs, statuses, or coordinates, and do not describe mock/simulated functions as live.

Do not build production backend, scraping, auto-transcription, login, or real notification infrastructure unless the project lead explicitly changes scope.

Run the repository's actual available checks and report exactly which were passed, failed, or not run. At completion, provide: (1) summary, (2) changed files, (3) verification commands and results, (4) known limitations, (5) any shared-file/lead decision needed, and (6) a recommended commit message. Do not merge to `main` or deploy.

---
