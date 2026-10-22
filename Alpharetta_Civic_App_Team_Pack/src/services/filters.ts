// Search and filter helpers for the Citywide issue list and the Archive.
// Pure functions over already-loaded records, so they are easy to test and need no backend.

import type { CivicDocument, Issue, IssueStatus, Meeting } from '../types/civic';

export type IssueFilterState = { q: string; topic: string; status: string };

/** Lower-cased words of a query; empty words are dropped. */
const terms = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/** True when every query word appears somewhere in the given fields (case-insensitive). */
export function matchesQuery(q: string, ...fields: (string | null | undefined)[]): boolean {
  const words = terms(q);
  if (!words.length) return true;
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function filterIssues(issues: Issue[], { q, topic, status }: IssueFilterState): Issue[] {
  return issues.filter(
    (i) =>
      (!topic || i.category === topic) &&
      (!status || i.status === status) &&
      matchesQuery(q, i.title, i.summary, i.category.replace(/_/g, ' '), i.location?.label, i.whyItMayMatter),
  );
}

export const isFiltering = (f: IssueFilterState) => Boolean(f.q.trim() || f.topic || f.status);

/** Distinct values present in the data, so filters never offer an option with zero results. */
export function topicsIn(issues: Issue[]): string[] {
  return [...new Set(issues.map((i) => i.category))].sort();
}

export function statusesIn(issues: Issue[]): IssueStatus[] {
  return [...new Set(issues.map((i) => i.status))];
}

export const meetingMatches = (m: Meeting, q: string) => matchesQuery(q, m.title, m.summary, m.meetingType.replace(/_/g, ' '), m.date);

export const documentMatches = (d: CivicDocument, q: string) =>
  matchesQuery(q, d.title, d.description, d.documentType.replace(/_/g, ' '), d.sourceName, d.publishedDate);
