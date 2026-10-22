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

- All P0 pages work with the fixture data. `npm test` (39 tests), typecheck, lint and build all pass.
- Every route checked at 375px and 1366px, in light and dark mode: no horizontal overflow, no console errors.
- **The data is real**: 5 issues, 5 meetings and 9 documents from September and October 2026, each linked to official city agendas or minutes. It is a selected set, not a complete or live archive, so say that in the demo.
- **Royal 400 Data Center goes before City Council on Oct 26, 2026, the same day as the noon submission deadline.** The meeting is at 6:30 PM, after the deadline, so the submitted app will correctly show it as under consideration. Update it after the vote for any later demo.

## Must do before submitting (student team)

1. **Make and document real student technical work** (required by the AI rule). Each item below is a meaningful, self-contained piece of work:
   - Verify the 5 AI-researched records yourselves (open every source link), then research and add more items, e.g. the other Oct 26 agenda items (see `data/README.md`). This needs real research skill and is core to the product.
   - Add a custom date picker ("from / to") alongside the preset date ranges in `src/services/filters.ts`.
   - Let users pick their own starting location on Near Me from a list of public places.
   - Write tests for whatever you add.
2. **Read and understand the code** well enough to explain it to a judge: the data flow (`page → civicData.ts → JSON`), how Near Me ranking works (`nearMe.ts`), and why null URLs are never links (`SourceAction.tsx`).
3. **Fill in `AI_ASSISTANCE.md`** honestly, and put a matching disclosure in the submission form.
4. **List open-source libraries** in the submission: React, React Router, Leaflet, OpenStreetMap data, Vite, Vitest, Testing Library, ESLint, Google Fonts (Fraunces, Source Sans 3).
5. **Record the demo video** (1–3 min). Say that the records are a small, hand-checked set of real Alpharetta items (not live or complete), and that the app is a student project not affiliated with the City of Alpharetta. The site no longer has a footer saying so, so say it in the video and the written answers.
6. **Confirm eligibility**: grades, residency, district, team size ≤ 4.
7. **Merge to `main`** only after the team reviews `integration`, if the team wants `main` to be the submitted version.
8. **Update Royal 400 after the Oct 26, 2026 City Council vote** (status, `statusAsOf`, the official minutes as source) before any later demo.
9. **Check the data yourselves** against the linked PDFs. An AI did the research and an AI reviewer re-checked it, but the team should be able to vouch for every record.

## Honest demo script (about 2½ minutes)

1. **0:00–0:20.** Team names, "Alpharetta Civic", the one-sentence purpose (understand what Alpharetta's government is considering, with a path to the source), and the target audience (Alpharetta residents).
2. **0:20–0:50 Citywide.** Open the Royal 400 Data Center issue: status "Under consideration", the Planning Commission recommendation, and the upcoming Oct 26 Council meeting. Then open the North Main Street item and click through to the official minutes PDF.
3. **0:50–1:30 Near Me.** Choose Alpharetta City Hall. The list re-sorts by distance, each item explains why it's listed, and selecting a pin highlights the matching card. Point out that pins are approximate, and that items with no street address stay in the list without a pin.
4. **1:30–2:00 Archive.** Switch to Videos and open the Sept 14 City Council meeting recording on the city portal. Open a meeting and follow its links to issues and documents.
5. **2:00–2:30 Tools and learning.** React, TypeScript, Vite, Leaflet/OpenStreetMap, Vitest. Name the technical challenge your team actually solved, and disclose AI use.

Do not say the data is live, official or complete, or that distance means an issue affects someone's home.
