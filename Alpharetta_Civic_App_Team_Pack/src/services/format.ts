// Display helpers shared across pages. Dates in the data are ISO YYYY-MM-DD;
// they are parsed as local calendar dates so they never shift a day by timezone.

import type { IssueStatus } from '../types/civic';

export function parseIsoDate(iso: string | null): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | null, fallback = 'Date not provided'): string {
  const d = parseIsoDate(iso);
  return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : fallback;
}

export function formatShortDate(iso: string | null): { month: string; day: string } | null {
  const d = parseIsoDate(iso);
  return d ? { month: d.toLocaleDateString('en-US', { month: 'short' }), day: String(d.getDate()) } : null;
}

export function formatTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Turns data identifiers like "development_and_zoning" into "Development and zoning". */
export function humanize(value: string | null | undefined): string {
  if (!value) return 'Not specified';
  const text = value.replace(/[_-]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  city_council: 'City Council',
  planning_commission: 'Planning Commission',
  other_public_meeting: 'Public meeting',
};
export const meetingTypeLabel = (t: string) => MEETING_TYPE_LABELS[t] ?? humanize(t);

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  proposed: 'Proposed',
  under_consideration: 'Under consideration',
  approved: 'Approved',
  denied: 'Denied',
  withdrawn: 'Withdrawn',
  completed: 'Completed',
  unknown: 'Status not verified',
};

const MEETING_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Held',
  canceled: 'Canceled',
};
export const meetingStatusLabel = (s: string) => MEETING_STATUS_LABELS[s] ?? 'Status unknown';

/** Only http(s) URLs are ever rendered as links; anything else is treated as unavailable. */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}
