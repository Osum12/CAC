# Alpharetta Civic

A student prototype for the Congressional App Challenge. It helps Alpharetta, Georgia residents see what local government is working on: meetings, proposals, and public documents in one place, in plain language, with a path back to the original source.

> **Current data is fictional.** All 13 records in `data/` are mock test content (`dataMode: "mock"`). The app labels every one of them as sample data. Before the app is presented as showing real information, the team must replace records with verified, source-linked ones. See [Replacing mock data](#replacing-mock-data).

## Features (P0 demo scope)

| Page | Route | What it does |
|---|---|---|
| Citywide | `/` | Featured issues, other issues, upcoming meetings and recent meetings, all from the shared data service. |
| Issue detail | `/issues/:issueId` | Summary, status with its "as of" date, why it may matter, location, related meetings and documents, sources. |
| Near Me | `/near-me` | Pick a fictional demo point to sort issues by straight-line distance. A Leaflet map shows pins only for issues with valid coordinates. Choosing a pin highlights the matching list item, and the reverse. Every item says why it's listed. |
| Archive | `/archive` | Meetings and documents in one list, with filters for All, Videos, Agendas and Documents (`?type=`). |
| Meeting detail | `/meetings/:meetingId` | Date and time, recording and official-page links when they exist, agenda and documents, related issues. |
| Document detail | `/documents/:documentId` | Description, source, parent meeting, related issues, and the original file link when one exists. |

Honesty rules built into the code:
- Mock records always show a "Sample data" badge, and a site-wide banner appears unless every loaded record is confirmed curated.
- A missing or invalid URL is never rendered as a link. Mock records never carry links, which the data service enforces.
- Address entry is never geocoded, stored or logged. The app says so and offers the demo points instead.
- Distance is described as distance only, never as an impact claim. Issues with no location stay in the list without a pin.
- Status comes straight from the data. Unknown values display as "Status not verified".

Out of scope for this version: search UI, topic/date filters, live city data, accounts, notifications.

## Tech stack

- [React](https://react.dev) 19 + TypeScript, built with [Vite](https://vite.dev)
- [React Router](https://reactrouter.com) for routes
- [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles for the map (free, no API key)
- [Vitest](https://vitest.dev) + Testing Library for tests, ESLint for linting
- Fonts: Fraunces and Public Sans from Google Fonts

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
    nearMe.ts         Demo points, coordinate validation, distance ranking and explanations
    format.ts         Date/label formatting and safe URL checking
    useAsync.ts       Loading / error / retry state for data requests
  components/         Layout, cards, badges, status labels, map, empty/error states
  pages/              One file per route
  styles/global.css   Design tokens (light and dark) and all styles
```

Data flows one way: **page → `civicData.ts` → JSON fixtures**. To use a different data source later, change `loadDataset` in `civicData.ts`. No page needs to change.

## Replacing mock data

Follow `data/README.md` and the checklist in `PRODUCT_PRD.md` (Appendix A). In short, for each real record:

1. Open the official source and check every field yourself.
2. Replace the fictional text field by field. Add only URLs you have opened.
3. Set `dataMode: "curated"`, `mockOnly: false`, and `lastVerifiedAt` (meetings) or `sourceUrls` (issues).
4. Add coordinates only if the source supports them. Otherwise set `location` to `null`.
5. Run `npm run validate:data` and `npm test`.

## Testing

`npm test` runs 39 tests:
- fixture integrity: unique IDs, relationships that resolve, provenance flags, valid statuses and dates, URL and coordinate rules
- data-service behavior: lookups, malformed rows, load errors and retry
- Near Me ranking
- map accessibility with real Leaflet
- page flows for every route, including empty, error and not-found states

## Project documents

- `PRODUCT_PRD.md`, `TEAM_IMPLEMENTATION_PRD.md`, `docs/`: requirements and data contract
- `PROGRESS.md`: build log and verification results
- `AI_ASSISTANCE.md`: what AI tools did, for CAC disclosure
- `CAC_READINESS.md`: competition checklist and the tasks the student team must still do
