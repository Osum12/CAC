# Congressional App Challenge Readiness

Checked 2026-10-21 against the official 2026 rulebook: https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf (linked from https://www.congressionalappchallenge.us/students/rules/). Re-read the rulebook yourselves. Your district's Member of Congress may change the judging.

## Key rules

| Topic | Rule (2026 rulebook) |
|---|---|
| **Deadline** | **12:00 pm EDT, Monday, October 26, 2026.** The submission can't be changed after that. |
| Eligibility | In middle or high school on Oct 26, 2026; U.S. resident; teams of up to 4. At least half the team must live in, or go to school in, the same participating district. One app per student per year. |
| Originality | The app must be created after Oct 30, 2025. It must be "original and solely created by the contestant"; open-source libraries are allowed but "must be clearly documented." |
| Demo video | 1–3 minutes, public on YouTube or Vimeo. Must cover: participant names, app name, the app's purpose in one sentence, target audience, tools and languages used, and a demo of the functionality. |
| Written answers | Title, purpose, inspiration, a technical difficulty and how you solved it, what you learned, and what a 2.0 version would change. |
| Code | Judges may request the app and source code. Failing to provide them means disqualification. |
| Judging | Quality of the idea, implementation (including UX and design), and demonstrated excellence of coding and programming skills. |

## Status of the app (verified 2026-10-25)

- All pages work: the Georgia chooser, Countywide, Near Me, Calendar, Archive and the detail pages. `npm test` (9 files, 130 tests), typecheck, lint and build pass; `npm run validate:data` (16 tests) passes.
- A fresh clone of GitHub `main` installs with `npm ci` and 0 vulnerabilities. 11 routes checked at 375 and 1440px: no horizontal overflow, no console errors.
- **The data is real**: every substantive agenda item of the Fulton County Board of Commissioners from its 51 meetings between January 8, 2025 and October 21, 2026: 1,303 issues, 4,098 documents and 47 meeting recordings, each linked to the county's official Legistar records (links checked 2026-10-24). 125 issues have an approximate map pin. Ceremonial and procedural items are left out on purpose (see `data/README.md`). It is a snapshot, not a live archive, so say that in the demo.
- Meetings were matched one-to-one against Legistar (its web API and its public calendar): 26 meetings in 2025 and 25 from January to October 2026.
- Results come from the clerk's recorded motions and roll calls. The October 21, 2026 results come from the clerk's draft record, which the board is scheduled to ratify on November 4, 2026; check them against the ratified minutes. The TSPLOST referendum the board called is on the November 3, 2026 ballot; update that item after the election.

## Must do before submitting (student team)

1. **Make and document real student technical work.** Each item below is a meaningful, self-contained piece of work:
   - Verify the records yourselves (open source links, starting with the 169 items that have plain-language summaries). The Board of Commissioners records are already complete for January 2025 to October 2026, so add records from a new source instead, for example a Fulton city's own agenda system, or the Board meetings after October 21, 2026 (see `data/README.md` and `scripts/fulton-records/README.md`). This needs real research skill and is core to the product.
   - Let users pick their own starting location on Near Me from a list of public places.
   - Write tests for whatever you add.
2. **Read and understand the code** well enough to explain it to a judge: the data flow (`page → civicData.ts → JSON`), how Near Me ranking works (`nearMe.ts`), and why null URLs are never links (`SourceAction.tsx`).
4. **List open-source libraries** in the submission: React, React Router, Leaflet, Esri World Street Map tiles, Vite, Vitest, Testing Library, ESLint, Google Fonts (Bricolage Grotesque, Atkinson Hyperlegible Next).
5. **Record the demo video** (1–3 min). Say that the records are every substantive Fulton County Board of Commissioners agenda item from January 2025 to October 2026, checked against the county's Legistar records (a snapshot, not live, and only one government body), and that the app is a student project not affiliated with Fulton County or any government. The site has no footer saying so, so say it in the video and the written answers.
6. **Confirm eligibility**: grades, residency, district, team size ≤ 4.
7. **Merge to `main`** only after the team reviews `integration`, if the team wants `main` to be the submitted version.
8. **Update the TSPLOST item after the November 3, 2026 election**, and check the October 21, 2026 results against the minutes once the board ratifies them.
9. **Check the data yourselves** against the linked PDFs. The team should be able to vouch for every record.
10. **Explain the statewide scope honestly.** The app lists every Georgia county and city, but only Fulton County has records, all from the Board of Commissioners. Say this in the video and the written answers, and be ready to explain how a new place would be added (its own verified dataset, then one entry in `src/config/coverage.ts`). A good student contribution: add records for a Fulton city, or another county, from its official agenda system.

## Honest demo script (about 2½ minutes)

1. **0:00–0:20.** Team names, the app name "Council Lens", the one-sentence purpose (understand what your local government is considering, with a path to the source), and the audience. On the home page choose Fulton County, keep "All of Fulton County", and say plainly that Fulton County is the only place with records today and that other places show "Coming soon".
2. **0:20–0:50 Countywide.** Issues are grouped by where they stand: still being decided, approved, denied. Open "2026 county property tax rates": the proposed rate, the three public hearings, the failed rollback motion, and the adopted rate. Then open "Limiting public comment at board meetings" to show a denied item, and follow a link to the county's official item record.
3. **0:50–1:30 Near Me.** The list shows the 20 nearest issues, sorted by distance from the Fulton County Government Center, each item says why it is listed, and selecting a pin highlights the matching card. Point out that pins are approximate, and that countywide items stay in the list without a pin.
4. **1:30–2:00 Calendar and Archive.** Show the Calendar's month grid of every Board meeting. In the Archive, switch to Videos and open a Board of Commissioners meeting recording. Search for "housing" and open a fact sheet PDF.
5. **2:00–2:30 Tools and learning.** React, TypeScript, Vite, Leaflet with Esri map tiles, Vitest. Name the technical challenge your team actually solved.

Do not say the data is live or official, or that it covers more than the Fulton County Board of Commissioners, or that distance means an issue affects someone's home.
