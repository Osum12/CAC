# Congressional App Challenge Readiness

Checked 2026-10-21 against the official 2026 rulebook: https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf (linked from https://www.congressionalappchallenge.us/students/rules/). Re-read the rulebook yourselves. Your district's Member of Congress may change the judging.

## Key rules

| Topic | Rule (2026 rulebook) |
|---|---|
| **Deadline** | **12:00 pm EDT, Monday, October 26, 2026.** The submission can't be changed after that. |
| Eligibility | In middle or high school on Oct 26, 2026; U.S. resident; teams of up to 4. At least half the team must live in, or go to school in, the same participating district. One app per student per year. |
| Originality | The app must be created after Oct 30, 2025. It must be "original and solely created by the contestant"; open-source libraries are allowed but "must be clearly documented." |
| AI | Allowed only if "fully disclosed". It "must not constitute the entirety of the technical development". Students must show "significant individual contributions and technical understanding." |
| Demo video | 1–3 minutes, public on YouTube or Vimeo. Must cover: participant names, app name, the app's purpose in one sentence, target audience, tools and languages used, and a demo of the functionality. |
| Written answers | Title, purpose, inspiration, a technical difficulty and how you solved it, what you learned, and what a 2.0 version would change. |
| Code | Judges may request the app and source code. Failing to provide them means disqualification. |
| Judging | Quality of the idea, implementation (including UX and design), and demonstrated excellence of coding and programming skills. |

## Status of the app (verified 2026-10-22)

- All pages work. `npm test` (120 tests), typecheck, lint and build pass.
- 13 routes checked at 320, 375, 430, 768, 1024 and 1440px: no horizontal overflow, no console errors. Dark mode checked.
- **The data is real**: 24 agenda items, 8 meetings and 18 documents from the Fulton County Board of Commissioners (August to October 2026), each linked to the county's official Legistar records. It is a selected set, not a complete or live archive, so say that in the demo.
- **The data is Fulton County Board of Commissioners records** (August 3 to October 7, 2026), taken from the county's Legistar system. Minutes were not published yet when it was checked, so check the results against them once they are. The TSPLOST referendum the board called is on the November 3, 2026 ballot; update that item after the election.

## Must do before submitting (student team)

1. **Make and document real student technical work** (required by the AI rule). Each item below is a meaningful, self-contained piece of work:
   - Verify the AI-researched records yourselves (open every source link), then research and add more items, for example from a Fulton city's own agenda system (see `data/README.md`). This needs real research skill and is core to the product.
   - Add a custom date picker ("from / to") alongside the preset date ranges in `src/services/filters.ts`.
   - Let users pick their own starting location on Near Me from a list of public places.
   - Write tests for whatever you add.
2. **Read and understand the code** well enough to explain it to a judge: the data flow (`page → civicData.ts → JSON`), how Near Me ranking works (`nearMe.ts`), and why null URLs are never links (`SourceAction.tsx`).
3. **Fill in `AI_ASSISTANCE.md`** honestly, and put a matching disclosure in the submission form.
4. **List open-source libraries** in the submission: React, React Router, Leaflet, OpenStreetMap data, Vite, Vitest, Testing Library, ESLint, Google Fonts (Fraunces, Source Sans 3).
5. **Record the demo video** (1–3 min). Say that the records are a selected, checked set of real Fulton County Board of Commissioners items (not live or complete), and that the app is a student project not affiliated with Fulton County or any government. The site has no footer saying so, so say it in the video and the written answers.
6. **Confirm eligibility**: grades, residency, district, team size ≤ 4.
7. **Merge to `main`** only after the team reviews `integration`, if the team wants `main` to be the submitted version.
8. **Update the TSPLOST item after the November 3, 2026 election**, and check every result against the official minutes when the county publishes them.
9. **Check the data yourselves** against the linked PDFs. An AI did the research and an AI reviewer re-checked it, but the team should be able to vouch for every record.
10. **Explain the statewide scope honestly.** The app lists every Georgia county and city, but only Fulton County has records, all from the Board of Commissioners. Say this in the video and the written answers, and be ready to explain how a new place would be added (its own verified dataset, then one entry in `src/config/coverage.ts`). A good student contribution: add records for a Fulton city, or another county, from its official agenda system.

## Honest demo script (about 2½ minutes)

1. **0:00–0:20.** Team names, "Georgia Civic", the one-sentence purpose (understand what your local government is considering, with a path to the source), and the audience. On the home page choose Fulton County, keep "All of Fulton County", and say plainly that Fulton County is the only place with records today and that other places show "Coming soon".
2. **0:20–0:50 Countywide.** Open "2026 county property tax rates": the proposed rate, the three public hearings, the failed rollback motion, and the adopted rate. Then open "Limiting public comment at board meetings" to show a denied item, and follow a link to the county's official item record.
3. **0:50–1:30 Near Me.** The list is sorted by distance from the Fulton County Government Center, each item says why it is listed, and selecting a pin highlights the matching card. Point out that pins are approximate, and that countywide items stay in the list without a pin.
4. **1:30–2:00 Archive.** Switch to Videos and open a Board of Commissioners meeting recording. Search for "housing" and open a fact sheet PDF.
5. **2:00–2:30 Tools and learning.** React, TypeScript, Vite, Leaflet/OpenStreetMap, Vitest. Name the technical challenge your team actually solved, and disclose AI use.

Do not say the data is live, official or complete, or that distance means an issue affects someone's home.
