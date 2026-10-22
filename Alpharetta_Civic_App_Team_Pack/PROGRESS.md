# Build Progress Log

Durable record of the AI-assisted build session (Claude Code) started 2026-10-21. After a context reset, re-read this file, `CLAUDE.md`, and the PRDs before continuing.

## Decisions (from the person running the session, GitHub user Osum12)

- Claude acts in all roles (lead, Near Me, Archive) for the **P0 demo path on all pages**. P1 extras (search UI, topic/date filters) are out of scope.
- One shared branch: `integration` (created from `main` at `63840ae`), pushed to GitHub. No merge to `main`.
- Stack: React + TypeScript + Vite, React Router, Leaflet + OpenStreetMap tiles, Vitest + Testing Library, ESLint.
- The app lives inside `Alpharetta_Civic_App_Team_Pack/`, next to the existing `data/` fixtures, which were not modified.

## Status

| Area | Status |
|---|---|
| Foundation: types, data service, app shell, mock indicator | Done |
| Citywide + issue detail | Done |
| Archive + meeting detail + document detail | Done |
| Near Me: starting location, ranked feed, Leaflet map, feed/map selection sync | Done |
| Automated checks (test, typecheck, lint, build) | Passing, see below |
| Browser review at desktop and mobile widths | Done (Playwright + Edge, 375px and 1366px, light and dark) |
| Independent final review | Done: 13 findings, 0 critical, all fixed |
| README, AI-assistance record, CAC checklist | Done; student sections still to be filled in by the team |

## Verification log

| When | Command | Result |
|---|---|---|
| 2026-10-21 | `npm test` | 4 files, 33 tests passed (after fixing one wrong test assumption about `agendaDocumentIds`) |
| 2026-10-21 | `npm run typecheck` | passed |
| 2026-10-21 | `npm run lint` | passed (after replacing synchronous setState in `useAsync`) |
| 2026-10-21 | `npx vite build` | passed. Main JS 92 KB gzip; Near Me chunk (Leaflet) is lazy-loaded at 47 KB gzip |
| 2026-10-22 | Independent reviewer agent | 0 critical, 2 high (map pins: no accessible names, focus lost on selection), 5 medium, 6 low; all fixed in `00bd7cc` |
| 2026-10-22 | `npm test` after fixes | 5 files, 39 tests passed. New real-Leaflet tests first caught a regression (markers added before map view existed), which was fixed |
| 2026-10-22 | Route sweep: 11 routes x (375 light, 1366 light, 375 dark) | 0 horizontal overflow, 0 console errors, all pins labelled |
| 2026-10-22 | Map tile check | 9/9 OpenStreetMap tile requests succeeded (wasted initial-view requests removed) |
| 2026-10-22 | typecheck, lint, build | passed |
| 2026-10-22 | Real-data swap: `npm test`, typecheck, lint, build | 49 tests passed; all others passed |
| 2026-10-22 | Real-data route sweep (8 routes x 375/1366) | 0 overflow, 0 console errors, 3 approximate pins labelled |
| 2026-10-22 | UI/UX refinement round: `npm test` | 6 files, 61 tests passed |
| 2026-10-22 | Responsive sweep: 7 routes x 320/375/430/768/1024/1440 | 0 horizontal overflow, 0 console errors, no text under 13px |
| 2026-10-22 | AI QA/accessibility review | 0 critical, 1 high (initial load scrolled past the skip link), 3 medium, 5 low; all fixed and re-verified (fresh load at top, first Tab = "Skip to content") |
| 2026-10-22 | typecheck, lint, `npm run build` | passed |
| 2026-10-22 | Final visual pass: link check of all 17 data URLs | 17/17 live (9 PDFs, 7 portal pages, 1 video) |
| 2026-10-22 | Final visual pass: meeting dates/times vs city portal event list; map points vs Census geocoder | 5/5 meetings match; 3/3 coordinates match |
| 2026-10-22 | Final visual pass: tests, typecheck, lint, build, 7 routes x 6 widths | 67 passed; all passed; 0 overflow, 0 console errors |
| 2026-10-22 | Clarity redesign: tests, typecheck, lint, build, 7 routes x 6 widths, dark mode check | 67 passed; all passed; 0 overflow, 0 console errors; fixed low-contrast dark-mode search button |
| 2026-10-22 | Date filters: `npm test`, typecheck, lint, build, 6-width sweep | 67 tests passed; all others passed; 0 overflow, 0 console errors |

## Known limitations

- 2026-10-22: replaced the fictional records with 19 curated real records (see `data/README.md`). The fictional pack moved to `src/test/fixtures/` for tests. Each fact was checked against downloaded official minutes, agendas or packets. The team should still open every source link themselves.
- Map points for real issues are approximate (U.S. Census geocoder, from addresses in city documents) and labelled as such.
- No geocoding in the app: typed addresses are rejected with an honest message. The only starting location is Alpharetta City Hall.
- Map tiles come from the public OpenStreetMap server and need internet access. The list still works offline.
- Citywide has keyword, topic, status and "Updated" date filters; the Archive has keyword search, date and type filters. Date ranges are relative to today, so results change as time passes. Issues are dated by `statusAsOf`, and records with no date never match a date range.

- Browser checks used headless Edge through Playwright. The Claude in Chrome extension was not connected, so no manual click-through in a real Chrome window was done.

## Next steps (student team)

See `CAC_READINESS.md`, "Must do before submitting". Deadline: 12:00 pm EDT, Oct 26, 2026.
