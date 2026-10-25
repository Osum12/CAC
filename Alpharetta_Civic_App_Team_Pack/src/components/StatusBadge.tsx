import type { IssueStatus } from '../types/civic';
import { ISSUE_STATUS_LABELS, meetingStatusLabel } from '../services/format';

// Every status is a dot plus the written word. The dot also changes shape per status
// (filled, ring, half, cross, dash), so status is never conveyed by color alone.

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const s = status in ISSUE_STATUS_LABELS ? status : 'unknown';
  return (
    <span className={`status status--${s}`}>
      <span aria-hidden="true" className="status__dot" />
      {ISSUE_STATUS_LABELS[s]}
    </span>
  );
}

export function MeetingStatusBadge({ status }: { status: string }) {
  const known = ['scheduled', 'completed', 'canceled'].includes(status) ? status : 'unknown';
  return (
    <span className={`status status--meeting-${known}`}>
      <span aria-hidden="true" className="status__dot" />
      {meetingStatusLabel(status)}
    </span>
  );
}
