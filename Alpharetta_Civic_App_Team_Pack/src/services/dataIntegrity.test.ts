// Validates the JSON fixtures in /data against docs/DATA_CONTRACT.md.
// Run on its own with `npm run validate:data` after editing any data file.

import meetings from '../../data/meetings.json';
import issues from '../../data/issues.json';
import documents from '../../data/documents.json';
import { findBrokenRelationships } from './civicData';
import type { CivicDocument, Issue, Meeting } from '../types/civic';

const M = meetings as Meeting[];
const I = issues as Issue[];
const D = documents as CivicDocument[];
const ALL = [...M, ...I, ...D];
const STATUSES = ['proposed', 'under_consideration', 'approved', 'denied', 'withdrawn', 'completed', 'unknown'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isHttpUrl = (u: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(u).protocol);
  } catch {
    return false;
  }
};

describe('data fixtures', () => {
  it('has unique IDs within each record type', () => {
    for (const list of [M, I, D]) {
      const ids = list.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('has no unresolved relationship IDs', () => {
    expect(findBrokenRelationships({ meetings: M, issues: I, documents: D })).toEqual([]);
  });

  it('keeps relationships consistent in both directions', () => {
    for (const issue of I) {
      for (const mid of issue.meetingIds) expect(M.find((m) => m.id === mid)?.issueIds).toContain(issue.id);
      for (const did of issue.documentIds) expect(D.find((d) => d.id === did)?.issueIds).toContain(issue.id);
    }
    // agendaDocumentIds lists agenda items only; other attachments link via document.meetingId.
    for (const meeting of M) {
      for (const did of meeting.agendaDocumentIds) expect(D.find((d) => d.id === did)?.meetingId).toBe(meeting.id);
    }
  });

  it('marks provenance consistently: mock rows are mockOnly, curated rows are verified', () => {
    for (const r of ALL) {
      expect(['mock', 'curated']).toContain(r.dataMode);
      expect(r.mockOnly).toBe(r.dataMode === 'mock');
    }
    for (const m of M.filter((x) => x.dataMode === 'curated')) expect(m.lastVerifiedAt).not.toBeNull();
    for (const i of I.filter((x) => x.dataMode === 'curated')) expect(i.sourceUrls.length).toBeGreaterThan(0);
  });

  it('uses only contract issue statuses', () => {
    for (const i of I) expect(STATUSES).toContain(i.status);
  });

  it('uses ISO dates or null', () => {
    for (const m of M) if (m.date !== null) expect(m.date).toMatch(ISO_DATE);
    for (const i of I) if (i.statusAsOf !== null) expect(i.statusAsOf).toMatch(ISO_DATE);
    for (const d of D) if (d.publishedDate !== null) expect(d.publishedDate).toMatch(ISO_DATE);
  });

  it('has only null or valid http(s) URLs, and mock rows have no URLs at all', () => {
    const urls = (r: Meeting | Issue | CivicDocument) =>
      'recordingUrl' in r ? [r.recordingUrl, r.officialPageUrl] : 'sourceUrls' in r ? r.sourceUrls : [r.url];
    for (const r of ALL) {
      for (const u of urls(r)) {
        if (u === null) continue;
        expect(isHttpUrl(u)).toBe(true);
        expect(r.dataMode).not.toBe('mock'); // mock records must never carry real-looking links
      }
    }
  });

  it('only uses numeric coordinates, and mock markers are never marked verified', () => {
    for (const i of I) {
      if (!i.location) continue;
      const { latitude, longitude, locationType, verified } = i.location;
      expect(latitude === null || Number.isFinite(latitude)).toBe(true);
      expect(longitude === null || Number.isFinite(longitude)).toBe(true);
      if (locationType === 'mock_marker') expect(verified).toBe(false);
      if (i.dataMode === 'mock') expect(verified).toBe(false);
    }
  });
});
