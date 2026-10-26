# Fulton County records pipeline

These scripts built `data/meetings.json`, `data/issues.json` and `data/documents.json` from Fulton County's official Legistar records (October 24, 2026). They are kept here so the dataset can be rebuilt and re-verified; the app never runs them, and nothing is fetched live by the app.

They were run from a working folder with this layout, and expect it: the scripts side by side, `notable.json`, `titles/all.json`, `summaries/out-*.json`, `itemlinks.json` and `geocode.json` next to them, a `raw/` cache that `fetch.cjs` fills, and `playwright-core` (Microsoft Edge) for the two browser steps. The reviewed inputs are kept in `reviewed/`; copy them into place before running `build.cjs`.

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `fetch.cjs` | Downloads Board of Commissioners events, agenda items (with attachments), matters, matter histories and roll-call votes from `https://webapi.legistar.com/v1/fulton` into `raw/` (cached). |
| 2 | `normalize.cjs` | One record per agenda item with every meeting appearance. Works out each meeting's result from the clerk's motion text ("to hold. The motion passed…"), which is more reliable than the pass/fail flag; a passed approval wins over failed substitutes and amendments; procedural motions ("to add item … to the agenda") never decide an item. Consent items take the result of the adopted consent agenda. The clerk's result note on the title ("(APPROVED)", "(HELD)") is the fallback and a cross-check. |
| 3 | `filter.cjs` | Keeps substantive items; drops agenda adoption, minutes ratification, proclamations, public comment, closed sessions, and presentations or discussions with no decision. |
| 4 | `docs.cjs`, `dossiers.cjs` | Downloads the attachments of the notable items listed in `reviewed/notable.json` (169 file numbers: large contracts, budget and tax items, ordinances, commissioners' resolutions, and every item that failed, was held, filed or withdrawn; see `data/README.md`), extracts their text, and writes one dossier per item for the summary writers. |
| 5 | (prepared text, checked against the sources) | `reviewed/titles/all.json`: a short title and topic for every item, written from the official wording only; every number in a title was checked against the source. `reviewed/summaries/out-*.json`: plain-language summaries for 169 notable items, each fact backed by an exact quote from the county's documents. |
| 6 | `checksum.cjs` | Independent re-check of the summaries: quotes exist in their sources, numbers occur in the sources (rounded amounts were checked by hand), no summary states an outcome. |
| 7 | `itemlinks.cjs` | Reads each meeting's official page on fulton.legistar.com and records the public link for every item. The public site's item IDs differ from the API's, so links built from API IDs open an "Invalid parameters!" page. |
| 8 | `geocode.cjs` | Looks up street addresses quoted in item text with the U.S. Census Bureau geocoder (approximate pins). |
| 9 | `build.cjs base` | Writes the three data files. `base/` (kept in `reviewed/base`) holds the 24 hand-written records the app had before this import; they are kept with IDs unchanged, and any that cannot be rebuilt are reported. |
| 10 | `urlcheck.cjs`, `pagecheck.cjs` | Opens every link: files must return 2xx; item pages must show their own file number, meeting pages their date, recordings must not be an error page. |
