# Task Brief 02 — Near Me Feed + Map

**Owner:** Eshan  
**Branch:** `feature/near-me` from latest `integration`, after foundation merge  
**Read first:** `AGENTS.md`, `TEAM_IMPLEMENTATION_PRD.md`, `PRODUCT_PRD.md`, `docs/DATA_CONTRACT.md`, `docs/BRANCH_WORKFLOW.md`

## Goal

Implement a polished Near Me experience using the shared Issue service and the existing fixture records. The initial experience is a demo location and local sample data, not production geocoding or a true impact-prediction engine.

## In scope

- Near Me page reachable from primary navigation.
- Optional address/location field with helpful validation states. If there is no geocoding integration, provide an explicitly labeled preset demo location; do not pretend an entered address was actually geocoded.
- Ranked/ordered issue feed using available fixture metadata and transparent, simple demo logic.
- Optional map with markers only for issues whose location has valid coordinates.
- Selecting a feed issue leads to the corresponding issue detail route or selection state.
- If achievable after the baseline works, selecting a marker highlights/opens the corresponding issue and the feed reflects selection.
- Explain why an issue appears using available fields (e.g., nearby mock marker, known location, or broad civic issue); do not state an issue affects a particular property without evidence.
- Visible MOCK / SAMPLE labeling when the underlying issue/location is mock.
- Responsive states and useful empty/error states.

## Out of scope

Real geocoding, automatic parcel matching, live city-data ingestion, complex scoring/ML, address persistence, new backend, notification service, or changes to global data types/services without lead approval.

## File ownership

Own the Near Me page and Near Me-specific components/styles. Consume the shared service and existing app navigation. Do not edit the core service, shared record types, global app shell, or mock fixtures without coordination.

## Acceptance criteria

- Page works with the supplied fixture dataset.
- A preset demo location can power the demo without requiring a real home address.
- A location with no valid coordinates creates no marker.
- Mock coordinates/records are clearly marked as sample data.
- Clicking a feed item opens the correct issue.
- Invalid/unavailable address handling never falsely claims a match was found.
- No broken map action, console error, or unhandled empty state on the Near Me route.
- Run available checks and report their exact results.

## Required handoff

Report files changed, how demo location/ranking works, whether map/feed synchronization is complete, checks run, limitations, and any shared-file request to the lead.
