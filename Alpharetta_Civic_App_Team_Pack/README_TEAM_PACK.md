# Team Implementation Pack

This folder is intended to be copied into the root of the shared GitHub repository. It contains the product PRD, the team implementation PRD, data contracts, work/branch guidance, per-feature task briefs, and the initial mock dataset.

## Suggested setup order

1. Extract the ZIP, then copy the pack contents into the existing repo root. Do not overwrite an existing framework setup or unrelated project files. If a PRD or data fixtures already exist, merge the instructions/requirements intentionally rather than blindly replacing them.
2. Have the project lead inspect the repository and confirm the stack and branch conventions.
3. Commit the documentation and mock fixture files.
4. Read `TEAM_IMPLEMENTATION_PRD.md` and `docs/DATA_CONTRACT.md` together.
5. If needed, create `integration` from the current stable branch. The lead completes `tasks/00-foundation.md` on `feature/foundation` and merges it to `integration` before feature branches split. Then the lead, Eshan, and Shalin use `tasks/01-citywide-issue-details.md`, `tasks/02-near-me.md`, and `tasks/03-archive.md` respectively.
6. Each owner works from the applicable task file.

## What each person should read

`TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md` and the assigned task file. Inspect the actual repository and stack before coding.

## Mock data warning

The original synthetic records from this pack now live in `src/test/fixtures/` (`mock-meetings.json`, `mock-issues.json`, `mock-documents.json`) and are used only by the automated tests. They must not be presented as real civic information.

`data/` no longer holds mock data. Since 2026-10-24 it holds real, source-linked records: every substantive Fulton County Board of Commissioners agenda item from 51 meetings between January 8, 2025 and October 21, 2026 (1,303 issues, 4,098 documents, 47 recordings), taken from the county's Legistar system. They are a snapshot, not live. See `data/README.md` for how they were built and checked.
