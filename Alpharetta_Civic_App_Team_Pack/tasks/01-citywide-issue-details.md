# Task Brief 01 — Citywide + Issue Details

**Owner:** Project lead  
**Branch:** `feature/citywide` from the latest `integration`, after foundation is merged  
**Read first:** `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, `docs/BRANCH_WORKFLOW.md`

## Goal

Implement the Citywide dashboard and issue-detail journey on top of the shared foundation.

## In scope

- Dashboard shows meeting cards and featured issue cards from the shared data service.
- Issue cards navigate to the correct issue detail by stable ID.
- Issue detail shows title, summary, category, normalized status, available location, related meeting/document links, and source state.
- Mock-only records are visibly marked using the shared mock-data indicator.
- Status values come from data, including `unknown`; do not imply an issue was approved without source evidence.
- Handle empty lists, missing related IDs, null URLs, and null locations.

## Out of scope

Near Me map/ranking, Archive filter implementation, backend, live city-data ingestion, automated transcription, accounts, and notifications.

## Ownership guardrails

Own Citywide and issue-detail pages/components. Use the shared service and router. Do not redefine types, data methods, global navigation, or fixture data without coordination.

## Acceptance criteria

- Dashboard and issue details use the shared data service, not local hardcoded arrays.
- Clicking an issue card opens the correct issue.
- Related meeting/document navigation resolves by ID.
- Mock data is visibly identified; no fake official URL appears.
- Missing and unknown data does not crash the page.
- The actual available build/lint/test scripts pass, or failures are clearly reported.

## Required handoff

Report changed files, route names, service methods used, checks and results, known gaps, and any integration help needed.
