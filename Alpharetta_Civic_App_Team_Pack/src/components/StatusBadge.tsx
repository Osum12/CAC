import type { IssueStatus } from '../types/civic';
import { ISSUE_STATUS_LABELS, meetingStatusLabel } from '../services/format';

/**
 * Status always travels in three channels: an icon shape, a written word, and a color.
 * Finished states are calm bold text; states that still need watching get a tinted tag.
 */
type IconKind = 'check' | 'cross' | 'clock' | 'open' | 'dash' | 'question' | 'calendar';

const ISSUE_ICONS: Record<IssueStatus, IconKind> = {
  proposed: 'open',
  under_consideration: 'clock',
  approved: 'check',
  denied: 'cross',
  withdrawn: 'dash',
  completed: 'check',
  unknown: 'question',
};

export function StatusIcon({ kind, className = 'status__icon' }: { kind: IconKind; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      {kind === 'check' && (
        <>
          <circle cx="10" cy="10" r="9" fill="currentColor" />
          <path d="m5.8 10.3 2.8 2.8 5.6-6" fill="none" stroke="var(--icon-cut, #fff)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'cross' && (
        <>
          <circle cx="10" cy="10" r="9" fill="currentColor" />
          <path d="m6.6 6.6 6.8 6.8m0-6.8-6.8 6.8" fill="none" stroke="var(--icon-cut, #fff)" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {kind === 'clock' && (
        <>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10 5.5V10l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'open' && <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.4" />}
      {kind === 'dash' && (
        <>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M6 10h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {kind === 'question' && (
        <>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M7.8 7.8a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .8-1 1.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="10" cy="14.2" r="1.1" fill="currentColor" />
        </>
      )}
      {kind === 'calendar' && (
        <path d="M6 2.5v3m8-3v3M3 8h14M4 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export const issueIconKind = (status: IssueStatus): IconKind => ISSUE_ICONS[status in ISSUE_ICONS ? status : 'unknown'];

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const s = status in ISSUE_STATUS_LABELS ? status : 'unknown';
  return (
    <span className={`status status--${s}`}>
      <StatusIcon kind={ISSUE_ICONS[s]} />
      {ISSUE_STATUS_LABELS[s]}
    </span>
  );
}

const MEETING_ICONS: Record<string, IconKind> = { scheduled: 'calendar', completed: 'check', canceled: 'cross', unknown: 'question' };

export function MeetingStatusBadge({ status }: { status: string }) {
  const known = ['scheduled', 'completed', 'canceled'].includes(status) ? status : 'unknown';
  return (
    <span className={`status status--meeting-${known}`}>
      <StatusIcon kind={MEETING_ICONS[known]} />
      {meetingStatusLabel(status)}
    </span>
  );
}
