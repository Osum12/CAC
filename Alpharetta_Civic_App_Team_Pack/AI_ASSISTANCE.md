# AI Assistance Record

The 2026 Congressional App Challenge rulebook (§3) allows AI tools "provided that all AI usage is fully disclosed in the submission materials." It also says AI "must not constitute the entirety of the technical development" and that participants must show "significant individual contributions and technical understanding." This file is an honest record to support that disclosure. **The student team must review it, complete the "Student contributions" section truthfully, and include an accurate disclosure in the submission.**

## Tools used

| Tool | Used for |
|---|---|
| Claude Code (Anthropic, model Claude Opus 5.5), run in a session by GitHub user Osum12 from 2026-10-21 to 2026-10-25 | See below |

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
- Wrote the 19 real records then in `data/` (later replaced by the Fulton County records). It moved the original fictional records to `src/test/fixtures/` for tests only.
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

- Expanded the app into "Georgia Civic": a county → city chooser over all 159 Georgia counties and 538 municipalities (generated from U.S. Census Bureau files), one Fulton County page showing the City of Alpharetta records (labelled with that source), Coming Soon pages for every other county and for every city, a single coverage config, redirects from the old links, and tests that no other place shows or loads records. An independent AI reviewer checked the expansion; its findings were fixed (search boxes now follow nav links, old filtered links redirect, county links ignore letter case, multi-county cities return to the right county, stronger chooser borders, fewer duplicate screen-reader announcements, a test tripwire on the coverage list).
- Fixed audit defects: search boxes dropping typed characters, Near Me location cards overflowing on phones, the selected radio hard to see in dark mode, map pins pushed out of view on selection, "Show on map" with no visible result on phones, and meeting search not matching dates like "Oct 26".

- On the team's request, replaced the City of Alpharetta records with 50 Fulton County Board of Commissioners records researched from the county's Legistar system (meetings, agenda items, recorded motions, roll-call votes, agendas, attachments, videos). Every URL was checked, and statuses follow the recorded motions. Map pins come from addresses in county documents, geocoded with the U.S. Census geocoder.
- Simplified the interface for the demo video: removed the shortcut tiles and date filters, gave Near Me one fixed public starting point (no address box), and replaced text glyphs with SVG icons. Design checks followed the priority rules of the "ui-ux-pro-max" skill the team linked (its scripts were not installed or run).

- Added a Category filter to Near Me, and restyled the app following the team-linked "frontend-design" skill: the Public Sans typeface, a light hero with the latest decision as the one marked element, and flat record cards. At the team's request it kept the original color palette (warm paper, evergreen, brick). (The typefaces and colors were changed later, with design 4: the app now uses Bricolage Grotesque and Atkinson Hyperlegible Next.)

From 2026-10-23 to 2026-10-25, at the session runner's request, Claude Code also:
- Built several full design options and implemented the one the team chose ("design 4"). It renamed the app (Georgia Civic → Porchlight → Council Lens), drew the lens-over-courthouse logo and its offset frame, and added the dark mode toggle, header hover states and the landing page redesign from the team's brief.
- Replaced the 50 selected records with every substantive Board of Commissioners agenda item from January 8, 2025 to October 21, 2026: 51 meetings, 1,303 issues and 4,098 documents. The team chose the date range, "substantive items only", and plain-language summaries for notable items only.
  - Claude Code wrote the pipeline in `scripts/fulton-records/`. It downloads from the Legistar web API, works out each result from the clerk's motion text, and drafts a short title for every item and plain-language summaries for 169 notable items, each fact tied to an exact quote.
  - It also matches addresses with the U.S. Census geocoder and reads the public item links from the county's meeting pages.
  - It checked the work with scripts: every quote and number in the summaries against the sources, all 5,499 links, and every item page in a browser. See `data/README.md`.
- Made long lists show a set at a time ("Show more"), quoted the county's agenda wording on items without a summary, and fixed audit findings (document types, empty explanation boxes, count formatting).
- Researched wordmark design. It built three wordmark concepts and then five title styles; the team chose one each time, most recently style 1 "Field · Point", now in the header and in `public/brand`.
- Limited Near Me to the 20 nearest issues and made the starting point more visible, at the team's request.
- Added the Calendar page: a month grid of every Board meeting, with a Calendar button in the navigation.
- On 2026-10-25, merged a teammate's two commits ("Add traditional meeting calendar" and "Fix retired Legistar source links") into `integration`, keeping the existing Calendar page and the verified item links. Both commits stay in the history.
- Merged `integration` into `main`.
- Drafted the written answers for the CAC submission form from the repository's facts and had an independent AI agent fact-check them.

The AI did not change the PRDs and did not deploy anything.

## Student contributions (TO BE COMPLETED BY THE TEAM)

> As of this commit, nearly all the code is AI-generated. The rules say AI must not be the entirety of technical development, so the team needs to make and document real technical contributions before submitting. Ideas are in `CAC_READINESS.md`, under "Must do before submitting".

| Student | What they designed, wrote, or changed | Files / commits |
|---|---|---|
| | | |

## Suggested disclosure wording (edit to make it true)

> We used Claude Code, an AI coding assistant, to generate the initial version of the app's code, tests and documentation from requirements our team wrote. Our team [describe: wrote the product requirements, researched and verified the Fulton County Board of Commissioners records, implemented X and Y, reviewed and modified the generated code, designed Z]. The source code and a detailed record of AI use are in our repository.
