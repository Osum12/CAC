# Alpharetta Civic App — Product Requirements Document

**Version:** 1.0 · **Status:** Development baseline · **Date:** October 21, 2026

> **Mock-data warning:** The companion JSON fixture pack contains synthetic examples only. Do not present them as official Alpharetta records. Replace them with verified source records before making civic claims.

## 1. Executive summary

The Alpharetta Civic App helps residents understand local government by combining a citywide dashboard, address-based local relevance, and a searchable archive of public meeting recordings and documents. The initial product is a front-end demonstrator built around a small, curated dataset. The interface and data contracts must be designed so mock records can be replaced by verified Alpharetta records without rewriting screens.

> **Prototype integrity rule: the included dataset is synthetic and exists only to develop and test the app. Every mock record must be visibly identified as sample data during development. Do not present invented meetings, projects, decisions, source links, or map locations as official records.**

This document defines the product intent, user experiences, data model, functional requirements, acceptance criteria, technical boundaries, mock-data policy, implementation sequence, and demo path. It does not lock the framework, database, map provider, or hosting platform.

## 2. Product context and problem

### Problem statement

Residents may need to navigate meeting archives, agendas, staff reports, and separate development pages to understand what local government is considering. Long recordings and document-heavy processes make it difficult to quickly identify an issue, understand its current status, and find the supporting source.

### Product opportunity

Provide one locally focused experience that summarizes civic activity in plain language while preserving a direct path to official evidence. Allow residents to explore the city without entering personal information, then optionally use an address to prioritize geographically or substantively relevant issues.

### Primary audience

- Alpharetta residents who want a quick overview of local government activity.
- Residents who want to find nearby projects or issues that could have broader local effects.
- People researching a particular meeting, agenda item, or public document.
- The project team, which needs a repeatable and credible product demonstration using a curated research dataset.

## 3. Goals, non-goals, and success criteria

### Goals

- Show an understandable citywide overview without requiring address entry.
- Offer a Near Me experience combining geographic proximity and potential impact across Alpharetta, not only a fixed-radius search.
- Present an issue feed and an optional interactive map that link to the same issue records.
- Make meetings, videos, agendas, minutes, staff reports, and attachments browsable from an Archive.
- Connect issues to meetings and documents using stable IDs.
- Preserve clear status labels and source links so users can verify claims.
- Support UI development before the complete real dataset is collected.

### Non-goals for Version 1

- Complete ingestion of every city record.
- Automated transcription or summarization of every full-length meeting.
- Guaranteed real-time synchronization with city websites.
- Live alerts for meetings running late or newly posted records.
- Precise parcel-level impact predictions or legal/land-use conclusions.
- Multi-city support, accounts, complex preferences sync, or production-scale backend unless separately prioritized.
- A question-answering feature that responds without grounding and source citations.

### Success criteria

- A user can move from Citywide to an issue, source document, and related meeting without broken navigation.
- The Archive can filter and search the available sample/curated dataset.
- Near Me can render a feed and map from the same issue dataset, handling missing locations correctly.
- All mock records are programmatically identifiable and visibly labeled in development/demo mode.
- Replacing a record does not require changes to individual page components.
- The app distinguishes proposals from verified decisions and indicates unknown status when evidence is insufficient.

## 4. Product scope and information architecture

| Area | Purpose | Version 1 behavior |
| --- | --- | --- |
| Citywide | Understand city activity at a glance | Upcoming meetings, featured issues, recent verified outcomes, topic/date filtering, source links. |
| Near Me | Understand local relevance | Optional address/location entry, ranked issue feed, optional map, reasons for relevance, location-safe fallback. |
| Archive | Find source material | Searchable/filterable meetings, recordings, agendas, minutes, staff reports, attachments, and related links. |
| Issue detail | Understand an individual issue | Summary, status, timeline/date, location if known, relevance explanation, related meetings/documents, source evidence. |
| Meeting detail | Review one public meeting | Metadata, agenda, official recording, document list, related issues, and original source links. |
| Search/filter | Find records quickly | Search title/summary where present; filter by date, meeting body, category, and record type when metadata exists. |

Primary navigation should clearly expose Citywide, Near Me, and Archive. Issue and meeting detail pages can be routes/pages reached from cards, search results, map markers, and related-record links.

## 5. Personas and user journeys

### Persona A — Citywide browser

A resident opens the app to learn what is happening in Alpharetta. They scan the dashboard, select a featured issue, understand its status, and open the supporting city source.

### Persona B — Location-focused resident

A resident optionally enters an address. The app shows local issues using both geographic proximity and potential impact. The resident switches between the ranked feed and map, selects an issue, and reads its relevance explanation. If an issue lacks reliable coordinates, it remains in the feed.

### Persona C — Archive researcher

A user searches for a meeting or document, filters by record type/date, opens a meeting record, and follows an official recording or document link.

### Demo user journey

1. Open Citywide and orient to the dashboard.
2. Select a featured issue and review the summary/status.
3. Open the cited or linked original source when a real curated source is present.
4. Navigate to Near Me and demonstrate feed/map interactions. Use mock data only where clearly labeled.
5. Open Archive, filter to a meeting or document type, and select a related record.
6. Navigate between the Archive record, meeting detail, and issue detail to demonstrate connected records.

## 6. Detailed functional requirements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| FR-01 | Citywide overview | P0 | Dashboard shows meeting and issue cards from the shared data-access layer; empty and loading states are supported. |
| FR-02 | Meeting detail | P0 | A meeting page shows title, type, date, available recording/official-page links, linked documents, and related issues. Missing URLs do not render broken links. |
| FR-03 | Issue detail | P0 | Issue page shows title, summary, category, status, associated meetings/documents, source links, and optional location. |
| FR-04 | Archive browse | P0 | Archive lists available records and can filter by videos, agendas, documents, and all records. Only available items are displayed. |
| FR-05 | Archive search | P1 | Search returns matching available meeting/issue/document records; no-match state explains that no matches were found. |
| FR-06 | Near Me location input | P0 UI / P1 matching | User can enter a location or use a preset demo location; invalid/unavailable location produces a helpful state. Full address is not needlessly persisted. |
| FR-07 | Near Me feed | P0 | Feed can show issues with relevant location or impact metadata and display the reason each item appears. Unknown relevance is not expressed as certainty. |
| FR-08 | Map display | P1 | Issues with coordinates are shown as markers; selecting a marker opens/highlights the issue. Issues without coordinates remain discoverable in feed. Mock markers are visibly sample-only. |
| FR-09 | Feed/map coordination | P1 | Selecting an issue in either presentation synchronizes selection with the other when a mappable location exists. |
| FR-10 | Status integrity | P0 | Status labels come from normalized data and do not infer approval merely from agenda inclusion. Unknown is supported. |
| FR-11 | Source provenance | P0 | Real curated records provide official source links and a verification state/date. Missing sources are labeled unavailable, never fabricated. |
| FR-12 | Mock/curated mode | P0 | Every data record carries a mode/flag; mock-mode records receive a visible SAMPLE / MOCK DATA label in development/demo UI. |
| FR-13 | Related record linking | P0 | Stable IDs connect issues, meetings, and documents; missing referenced records are safely ignored or shown as unavailable, not crashed. |
| FR-14 | Responsive layout | P0 | Primary pages remain usable on desktop and common mobile widths; map and feed can stack on smaller screens. |
| FR-15 | Failure/empty states | P0 | Pages handle zero records, no search results, missing links, unavailable map coordinates, and data-load errors without blank/broken UI. |
| FR-16 | Topic/date filtering | P1 | Available categories and dates can narrow results; filters update displayed results consistently. |
| FR-17 | Question answering | P2 / future | If added later, answers are grounded in retrieved records and cite source links; otherwise omit from Version 1. |
| FR-18 | Notifications/live ingestion | P2 / future | Not required for the first demonstrator; do not show simulated notifications as functioning live alerts. |

## 7. Screen-level specifications

### 7.1 Citywide dashboard

- Header with app identity and primary navigation.
- A short orientation line explaining that the experience covers Alpharetta.
- Upcoming/scheduled meeting section, recent meetings when available, and a selected set of issue cards.
- Card fields: title, date/status as relevant, brief summary, category, and navigation action.
- Optional filters for topic/date if supported by the dataset.
- Clear no-data state if no records are loaded.

### 7.2 Near Me

- Address/location input is optional; users can explore Citywide without it.
- For development, provide a preset demo location and never imply it is the current user’s actual address.
- Show ranked issue feed and a map presentation with a toggle or side-by-side/stacked layout as responsive space allows.
- Use whole-Alpharetta coverage rather than limiting results to a fixed radius. Ranking may combine proximity, declared interest, impact metadata, and source confidence, but only factors supported by the records may be used.
- Each card must explain why the item is shown (e.g., nearby location, potentially related citywide issue, or chosen topic).
- If location services/geocoding are not available, offer search by known demo area or explain the limitation.

### 7.3 Archive

- Unified list of available recordings and documents.
- Record-type filters: All, Videos, Agendas, Documents. Additional labels may include minutes, staff reports, and attachments when present.
- Search by meeting title, date, issuing body, document title, and text fields available locally.
- Archive entry opens a meeting/document detail or the official URL, based on record type.
- Do not claim that a curated set is exhaustive or live-synchronized.

### 7.4 Issue detail

- Issue title and normalized status badge.
- Plain-English summary that preserves what the source actually says.
- Meeting date/context; location if verified or visibly mock.
- “Why it may matter” section with cautious, evidence-aligned language.
- Related source documents, agenda item, meeting detail, and recording links when available.
- Show “Source not yet added” only in internal/sample states; for public-facing use, do not present unsupported factual claims as verified.

### 7.5 Meeting detail

- Meeting title/type/date and state.
- Official page and recording actions when URLs exist.
- Agenda and related-document list.
- Related civic issues.
- If the video is unavailable, offer the official source page or a clear unavailable state.

### 7.6 Shared UI states

| State | Expected behavior |
| --- | --- |
| Loading | Show stable skeletons or a small loading indicator; preserve layout. |
| Empty | Explain that no records are available for this view/filter and how to broaden the search. |
| Error | Show a plain-language error and a retry action where applicable. |
| Missing source | Do not display an active link; state that a source is unavailable or not yet added. |
| Missing location | Keep item in feed if otherwise relevant; omit marker and map-specific claims. |
| Mock record | Show persistent “MOCK DATA / SAMPLE ONLY” indicator in dev/demo mode. |
| Stale verification | Display last-checked date if available; do not silently imply current status. |

## 8. Data architecture and contracts

### Architecture principle

Separate UI components from data sources. Pages call a small civic data service/repository; the repository initially reads JSON files. Later it can be replaced with a backend or verified external-data adapter without changing page logic. Avoid importing fixture JSON directly across many pages.

### Recommended file layout

```text
src/
  components/        # reusable cards, badges, search, map shell
  pages/              # Citywide, Near Me, Archive, issue/meeting detail
  services/           # civicData repository interface and JSON adapter
  types/              # Meeting, Issue, Document, enums
  data/               # demo JSON fixtures only

```

### Repository functions

```text
getMeetings(filters?)
getMeetingById(id)
getIssues(filters?)
getIssueById(id)
getDocuments(filters?)
getDocumentsForMeeting(meetingId)
getIssuesForLocation(locationContext)
searchRecords(query, filters?)
```

The exact language/framework may vary. The important contract is that all views use the same normalized records and relationships.

### Record type: Meeting

| Field | Type / rule | Purpose |
| --- | --- | --- |
| id | string; stable unique ID | Relationships and routing. |
| title | string; required | Display name; mock title must be visibly marked. |
| meetingType | enum/string | City Council, Planning Commission, other public meeting, etc. |
| date | ISO date YYYY-MM-DD or null | Sorting and display. |
| startTime | time string or null | Optional time. |
| status | scheduled, completed, canceled, unknown | Meeting-level state; not an issue decision. |
| summary | string or null | Grounded description. |
| officialPageUrl | valid URL or null | Official source page. |
| recordingUrl | valid URL or null | Video or recording. |
| agendaDocumentIds | string[] | Related document IDs. |
| issueIds | string[] | Related issue IDs. |
| dataMode | mock, curated, live | Provenance mode. |
| mockOnly | boolean | True for all synthetic records. |
| lastVerifiedAt | ISO datetime or null | Freshness/provenance. |

### Record type: Issue

| Field | Type / rule | Purpose |
| --- | --- | --- |
| id | string; stable unique ID | Relationship/routing key. |
| title | string; required | Issue title. |
| category | normalized string/enum | Filtering/grouping. |
| summary | string; required when shown | Plain-English summary. |
| status | proposed, under_consideration, approved, denied, withdrawn, completed, unknown | Issue status backed by evidence. |
| statusAsOf | ISO date or null | Date status last established. |
| meetingIds | string[] | Related meetings. |
| documentIds | string[] | Related documents. |
| location | object or null | Label/address/coordinates/type/verification. |
| whyItMayMatter | string or null | Evidence-aligned relevance explanation. |
| sourceUrls | valid URL[] | Evidence trail. |
| dataMode / mockOnly | enum + boolean | Record provenance. |
| featured | boolean | Optional dashboard placement. |

### Record type: Document

| Field | Type / rule | Purpose |
| --- | --- | --- |
| id | string; stable unique ID | Relationship key. |
| title | string; required | Display title. |
| documentType | agenda, agenda_packet, minutes, staff_report, attachment, supporting_document, other | Archive filter. |
| meetingId | string or null | Parent meeting. |
| issueIds | string[] | Related issues. |
| publishedDate | ISO date or null | Sorting/display. |
| url | valid official URL or null | Link to real file/page. |
| description | string or null | What the document is. |
| sourceName | string or null | Source organization. |
| dataMode / mockOnly | enum + boolean | Record provenance. |

### Relationship and validation rules

- IDs must be unique within each record type.
- Every referenced meeting/document ID should resolve, or the UI must safely tolerate a missing reference.
- A real claim must have at least one traceable source before it is presented as verified.
- When changing IDs, update every relationship.
- Coordinates must be numeric and explicitly marked verified or mock; do not geocode or invent coordinates silently.
- URLs must be valid and inspected before display. `null` means unavailable; do not replace missing source URLs with fabricated URLs.
- Mock fixture records must set `dataMode: "mock"` and `mockOnly: true`.

### Sample Issue JSON (mock)

```json
{
  "id": "issue-mock-001",
  "title": "MOCK ONLY: Sample Pedestrian Crossing Review",
  "category": "transportation",
  "summary": "MOCK DATA: Fictional sample summary; replace with verified source-grounded text.",
  "status": "under_consideration",
  "statusAsOf": "2026-10-12",
  "meetingIds": [
    "meeting-mock-001"
  ],
  "documentIds": [
    "document-mock-001"
  ],
  "location": {
    "label": "Demo Map Area A (fictional)",
    "address": null,
    "latitude": 34.0757,
    "longitude": -84.2948,
    "locationType": "mock_marker",
    "verified": false
  },
  "whyItMayMatter": "MOCK DATA: Example text only; no real-world effect is asserted.",
  "sourceUrls": [],
  "dataMode": "mock",
  "mockOnly": true,
  "featured": true
}
```

The complete mock datasets are provided in the companion ZIP: `meetings.json`, `issues.json`, `documents.json`, plus a README explaining replacement rules.

## 9. Mock-data and replacement strategy

### Stage A — interface fixtures

- Use the supplied mock records to build the page layouts and relationships.
- Use a visible mock-data banner/watermark on any screen that displays fictional records.
- Mock data may exercise map markers and states, but marker labels must say they are fictional and must not imply actual city projects.
- Do not use invented official source links or imply the mock data was retrieved from the city.

### Stage B — curated real data

- For each real meeting or issue, inspect the official source and record its URL and the date checked.
- Replace mock fields field-by-field; do not merely remove the mock label while leaving made-up text.
- Use conservative summaries that distinguish what a public body discussed from what it decided.
- Add real coordinates only when supported by a source; otherwise keep location null and omit map marker.
- For documents/videos, link to the original source. Embed playback only if supported by the source and permitted by the hosting provider.

### Stage C — future live source

- Define a separate live adapter behind the same data-service interface.
- Add freshness/error indicators and a source-update process.
- Do not label the Archive “complete” or “live” until those properties are verified.
- Preserve source provenance and track when each record was last checked.

### Required user-facing labels

| Mode | Meaning | Permitted wording |
| --- | --- | --- |
| Mock | Synthetic interface fixture | “Sample data — not an official city record.” |
| Curated | Manually collected and verified from official sources | “Curated from official source records” or equivalent. |
| Live | Retrieved from an active integration | Only describe as live when the connection and freshness behavior are implemented and tested. |

## 10. Near Me relevance model

Initial ranking should remain explainable, conservative, and bounded by available metadata. The app covers Alpharetta as a whole; it must not apply a fixed-radius cutoff as the sole relevance rule.

### Candidate ranking signals

- Geographic proximity to a known issue location, only when both the user location and issue location are available and valid.
- Potential area-wide impact explicitly supported by issue metadata, not inferred from title alone.
- Topic interests if the user has selected them.
- Data confidence/source completeness, so verified records can be preferred over incomplete or mock records.
- Recency/status, provided dates are known and meaningful.

### Explanation requirements

- Every item in Near Me should expose a plain-language reason for its placement.
- Use phrasing like “near this location” only when location math actually supports it.
- Use “may be relevant to this area” for qualified impact metadata; never state an uncertain effect as fact.
- If no address is supplied, show a generic Alpharetta issue feed or prompt the user to try the feature; do not fabricate a personalized result.
- For the demo, a preset sample location may be used, but it must be called a demo location.

### Location privacy

- Address entry is optional.
- Do not persist a full address by default; use it transiently for matching where practical.
- Do not log raw addresses in client/server console or analytics.
- If a geocoding provider or server is later used, review privacy, retention, terms, and data flows before enabling it.
- The mock build can use a preset location and fixture coordinates, avoiding third-party geocoding entirely.

## 11. UX, accessibility, and non-functional requirements

| Area | Requirement |
| --- | --- |
| Responsive design | Core paths work on desktop and mobile. Near Me can stack the feed/map or switch between them on small screens. |
| Accessibility | Semantic headings, keyboard-operable controls, visible focus, useful labels, sufficient contrast, descriptive link text, and non-color status cues. |
| Performance | Local fixture views should feel immediate; avoid unnecessary data requests and oversized video embeds. Use links as a fallback. |
| Reliability | Missing fields/links/locations must not crash the page. Provide empty, error, and unavailable states. |
| Trust | Source provenance, status, verification time, and mock/curated/live mode should be represented accurately. |
| Privacy | Avoid storing raw addresses; do not collect personal information not needed for the demo. |
| Security | No API secrets in front-end code. Validate outbound links and avoid rendering untrusted HTML from public documents. |
| Maintainability | Centralized data access, normalized types, stable IDs, and shared reusable components. |
| Observability | During development, log data errors without exposing personal address values or secrets. |

## 12. Error, empty, and edge cases

- No meetings or issues returned: show an honest empty state; do not fill the screen with invented official records.
- Search has no matches: show “No matching records” and allow clearing filters.
- Meeting has no recording URL: show recording unavailable and link to the official page only if available.
- Document URL missing: display metadata but no active open button; for a public/curated record this should be flagged for review.
- Issue lacks location: keep it available in Citywide/search and potentially the Near Me feed if supported by non-geographic relevance metadata, but no map marker.
- Unknown status: display “Status not verified” or “Unknown”, not a guessed state.
- Broken relationship ID: render the rest of the record and log a data validation warning.
- Map provider unavailable: retain issue list and show a map-unavailable notice.
- Address invalid or not matched: ask the user to retry or use the sample demo location; do not silently fall back to a different address.
- Only mock records available: show an explicit sample-data indicator on the page.

## 13. Demo plan and requirements

### Preferred demo flow

1. Start on Citywide and explain the purpose: understand city activity without navigating multiple sites.
2. Select a featured issue and show status, a plain-English summary, related meeting, and source link when using real curated data.
3. Open Near Me and show the feed plus map interaction. If fixture records are still mock, keep a visible sample-data label.
4. Open Archive and filter to videos or documents.
5. Open a meeting/document, return to the linked issue, and show how the records connect.

### Demo rules

- The demo may use a curated subset rather than a complete archive.
- Do not claim live monitoring, real-time updates, automated transcription, or actual alerts unless implemented and tested.
- Do not describe sample-only records as official Alpharetta records.
- Use real source links for real records; fixture records have null official URLs until replaced.
- Prepare a fallback for video embedding and map-provider failure.
- Test the demo end-to-end on the actual device/browser used for recording or judging.

### Demo readiness checklist

- [ ] No dead navigation links.
- [ ] All issue-to-meeting and issue-to-document relationships resolve.
- [ ] Official URLs open the expected source for every real curated claim.
- [ ] Mock items visibly say they are samples.
- [ ] Proposal/decision statuses are evidence-based.
- [ ] Missing coordinates and missing recording links have graceful fallbacks.
- [ ] Search and filters work on the records included in the demo.
- [ ] Mobile and desktop layouts have been sanity-checked.

## 14. Delivery plan and priorities

| Phase | Work | Exit condition |
| --- | --- | --- |
| 1. Contract | Review record types, statuses, IDs, and mock flags; add fixtures to repository. | Pages can request typed records through one service. |
| 2. Core UI | Build shared cards and Citywide dashboard. | Dashboard renders fixtures and handles empty/loading states. |
| 3. Connected records | Build issue detail, meeting detail, and Archive. | Relationships navigate correctly; source links are safely optional. |
| 4. Near Me | Build feed, sample location option, map shell/markers, and selection sync. | Feed works without location; missing coordinates do not break the view. |
| 5. Real-data swap | Replace selected fixtures with verified records and official source URLs. | No UI component needs a custom rewrite for each record. |
| 6. QA/demo | Check labels, statuses, links, responsive layout, and walkthrough. | A repeatable end-to-end demo succeeds. |

### Priority definitions

- P0: required for a coherent demonstrator and safe handling of source/data truth.
- P1: valuable if time permits; should not block the core Citywide → issue → source → Archive flow.
- P2: post-demo/future work, including full ingestion, notifications, live monitoring, and open-ended Q&A.

Schedule caution: this project has a short submission window. Verify the official challenge submission date/time and required materials in the current submission portal rather than relying on informal messages or this document.

## 15. Risks, assumptions, and open decisions

| Item | Risk/assumption | Mitigation / treatment |
| --- | --- | --- |
| Data availability | Some meetings may have long videos or incomplete documents. | Prioritize agenda packets and a handful of well-documented records; link to source video rather than processing all video. |
| Data accuracy | Summaries may overstate what was decided. | Require source review and status evidence; use unknown when uncertain. |
| Mock-data confusion | Synthetic records could be mistaken for official records. | Use `mockOnly`, data mode, UI labels, null official links, and a pre-demo replacement/review checklist. |
| Geographic precision | Address matching may be more complex than issue locations allow. | Use only verified coordinates; separate proximity from impact; retain feed items without markers. |
| Map/embedding support | Provider may block embeds or need an API key. | Implement links and map fallback; do not let provider integration block rest of UI. |
| Time constraints | Too much automation could prevent a finished demo. | Focus on the core connected user journey; defer live ingestion and notifications. |
| Tech choices | Framework, database, host, map provider are not decided in this PRD. | Choose based on team familiarity, deployment constraints, and time. |
| Final dataset | Exact records and categories depend on research. | Keep issue categories extensible and select based on records actually found. |

### Explicitly open decisions

- App name and visual brand.
- Framework and deployment target.
- Whether to add a backend/database during Version 1 or stay with local JSON.
- Map provider and final geocoding approach.
- Which specific real meetings/issues are strongest for the demo.
- Whether natural-language question answering is included at all in Version 1.
- Which topic filters are supported by the final research data.

## 16. Definition of done

- [ ] The core routes/pages exist: Citywide, Near Me, Archive, issue detail, and meeting detail.
- [ ] All pages retrieve data through a shared repository/service interface.
- [ ] Mock data files validate against the documented contract and have clear fixture IDs.
- [ ] Mock records display a clear sample-only label; no invented civic record is represented as official.
- [ ] Citywide cards navigate to issue/meeting details.
- [ ] Issue pages connect to related meeting/document pages.
- [ ] Archive filters work for available types.
- [ ] Near Me feed and map share selection state; records without coordinates do not break the layout.
- [ ] Optional location handling has a demo fallback and does not require address entry for Citywide.
- [ ] Unavailable URLs and unknown statuses are handled safely.
- [ ] A small set of real records has been manually verified before being presented as real.
- [ ] The complete demo journey has been tested on the intended presentation device.

## Appendix A. Mock-data pack

Companion file: `alpharetta_civic_app_mock_data.zip`. It contains `data/meetings.json`, `data/issues.json`, `data/documents.json`, and a README with safe replacement instructions.

All included records are fictional UI fixtures. Their dates/titles/locations are not claims about actual City of Alpharetta proceedings. Mock map coordinates are only for visual testing. Official URL fields are null.

### Suggested mock-to-real replacement checklist

- [ ] Find the official meeting/source page.
- [ ] Verify the meeting date/body and download or inspect available agenda/minutes/staff report.
- [ ] Extract only claims supported by the source.
- [ ] Enter the official source URL; add video URL only if the actual recording exists.
- [ ] Record status and a `statusAsOf` date supported by the source.
- [ ] Add issue location only when verified; otherwise leave it null.
- [ ] Replace mock title/summary/relevance text.
- [ ] Set `dataMode` to `curated`, set `mockOnly` to false, and record `lastVerifiedAt` where applicable.
- [ ] Run data validation and test every relationship and outbound link.

## Appendix B. Glossary

| Term | Definition |
| --- | --- |
| Issue | A proposal, decision, project, or civic topic tracked by the app. |
| Meeting | A public meeting record, such as a council or commission session. |
| Document | An agenda, packet, staff report, minutes, attachment, or other source file/page. |
| Mock data | Synthetic records used only to build/test the interface; not official civic information. |
| Curated data | Records manually collected from sources and reviewed by the project team. |
| Live data | Records fetched through an implemented and tested active integration. |
| Proximity | Physical closeness to a known location. |
| Potential impact | A qualified relationship to a broader issue; not proof of a direct effect on a particular property. |
| Source provenance | The origin and verification context for a displayed claim or record. |
