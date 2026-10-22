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
| Near Me: demo points, ranked feed, Leaflet map, feed/map selection sync | Done |
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

## Known limitations

- All 13 records are fictional mock data. Real records must be researched and verified by the team (see `data/README.md`).
- No geocoding: typed addresses are rejected with an honest message. Only two fictional demo points work.
- Map tiles come from the public OpenStreetMap server and need internet access. The list still works offline.
- Search (`searchRecords`) exists in the service but has no UI (P1).

- Sample map pins sit on a real street map (one is near a school). They are dashed, labelled and captioned as fictional, but should be replaced with verified locations or removed before a public demo.
- Browser checks used headless Edge through Playwright. The Claude in Chrome extension was not connected, so no manual click-through in a real Chrome window was done.

## Next steps (student team)

See `CAC_READINESS.md`, "Must do before submitting". Deadline: 12:00 pm EDT, Oct 26, 2026.
