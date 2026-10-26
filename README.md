# Council Lens

**From public records to public understanding.**

Council Lens helps residents find, understand, and verify the decisions their local government makes. Public records already exist, but following a county board means reading long agendas written in legal language, matching votes to items, and digging through attachments. Council Lens organizes those records into readable issues, shows the recorded result of each one, and links every issue back to the official government record so anyone can check it.

Built for the Congressional App Challenge 2026.

![Council Lens home page](Council%20Lens/docs/images/home.png)

## What it covers

- **Civic records: the Fulton County Board of Commissioners (Georgia).** Every substantive agenda item from the board's 51 meetings between January 8, 2025 and October 21, 2026: 1,303 issues, 4,098 agendas and attached documents, and 47 meeting recordings, taken from the county's official Legistar records.
- **A prepared snapshot, not a live feed.** The records were collected and checked by the project's record-processing pipeline; every link was checked on October 24, 2026. Results from the October 21, 2026 meeting come from the clerk's draft record, which the board had not yet ratified.
- **Statewide location directory.** The location chooser lists all 159 Georgia counties and 538 incorporated cities and towns (from U.S. Census Bureau files). Only Fulton County has civic records today; every other place shows a "coming soon" page and never shows Fulton's records.

## Features

| Page | What it does |
|---|---|
| Home | A county and city chooser for all of Georgia; choosing Fulton County opens the county with records. |
| Countywide | Every issue grouped by result (still being decided, approved, denied, withdrawn), with search and topic and status filters. |
| Issue page | A readable title, the recorded result and vote, the meetings where it came up, a plain-language explanation for 193 notable items (the county's own agenda wording, labeled as a quote, for the rest), its documents, and links to the official records. |
| Near Me | The 20 issues nearest one public starting point (the Fulton County Government Center) on a map and a numbered list. Pins are approximate, placed from street addresses in county documents. The app never asks for anyone's address or location. |
| Calendar | A month-by-month calendar of every board meeting. |
| Archive | Searchable meetings, recordings, agendas, and documents, each linked to the original file. |

The app also has light and dark themes, works on phones and desktops, and supports keyboard navigation.

<p>
  <img src="Council%20Lens/docs/images/issue.png" alt="An issue page: 2026 county property tax rates, approved October 7, 2026, with a plain-language explanation and links to the official records" width="49%">
  <img src="Council%20Lens/docs/images/near-me.png" alt="Near Me: a map of the 20 issues nearest the Fulton County Government Center, with a numbered list" width="49%">
</p>

## How it works

```
Fulton County Legistar (official web API and public site)
        │  record-processing pipeline (Node.js scripts in scripts/fulton-records/)
        │  collect → interpret outcomes → link documents → resolve public links → check
        ▼
data/meetings.json, issues.json, documents.json   (prepared dataset, committed)
        ▼
src/services/civicData.ts   (one data service; datasets load on demand)
        ▼
React pages: Countywide, issue/meeting/document pages, Near Me, Calendar, Archive
```

Two engineering problems shaped the pipeline:

- **Reading outcomes correctly.** A motion that passed is not always an approval: a passed motion to *hold* an item means it is still being decided, and items often have failed substitute motions before a final vote. The pipeline reads the clerk's written motion text first, because Legistar's separate pass/fail field disagreed with that text in 11 places in this period.
- **Links that really open the record.** Legistar's web API uses different item IDs from its public website, so links built from API IDs open an error page that still returns a success code. The pipeline reads each meeting's public page to get every item's real link, then opens every item page in a browser to confirm it shows the right file number.

Full details, including how to rebuild the dataset: [docs/PIPELINE_ARCHITECTURE.md](Council%20Lens/docs/PIPELINE_ARCHITECTURE.md).

## Tools and languages

- **Languages:** TypeScript, JavaScript (Node.js), HTML, CSS. Python is used only for one pipeline step (DOCX text extraction).
- **App:** React, React Router, Vite, Leaflet (map, with Esri World Street Map tiles).
- **Tests and quality:** Vitest, Testing Library, jsdom, ESLint, TypeScript type checking.
- **Pipeline:** Node.js, Fulton County Legistar web API, Poppler `pdftotext`, U.S. Census Bureau geocoder, Playwright with Microsoft Edge (link and page checks).

## Run it

The app is in [`Council Lens/`](Council%20Lens/). It needs Node.js 22.12 or newer (running the tests needs Node 22.22+, 24.15+, or 26+).

```bash
cd "Council Lens"
npm ci
npm run dev        # development server, http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Checks:

```bash
npm run validate:data   # dataset integrity
npm test                # full test suite
npm run typecheck
npm run lint
```

The website runs entirely from the committed dataset; no account, key, or server is needed. Rebuilding the dataset from government sources needs extra tools (see the architecture document).

### Hosting

There is no public deployment of this snapshot; run it locally with the commands above. Any static host can serve the `dist/` folder built in `Council Lens/`, as long as every path falls back to `index.html` (the app uses browser routing, for example `/county/fulton/issues/...`): on Netlify, a `_redirects` file with `/* /index.html 200`; on Vercel, a rewrite of all paths to `/index.html`. Serving from a sub-path such as a GitHub Pages project site would also need Vite's `base` and the router's basename set, which this snapshot does not do.

## Documentation

- [Application README](Council%20Lens/README.md): features, code layout, tests, and credits
- [Pipeline architecture](Council%20Lens/docs/PIPELINE_ARCHITECTURE.md)
- [Dataset notes](Council%20Lens/data/README.md)
- [Data contract](Council%20Lens/docs/DATA_CONTRACT.md)

## Credits

Records: Fulton County Board of Commissioners, via the county's Legistar system. Map tiles: Esri. Geocoding and the Georgia place directory: U.S. Census Bureau. Fonts: Bricolage Grotesque, Atkinson Hyperlegible Next, and Outfit (SIL Open Font License). Open-source software: see the [application README](Council%20Lens/README.md#credits-and-open-source-software).

Council Lens is an independent project, not affiliated with or endorsed by Fulton County.
