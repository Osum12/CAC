# Alpharetta Civic App — Mock Data Pack

**IMPORTANT: Every record in this pack is fictional test data. None of the sample titles, dates, locations, statuses, summaries, or documents represents a verified City of Alpharetta record.** Do not present these records as official civic information.

## Files
- `data/meetings.json` — sample meeting records
- `data/issues.json` — sample civic issues
- `data/documents.json` — sample document metadata

## Intended use
Use these files to build and test layout, navigation, filtering, data relations, loading states, and feed/map interactions before the real research dataset is ready. Every record has `dataMode: "mock"` and `mockOnly: true`. Mock map coordinates are visual test points only.

## Replacement rules
1. Preserve the record types and IDs/relationship pattern, or update all relationships when IDs change.
2. Replace fictional titles, dates, summaries, statuses, and map values with verified information.
3. Add official source URLs for real records. Do not fabricate URLs.
4. Mark a source as verified only after checking the original document or official page.
5. Change `dataMode` to `curated` (or another explicit mode agreed by the project) only for real records that were manually collected and verified. `mockOnly` should be `false` for those real records.
6. Keep the user-facing app honest about whether data is sample, curated, or live.

## Recommended development pattern
Build a small data-access module that reads these JSON files and exposes functions such as `getMeetings`, `getIssues`, `getDocuments`, `getIssueById`, and `getDocumentsForMeeting`. UI pages should call those functions, not import the JSON files independently. This makes swapping the data source easier.

## Status values
Suggested issue statuses: `proposed`, `under_consideration`, `approved`, `denied`, `withdrawn`, `completed`, `unknown`. Only use a status when source evidence supports it.
