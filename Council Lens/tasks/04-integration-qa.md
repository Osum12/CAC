# Task Brief 04 — Integration + Demo QA

**Owner:** Project lead, with support from all feature owners  
**Branch:** `integration`; use short-lived fix branches if needed  
**Read first:** `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, `docs/BRANCH_WORKFLOW.md`

## Goal

Assemble the independently built features into one repeatable demo and prevent mock/curated data, links, statuses, or navigation from becoming inconsistent.

## Smoke-test path

1. Launch from the documented start command.
2. Open Citywide and verify it shows shared fixture records.
3. Open an issue and navigate to its meeting/document references.
4. Open Near Me using the preset demo location; test feed selection and map marker behavior.
5. Open Archive, use each available record-type filter, and open a meeting detail.
6. Follow related issue/document links and return to the previous route.
7. Test a record with no location and records with null URLs.
8. Test empty results/search and narrow viewport behavior.
9. Inspect console/build output and fix P0 errors.
10. Verify the final demo clearly distinguishes mock content from verified source-backed content.

## Merge / release gates

- Each feature merged to `integration` one at a time.
- Run repository build/lint/test scripts after each merge and before release.
- No unresolved P0 breakage on primary demo flow.
- Do not merge to `main` until all required P0 checks pass.
- Document known non-blocking P1/P2 gaps accurately.

## Required final report

- Build/lint/test commands and results.
- Demo smoke-test checklist outcome.
- Known limitations and what is simulated/mock.
- Exact branch/commit used for the final demo.
