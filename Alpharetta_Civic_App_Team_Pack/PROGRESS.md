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
| Browser review at desktop and mobile widths | Pending |
| Independent final review | Pending |
| README, AI-assistance record, CAC checklist | Pending |

## Verification log

| When | Command | Result |
|---|---|---|
| 2026-10-21 | `npm test` | 4 files, 33 tests passed (after fixing one wrong test assumption about `agendaDocumentIds`) |
| 2026-10-21 | `npm run typecheck` | passed |
| 2026-10-21 | `npm run lint` | passed (after replacing synchronous setState in `useAsync`) |
| 2026-10-21 | `npx vite build` | passed. Main JS 92 KB gzip; Near Me chunk (Leaflet) is lazy-loaded at 47 KB gzip |

## Known limitations

- All 13 records are fictional mock data. Real records must be researched and verified by the team (see `data/README.md`).
- No geocoding: typed addresses are rejected with an honest message. Only two fictional demo points work.
- Map tiles come from the public OpenStreetMap server and need internet access. The list still works offline.
- Search (`searchRecords`) exists in the service but has no UI (P1).

## Next steps

1. Browser review of every route at desktop and mobile widths; fix visual issues.
2. Independent reviewer agent pass; fix critical findings.
3. README, `AI_ASSISTANCE.md`, `CAC_READINESS.md`.
