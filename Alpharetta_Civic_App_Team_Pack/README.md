# Council Lens

A student project for the Congressional App Challenge 2026. It helps Georgia residents see what their local government is working on: meetings, proposals, and public documents in one place, in plain language, with a path back to the original source.

> **Coverage: only Fulton County has civic records, from the Fulton County Board of Commissioners.** You can choose any of Georgia's 159 counties and, within a county, any of 538 incorporated cities, towns and consolidated governments. "All of Fulton County" opens the Fulton County page; every other county, and every city, shows a "Coming soon" page with no records. City governments inside Fulton County are not included.

> **Data:** `data/` holds Fulton County Board of Commissioners records from the county's official Legistar system: every substantive agenda item from all 51 Board meetings between January 8, 2025 and October 21, 2026. That is 1,303 issues, 4,098 documents (agendas and attachments) and 47 meeting recordings. 125 issues have a map pin; these are approximate points looked up from street addresses with the U.S. Census Bureau geocoder. Every link was checked on 2026-10-24. The data is not live: it is rebuilt with the scripts in `scripts/fulton-records/`. See `data/README.md`.

## Features

| Page | Route | What it does |
|---|---|---|
| Georgia home | `/` | Location chooser: county (all 159), then an optional city or town filtered to that county, with "All of <county>" first. The selection is kept in the URL (`/?county=fulton`), so refresh and Back keep it, and changing the county clears the city. Shows no records. |
| Other counties | `/county/:countyId` | "Coming soon" on every sub-path (e.g. `/county/cobb/archive?q=…`), with links to the cities and towns in the county. No records. Unknown ids show "Location not found". |
| Cities | `/:cityId/*` | Every city shows "Coming soon" on every sub-path; cities in Fulton County point to the Fulton County page. No records. |
| Countywide (Fulton) | `/county/fulton` | Cover hero ("What's on the table in Fulton County") with an issue search and a panel showing the next meeting (when one is scheduled) and the latest decision; issues grouped by result, with keyword search and topic and status filters (kept in the URL, e.g. `/county/fulton?topic=transportation&status=approved`); issue and meeting lists are labelled "From the Fulton County Board of Commissioners"; each issue card links to its official record and, when it has a map point, to Near Me with that issue selected; upcoming and recent meetings with agenda PDF links. |
| Issue detail | `/county/fulton/issues/:issueId` | Plain-language summary (labelled as a rewrite of the sources), status with its "as of" date, why it may matter, a dated timeline of related meetings, documents with direct PDF links, official sources, location with "View on map". |
| Near Me | `/county/fulton/near-me` | The 20 issues nearest one fixed public starting point, the Fulton County Government Center, sorted by straight-line distance; the app never asks for an address. A category filter narrows the list. A Leaflet map shows pins only for issues with coordinates; these are approximate points looked up from addresses in county documents, and the map labels them that way. Choosing a pin highlights the matching list item, and the reverse. Every item says why it's listed. |
| Calendar | `/county/fulton/calendar` | A month grid of every Board meeting in the records, with previous/next month buttons, a "Jump to a month with meetings" menu (`?month=`), and a list of that month's meetings. |
| Archive | `/county/fulton/archive` | Meetings and documents in one list, with keyword search (`?q=`) and type filters for All, Videos, Agendas and Documents (`?type=`), shown 40 at a time; rows link straight to recordings and PDFs. |
| Meeting detail | `/county/fulton/meetings/:meetingId` | Date and time, recording and official-page links when they exist, agenda and documents, related issues. |
| Document detail | `/county/fulton/documents/:documentId` | Description, source, parent meeting, related issues, and the original file link when one exists. |

Honesty rules built into the code:
- Any mock record shows a "Sample data" badge, and a site-wide banner appears unless every loaded record is confirmed curated. With the current real data, neither appears.
- A missing or invalid URL is never rendered as a link. Mock records never carry links, which the data service enforces.
- The app never asks for, stores or logs anyone's address. Near Me always starts from the same public place.
- Distance is described as distance only, never as an impact claim. Issues with no location stay in the list without a pin.
- Status comes straight from the data. Unknown values display as "Status not verified".

The original links (`/archive`, `/near-me`, `/calendar`, `/issues/…`, `/meetings/…`, `/documents/…`) redirect to the same page under `/county/fulton`, keeping their query string, and so do old filtered links to `/` (e.g. `/?topic=…`).

A light/dark theme toggle sits in the header.

Out of scope for this version: live data, accounts, notifications, civic records for any place other than Fulton County.

## Tech stack

- [React](https://react.dev) 19 + TypeScript, built with [Vite](https://vite.dev)
- [React Router](https://reactrouter.com) for routes
- [Leaflet](https://leafletjs.com) with Esri World Street Map tiles for the map (no API key)
- [Vitest](https://vitest.dev) + Testing Library + jsdom for tests, ESLint for linting
- Fonts: Bricolage Grotesque (headings) and Atkinson Hyperlegible Next (text) from Google Fonts; the wordmark is outlined from Outfit

There is no backend, database, API key or secret.

## Run it locally

Prerequisites: Node.js 22.12 or newer (required by Vitest 5 and jsdom 30), and npm.

```bash
cd Alpharetta_Civic_App_Team_Pack
npm ci
npm run dev          # opens on http://localhost:5173
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm test` | Run all tests once |
| `npm run validate:data` | Check only the JSON fixtures against the data contract |
| `npm run build:directory` | Rebuild `data/georgia/directory.json` from the Census files in `data/georgia/source/` |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build locally |

The map background needs internet access. Without it, the app shows a notice and the list keeps working.

## How the code is organized

```text
data/                 meetings.json, issues.json, documents.json (Fulton County records)
  georgia/            directory.json (counties and municipalities) built from source/ (Census files)
scripts/
  build-georgia-directory.mjs   Builds data/georgia/directory.json
  fulton-records/     The pipeline that built the Fulton County data from Legistar (see its README)
src/
  config/coverage.ts  The one list of counties that have civic records, and their sources (Fulton: Board of Commissioners)
  types/civic.ts      Shared Meeting / Issue / CivicDocument types (matches docs/DATA_CONTRACT.md)
  services/
    civicData.ts      The only module that reads the fixtures; list, lookup and relationship functions
    nearMe.ts         The public starting point, coordinate validation, distance ranking and explanations
    format.ts         Date/label formatting, safe URL checking, source-link naming
    filters.ts        Keyword/topic/status matching used by Countywide, Near Me and Archive
    useAsync.ts       Loading / error / retry state for data requests
    jurisdictions.ts  Georgia counties and municipalities joined with coverage; lookups and labels
    placeContext.ts   The covered county the current page belongs to, county-scoped links, record-source names
    useUrlParams.ts   URL search-param updates that don't lose quick changes, and search boxes that follow the URL
  components/         Layout, cards, badges, status labels, map, empty/error states,
                      LocationSelector (county → city), PlaceScope (the gate in front of every county page; cities show Coming Soon)
  pages/              One file per route (e.g. CitywidePage.tsx for Countywide, NearMePage.tsx, CalendarPage.tsx, ArchivePage.tsx)
  styles/global.css   Design tokens (light and dark) and all styles
```

Data flows one way: **page → `civicData.ts` → JSON fixtures**. Record pages only render inside `CountyScope`, which checks `src/config/coverage.ts`; for any other county or any city the data service is never called (a test counts the loads). To use a different data source later, change `loadDataset` in `civicData.ts`. No page needs to change.

## Adding or updating records

Follow `data/README.md`. In short, for each record:

1. Open the official source and check every field yourself.
2. Write each field from what the source says. Add only URLs you have opened.
3. Set `dataMode: "curated"`, `mockOnly: false`, and `lastVerifiedAt` (meetings) or `sourceUrls` (issues).
4. Add coordinates only if the source supports them. Otherwise set `location` to `null`.
5. Run `npm run validate:data` and `npm test`.

## Testing

`npm test` runs the whole suite: 9 test files, 130 tests. Most use the fictional fixture pack in `src/test/fixtures/`, so they don't depend on which real records are in `data/`:
- data integrity for both the real records and the fixtures: unique IDs, relationships that resolve, provenance flags, valid statuses and dates, URL and coordinate rules
- a check that the real data renders with no sample labels and that every issue card's official-record link points to the county's Legistar site
- search and filter behavior, the calendar, hero actions, map links, the issue timeline, and archive search
- data-service behavior: lookups, malformed rows, load errors and retry
- Near Me ranking
- map accessibility with real Leaflet
- page flows for every route, including empty, error and not-found states
- the Georgia directory against the Census source files (159 counties, every active incorporated place, multi-county cities)
- the location chooser, Coming Soon pages, redirects, Back/Forward, and that no place except the Fulton County page shows or loads any record

## Project documents

- `PRODUCT_PRD.md`, `TEAM_IMPLEMENTATION_PRD.md`, `docs/`: requirements and data contract
- `CAC_READINESS.md`: competition checklist and the tasks the student team must still do

## Credits and open-source software

| What | Used for |
|---|---|
| [React](https://react.dev) and React DOM | User interface |
| [React Router](https://reactrouter.com) | Routes and URLs |
| [Leaflet](https://leafletjs.com) | The Near Me map |
| [Vite](https://vite.dev) with `@vitejs/plugin-react` | Development server and build |
| [TypeScript](https://www.typescriptlang.org) | Type checking |
| [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com) (React, jest-dom, user-event), [jsdom](https://github.com/jsdom/jsdom) | Tests |
| [ESLint](https://eslint.org) with typescript-eslint and eslint-plugin-react-hooks | Linting |
| Esri World Street Map | Map tiles (attribution shown on the map) |
| Bricolage Grotesque, Atkinson Hyperlegible Next ([Google Fonts](https://fonts.google.com)) | Headings and body text |
| Outfit (SIL Open Font License 1.1) | Outlined for the Council Lens wordmark |
| Fulton County Legistar: public web API (`webapi.legistar.com/v1/fulton`) and public site ([fulton.legistar.com](https://fulton.legistar.com)) | Meetings, agenda items, documents, recordings and links |
| U.S. Census Bureau geocoder | Approximate map points from street addresses in county documents, and the Near Me starting point |
| U.S. Census Bureau 2020 FIPS reference files for Georgia counties and places (`data/georgia/source/`) | The Georgia county and municipality directory |

