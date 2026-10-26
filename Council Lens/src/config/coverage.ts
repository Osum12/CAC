// Civic-record coverage: the single place that decides which Georgia places have civic
// records in this app. Selectors, routes and pages all ask through
// src/services/jurisdictions.ts; nothing else should hard-code a place.
//
// The app has one dataset today (data/*.json): Fulton County Board of Commissioners
// meetings, agenda items and documents from Fulton County's Legistar site. City governments
// inside Fulton County are not in it.
//
// Adding a county here without first adding its own verified records would show Fulton's
// records under the wrong name; jurisdictions.test.ts fails if this list changes.

export type RecordSource = {
  /** Government the records come from, e.g. "Fulton County Board of Commissioners". */
  name: string;
  /** Where its meetings happen, e.g. "the Government Center". */
  meetingPlace: string;
};

/** County ids (see data/georgia/directory.json) with civic records, and where those records come from. */
export const CIVIC_DATA_COVERAGE: Readonly<Record<string, RecordSource[]>> = {
  fulton: [{ name: 'Fulton County Board of Commissioners', meetingPlace: 'the Government Center' }],
};

/** The county whose pages the app's original links (/archive, /alpharetta/…, /issues/…) now point to. */
export const LEGACY_COUNTY_ID = 'fulton';

