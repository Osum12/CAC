# Alpharetta Civic

A student prototype for the Congressional App Challenge. It helps Alpharetta, Georgia residents see what local government is working on: meetings, proposals, and public documents in one place, in plain language, with a path back to the original source.

> **Data:** `data/` holds 19 real records (5 meetings, 5 issues, 9 documents) from City of Alpharetta City Council and Planning Commission meetings in September and October 2026. Each was checked against official agendas and minutes on 2026-10-22 and links to its source. This is a small selected set, not a complete or live archive. See `data/README.md`.

## Features (P0 demo scope)

| Page | Route | What it does |
|---|---|---|
| Citywide | `/` | Hero with "Explore city issues" and "Find issues near me" actions; issues with keyword, topic and status filters (kept in the URL, e.g. `/?topic=transportation`); each issue card links to its official record and, when it has a map point, to Near Me with that issue selected; upcoming and recent meetings with agenda PDF links. |
| Issue detail | `/issues/:issueId` | Plain-language summary (labelled as a rewrite of the sources), status with its "as of" date, why it may matter, a dated timeline of related meetings, documents with direct PDF links, official sources, location with "View on map". |
| Near Me | `/near-me` | Start from Alpharetta City Hall to sort issues by straight-line distance. A Leaflet map shows pins only for issues with coordinates; these are approximate points looked up from addresses in city documents, and the map labels them that way. Choosing a pin highlights the matching list item, and the reverse. Every item says why it's listed. |
| Archive | `/archive` | Meetings and documents in one list, with keyword search (`?q=`) and type filters for All, Videos, Agendas and Documents (`?type=`); rows link straight to recordings and PDFs. |
| Meeting detail | `/meetings/:meetingId` | Date and time, recording and official-page links when they exist, agenda and documents, related issues. |
| Document detail | `/documents/:documentId` | Description, source, parent meeting, related issues, and the original file link when one exists. |

Honesty rules built into the code:
- Any mock record shows a "Sample data" badge, and a site-wide banner appears unless every loaded record is confirmed curated. With the current real data, neither appears.
- A missing or invalid URL is never rendered as a link. Mock records never carry links, which the data service enforces.
- Address entry is never geocoded, stored or logged. The app says so and offers the example location instead.
- Distance is described as distance only, never as an impact claim. Issues with no location stay in the list without a pin.
- Status comes straight from the data. Unknown values display as "Status not verified".

Out of scope for this version: date filters, live city data, accounts, notifications.

## Tech stack

- [React](https://react.dev) 19 + TypeScript, built with [Vite](https://vite.dev)
- [React Router](https://reactrouter.com) for routes
- [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles for the map (free, no API key)
- [Vitest](https://vitest.dev) + Testing Library for tests, ESLint for linting
- Fonts: Fraunces (headings) and Source Sans 3 (text) from Google Fonts

There is no backend, database, API key or secret.

## Run it locally

Prerequisites: Node.js 20 or newer, and npm.

```bash
cd Alpharetta_Civic_App_Team_Pack
npm install
npm run dev          # opens on http://localhost:5173
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm test` | Run all tests once |
| `npm run validate:data` | Check only the JSON fixtures against the data contract |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build locally |

The map background needs internet access. Without it, the app shows a notice and the list keeps working.

## How the code is organized

```text
data/                 meetings.json, issues.json, documents.json (fixtures)
src/
  types/civic.ts      Shared Meeting / Issue / CivicDocument types (matches docs/DATA_CONTRACT.md)
  services/
    civicData.ts      The only module that reads the fixtures; list, lookup and relationship functions
    nearMe.ts         Example starting location, coordinate validation, distance ranking and explanations
    format.ts         Date/label formatting, safe URL checking, source-link naming
    filters.ts        Keyword/topic/status matching used by Citywide and Archive search
    useAsync.ts       Loading / error / retry state for data requests
  components/         Layout, cards, badges, status labels, map, empty/error states
  pages/              One file per route
  styles/global.css   Design tokens (light and dark) and all styles
```

Data flows one way: **page → `civicData.ts` → JSON fixtures**. To use a different data source later, change `loadDataset` in `civicData.ts`. No page needs to change.

## Adding or updating records

Follow `data/README.md` and the checklist in `PRODUCT_PRD.md` (Appendix A). In short, for each record:

1. Open the official source and check every field yourself.
2. Write each field from what the source says. Add only URLs you have opened.
3. Set `dataMode: "curated"`, `mockOnly: false`, and `lastVerifiedAt` (meetings) or `sourceUrls` (issues).
4. Add coordinates only if the source supports them. Otherwise set `location` to `null`.
5. Run `npm run validate:data` and `npm test`.

## Testing

`npm test` runs 61 tests. They use the fictional fixture pack in `src/test/fixtures/`, so they don't depend on which real records are in `data/`:
- data integrity for both the real records and the fixtures: unique IDs, relationships that resolve, provenance flags, valid statuses and dates, URL and coordinate rules
- a check that the real data renders with no sample labels and that every source link points to the city's document server
- search and filter behavior, hero actions, map links, the issue timeline, and archive search
- data-service behavior: lookups, malformed rows, load errors and retry
- Near Me ranking
- map accessibility with real Leaflet
- page flows for every route, including empty, error and not-found states

## Project documents

- `PRODUCT_PRD.md`, `TEAM_IMPLEMENTATION_PRD.md`, `docs/`: requirements and data contract
- `PROGRESS.md`: build log and verification results
- `AI_ASSISTANCE.md`: what AI tools did, for CAC disclosure
- `CAC_READINESS.md`: competition checklist and the tasks the student team must still do
