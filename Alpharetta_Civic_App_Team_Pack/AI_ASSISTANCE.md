# AI Assistance Record

The 2026 Congressional App Challenge rulebook (§3) allows AI tools "provided that all AI usage is fully disclosed in the submission materials." It also says AI "must not constitute the entirety of the technical development" and that participants must show "significant individual contributions and technical understanding." This file is an honest record to support that disclosure. **The student team must review it, complete the "Student contributions" section truthfully, and include an accurate disclosure in the submission.**

## Tools used

| Tool | Used for |
|---|---|
| Claude Code (Anthropic, model Claude Opus 5.5), run in a session by GitHub user Osum12 on 2026-10-21 and 2026-10-22 | See below |

The PRDs, task briefs and mock data pack in this folder already existed before this session. This record does not cover how they were written; the team should state that separately.

## What the AI did in that session

Commits `fdf437a` and `00bd7cc` on the `integration` branch, plus the documentation commit that added this file, were produced by Claude Code:

- Chose the stack (React + TypeScript + Vite + Leaflet) after the person running the session approved it.
- Wrote all application code in `src/`: types, the data service, Near Me ranking, every page and component, the design system in `global.css`, and every test.
- Wrote the configuration: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `index.html`.
- Ran the tests, typecheck, lint and build, and checked screenshots of every page at phone and desktop widths in light and dark mode.
- Ran an AI reviewer agent, which found 13 issues, and fixed them. The two most serious were map pins with no accessible names, and keyboard focus lost when a pin was chosen.
- Researched the 2026 CAC rules with an AI research agent (summarized in `CAC_READINESS.md`).
- Wrote `README.md`, `PROGRESS.md`, this file and `CAC_READINESS.md`.

In a later step (2026-10-22), at the session runner's request, Claude Code also:
- Researched real Alpharetta City Council and Planning Commission items on the city's official meeting portal, using an AI research agent.
- Re-checked each fact itself by downloading the official agendas, minutes and packets and reading the relevant passages.
- Wrote the 19 real records now in `data/`. It moved the original fictional records to `src/test/fixtures/` for tests only.
- Looked up approximate coordinates for 4 addresses with the U.S. Census Bureau geocoder.

**The team should open each source link and confirm the records themselves** before presenting them as checked by the team.

On 2026-10-22, also at the session runner's request, Claude Code did a UI/UX refinement round:
- Added hero actions, Citywide search and filters, and Archive search.
- Redesigned the issue and meeting cards and added map and source links.
- Added the issue timeline and back navigation, and switched the body font to Source Sans 3.
- Added the tests for these features.
- Ran an AI QA/accessibility reviewer, which found 8 issues (no critical ones), and fixed them.
- Added date filters to Citywide (when a status was set) and the Archive (meeting or publish date), with tests.
- Restyled the app for clarity, using the City of Alpharetta website as a structural reference: a hero search, shortcut tiles and "label: value" fact lines, in the app's own colors and without the city's branding.
- Did an editorial redesign: a full-width green cover hero with a serif headline, a "Next at City Hall" panel built from the data, warm ivory pages and serif section titles.
- Ran a requirements-compliance audit with an independent AI reviewer, re-checked the data against the official PDFs, and fixed the defects found (see `PROGRESS.md`). Archive documents are now dated by their meeting.

The AI did not change the PRDs and did not deploy anything.

## Student contributions (TO BE COMPLETED BY THE TEAM)

> As of this commit, nearly all the code is AI-generated. The rules say AI must not be the entirety of technical development, so the team needs to make and document real technical contributions before submitting. Ideas are in `CAC_READINESS.md`, under "Must do before submitting".

| Student | What they designed, wrote, or changed | Files / commits |
|---|---|---|
| | | |

## Suggested disclosure wording (edit to make it true)

> We used Claude Code, an AI coding assistant, to generate the initial version of the app's code, tests and documentation from requirements our team wrote. Our team [describe: wrote the product requirements, researched and verified the Alpharetta records, implemented X and Y, reviewed and modified the generated code, designed Z]. The source code and a detailed record of AI use are in our repository.
