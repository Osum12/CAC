import { Link } from 'react-router-dom';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { formatDate, formatShortDate, formatTime, humanize, meetingTypeLabel } from '../services/format';
import { MockBadge } from './MockBadge';
import { IssueStatusBadge, MeetingStatusBadge } from './StatusBadge';

// Cards use a "stretched link": the title is the only link, and CSS expands its
// click area over the whole card. Screen readers hear one clear link per card.

export function IssueCard({ issue, headingLevel = 3 }: { issue: Issue; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as const;
  return (
    <article className="card card--issue">
      <div className="card__meta">
        <span className="eyebrow">{humanize(issue.category)}</span>
        <MockBadge record={issue} />
      </div>
      <H className="card__title">
        <Link to={`/issues/${encodeURIComponent(issue.id)}`} className="card__link">
          {issue.title}
        </Link>
      </H>
      <p className="card__summary">{issue.summary}</p>
      <div className="card__foot">
        <IssueStatusBadge status={issue.status} />
        {issue.statusAsOf && <span className="muted">as of {formatDate(issue.statusAsOf)}</span>}
      </div>
    </article>
  );
}

export function MeetingCard({ meeting, headingLevel = 3 }: { meeting: Meeting; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as const;
  const short = formatShortDate(meeting.date);
  const time = formatTime(meeting.startTime);
  return (
    <article className="card card--meeting">
      <div className="datechip" aria-hidden="true">
        {short ? (
          <>
            <span className="datechip__month">{short.month}</span>
            <span className="datechip__day">{short.day}</span>
          </>
        ) : (
          <span className="datechip__month">TBD</span>
        )}
      </div>
      <div className="card__body">
        <div className="card__meta">
          <span className="eyebrow">{meetingTypeLabel(meeting.meetingType)}</span>
          <MockBadge record={meeting} />
        </div>
        <H className="card__title">
          <Link to={`/meetings/${encodeURIComponent(meeting.id)}`} className="card__link">
            {meeting.title}
          </Link>
        </H>
        <p className="card__when">
          {formatDate(meeting.date)}
          {time ? ` · ${time}` : ''}
        </p>
        <div className="card__foot">
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </div>
    </article>
  );
}

export function DocumentCard({ document, headingLevel = 3 }: { document: CivicDocument; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as const;
  return (
    <article className="card card--document">
      <div className="card__meta">
        <span className="eyebrow">{humanize(document.documentType)}</span>
        <MockBadge record={document} />
      </div>
      <H className="card__title">
        <Link to={`/documents/${encodeURIComponent(document.id)}`} className="card__link">
          {document.title}
        </Link>
      </H>
      <p className="card__when">Published {formatDate(document.publishedDate, 'date not provided')}</p>
      {!document.url && <p className="card__note">No file linked yet</p>}
    </article>
  );
}
