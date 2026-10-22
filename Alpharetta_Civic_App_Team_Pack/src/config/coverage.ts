// Civic-record coverage: the single place that decides which Georgia places have civic
// records in this app. Selectors, routes and pages all ask through
// src/services/jurisdictions.ts; nothing else should hard-code a place.
//
// The app has one dataset today (data/*.json). Every record in it comes from the City of
// Alpharetta, and it is shown on the Fulton County page, labelled with that source. Fulton
// County government records and other Fulton cities are not in it.
//
// Adding a county here without first adding its own verified records would show the
// Alpharetta records under the wrong name; jurisdictions.test.ts fails if this list changes.

export type RecordSource = {
  /** Government the records come from, e.g. "City of Alpharetta". */
  name: string;
  /** Where its meetings happen, e.g. "Alpharetta City Hall". */
  meetingPlace: string;
};

/** County ids (see data/georgia/directory.json) with civic records, and where those records come from. */
export const CIVIC_DATA_COVERAGE: Readonly<Record<string, RecordSource[]>> = {
  fulton: [{ name: 'City of Alpharetta', meetingPlace: 'Alpharetta City Hall' }],
};

/** The county whose pages the app's original links (/archive, /alpharetta/…, /issues/…) now point to. */
export const LEGACY_COUNTY_ID = 'fulton';
