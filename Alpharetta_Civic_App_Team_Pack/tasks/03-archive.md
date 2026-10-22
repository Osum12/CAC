# Task Brief 03 — Archive + Meeting Details

**Owner:** Shalin  
**Branch:** `feature/archive` from latest `integration`, after foundation merge  
**Read first:** `AGENTS.md`, `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, `docs/BRANCH_WORKFLOW.md`

## Goal

Build the Archive so users can browse the selected meeting/document dataset, filter by record type, and move among meeting details, related issues, and documents.

## In scope

- Archive page reachable from primary navigation.
- Unified list of meetings and documents available in the shared service.
- Basic record-type filters: All, Videos, Agendas, Documents (map current document types into these display groups without changing source data).
- Search only after browse/filter behavior is functional and time remains.
- Meeting detail by stable ID: title, type, date/time when present, summary, official-page/recording actions when URLs exist, agenda/supporting documents, related issues.
- Related record links use the shared IDs and app routes.
- Missing URLs show a safe unavailable/not-provided state; no active dead links.
- Mock-data labels are visible on mock records.
- Responsive list/detail states.

## Out of scope

Complete official archive ingestion, video scraping/downloading, automatic transcripts, real-time synchronization, new backend, changing shared schemas, or building a second data access layer.

## File ownership

Own Archive and meeting-detail pages/components. Consume the shared meeting/issue/document services. Do not edit core services/types, global navigation, or fixture relationships without coordination.

## Acceptance criteria

- Archive renders records from the shared service.
- Type filters update the visible records correctly.
- Meeting detail opens by ID and shows available linked records.
- Related issue/document navigation is correct.
- Null URLs do not render as clickable actions.
- Empty/no-result states are understandable.
- Run available checks and report results accurately.

## Required handoff

Report files changed, supported filters, route names, relationship behavior, checks run, limitations, and any shared-file request to the lead.
