import { Link } from 'react-router-dom';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { formatDate, formatShortDate, formatTime, formatWeekday, humanize, meetingTypeLabel, primarySource, safeUrl } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { MockBadge, isMock } from './MockBadge';
import { IssueStatusBadge, MeetingStatusBadge } from './StatusBadge';

// Cards use a "stretched link": the title link's click area covers the whole card,
// so screen readers hear one clear link per card. Secondary actions (map, source,
// agenda) sit above that layer in `.card__actions` so they stay separately clickable.

type HeadingLevel = 2 | 3 | 4;

/** Small outbound link used inside card action rows. */
function ExternalAction({ href, children }: { href: string; children: string }) {
  return (
    <a className="card__action" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function IssueCard({ issue, headingLevel = 3 }: { issue: Issue; headingLevel?: HeadingLevel }) {
  const H = `h${headingLevel}` as const;
  const source = isMock(issue) ? null : primarySource(issue.sourceUrls);
  const mappable = getValidCoordinates(issue) !== null;
  return (
    <article className="card card--issue">
      <div className="card__top">
        <span className="eyebrow">{humanize(issue.category)}</span>
        <IssueStatusBadge status={issue.status} />
      </div>
      <H className="card__title">
        <Link to={`/issues/${encodeURIComponent(issue.id)}`} className="card__link">
          {issue.title}
        </Link>
      </H>
      <p className="card__summary">{issue.summary}</p>
      <p className="card__meta-line">
        {issue.statusAsOf ? `Status as of ${formatDate(issue.statusAsOf)}` : 'No status date recorded'}
        {isMock(issue) && (
          <>
            {' '}
            <MockBadge record={issue} />
          </>
        )}
      </p>
      <div className="card__actions">
        {mappable && (
          <Link className="card__action" to={`/near-me?issue=${encodeURIComponent(issue.id)}`}>
            <span aria-hidden="true" className="icon-lead">⌖</span>View on map<span className="visually-hidden">: {issue.title}</span>
          </Link>
        )}
        {source ? (
          <ExternalAction href={source}>Official record</ExternalAction>
        ) : (
          <span className="card__action card__action--muted">No official source linked</span>
        )}
      </div>
    </article>
  );
}

export function MeetingCard({
  meeting,
  agenda,
  headingLevel = 3,
}: {
  meeting: Meeting;
  /** The meeting's agenda document, if one exists in the dataset. */
  agenda?: CivicDocument | null;
  headingLevel?: HeadingLevel;
}) {
  const H = `h${headingLevel}` as const;
  const short = formatShortDate(meeting.date);
  const weekday = formatWeekday(meeting.date);
  const time = formatTime(meeting.startTime);
  const agendaUrl = agenda && !isMock(agenda) ? safeUrl(agenda.url) : null;
  return (
    <article className="card card--meeting">
      <div className="datechip" aria-hidden="true">
        {short ? (
          <>
            <span className="datechip__weekday">{weekday}</span>
            <span className="datechip__day">{short.day}</span>
            <span className="datechip__month">{short.month}</span>
          </>
        ) : (
          <span className="datechip__month">TBD</span>
        )}
      </div>
      <div className="card__body">
        <div className="card__top">
          <span className="eyebrow">{meetingTypeLabel(meeting.meetingType)}</span>
          <MeetingStatusBadge status={meeting.status} />
        </div>
        <H className="card__title">
          <Link to={`/meetings/${encodeURIComponent(meeting.id)}`} className="card__link">
            {meeting.title}
          </Link>
        </H>
        <p className="card__when">
          <time dateTime={meeting.date ?? undefined}>{formatDate(meeting.date)}</time>
          {time ? ` · ${time}` : ''}
        </p>
        {(agendaUrl || isMock(meeting)) && (
          <div className="card__actions">
            {agendaUrl && <ExternalAction href={agendaUrl}>Agenda (PDF)</ExternalAction>}
            {isMock(meeting) && <MockBadge record={meeting} />}
          </div>
        )}
      </div>
    </article>
  );
}

export function DocumentCard({ document, headingLevel = 3 }: { document: CivicDocument; headingLevel?: HeadingLevel }) {
  const H = `h${headingLevel}` as const;
  const url = isMock(document) ? null : safeUrl(document.url);
  return (
    <article className="card card--document">
      <div className="card__top">
        <span className="eyebrow">{humanize(document.documentType)}</span>
        {isMock(document) && <MockBadge record={document} />}
      </div>
      <H className="card__title">
        <Link to={`/documents/${encodeURIComponent(document.id)}`} className="card__link">
          {document.title}
        </Link>
      </H>
      <p className="card__when">Published {formatDate(document.publishedDate, 'date not provided')}</p>
      <div className="card__actions">
        {url ? (
          <ExternalAction href={url}>{/GetMeetingFileStream/.test(url) ? 'Open PDF' : 'Open document'}</ExternalAction>
        ) : (
          <span className="card__action card__action--muted">No file linked yet</span>
        )}
      </div>
    </article>
  );
}
