# Shared Civic Data Contract

This document and the JSON fixtures in `/data/` define the common record shape. All features must use these shared fields. If a change is truly necessary, the project lead must update this contract and all affected fixtures together before feature branches diverge.

## Data-mode rules

- `dataMode: "mock"` and `mockOnly: true`: fictional test data. Must have visible MOCK / SAMPLE identification.
- `dataMode: "curated"` and `mockOnly: false`: manually collected data that was checked against an original source. `lastVerifiedAt` or equivalent verification metadata should be populated where applicable.
- A live/API mode must not be introduced until there is a real integration. Never use a `live` label just because the UI is interactive.

## Meeting

```ts
export type Meeting = {
  id: string;
  title: string;
  meetingType: string;
  date: string | null;       // ISO YYYY-MM-DD
  startTime: string | null;  // HH:mm when known
  status: string;
  summary: string | null;
  officialPageUrl: string | null;
  recordingUrl: string | null;
  agendaDocumentIds: string[];
  issueIds: string[];
  dataMode: "mock" | "curated";
  mockOnly: boolean;
  lastVerifiedAt: string | null;
};
```

## Issue

```ts
export type IssueStatus =
  | "proposed"
  | "under_consideration"
  | "approved"
  | "denied"
  | "withdrawn"
  | "completed"
  | "unknown";

export type Issue = {
  id: string;
  title: string;
  category: string;
  summary: string;
  status: IssueStatus;
  statusAsOf: string | null;
  meetingIds: string[];
  documentIds: string[];
  location: {
    label: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    locationType: "verified" | "approximate" | "mock_marker" | "unknown";
    verified: boolean;
  } | null;
  whyItMayMatter: string | null;
  sourceUrls: string[];
  dataMode: "mock" | "curated";
  mockOnly: boolean;
  featured: boolean;
};
```

## Document

```ts
export type CivicDocument = {
  id: string;
  title: string;
  documentType: string;
  meetingId: string | null;
  issueIds: string[];
  publishedDate: string | null;
  url: string | null;
  description: string | null;
  sourceName: string | null;
  dataMode: "mock" | "curated";
  mockOnly: boolean;
};
```

## Repository/service API

Implement names according to the project's language conventions, but retain equivalent capabilities:

```ts
getMeetings(filters?)
getMeetingById(id)
getIssues(filters?)
getIssueById(id)
getDocuments(filters?)
getDocumentsForMeeting(meetingId)
getIssuesForMeeting(meetingId)
getRelatedIssuesForDocument(documentId)
searchRecords(query, filters?)
```

`getIssuesForLocation(locationContext)` is optional until there is a meaningful matching implementation. The initial demo may use a preset location and transparent demo ranking, not real geocoding or predictions.

## Data rules

1. IDs are stable and unique within their entity type.
2. Relationships are by ID, not duplicated nested records.
3. Null means unavailable/unknown; do not substitute invented values.
4. Only records with valid numeric latitude and longitude can create map markers.
5. A location marked `mock_marker` or a record marked mock must have a visible mock label.
6. A status must be supported by source evidence before a record is marked curated.
7. Never use agenda inclusion alone as evidence that an item was approved.
8. URLs must come from verified source material; do not construct guessed official links.
9. Keep fixture changes and this contract synchronized.
