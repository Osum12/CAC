import { Link } from 'react-router-dom';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { formatCompactDate, formatDate, formatShortDate, formatTime, formatWeekday, humanize, meetingTypeLabel, primarySource, safeUrl } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { MockBadge, isMock } from './MockBadge';
import { IssueStatusBadge, MeetingStatusBadge } from './StatusBadge';
import { usePlaceHref } from '../services/placeContext';

// Cards use a "stretched link": the title link's click area covers the whole card,
// so screen readers hear one clear link per card. Secondary actions (map, source,
// agenda) sit above that layer in `.card__actions` so they stay separately clickable.

type HeadingLevel = 2 | 3 | 4;

/**
 * Small outbound link used inside card action rows. `context` (usually the record title)
 * is added for screen readers so repeated links like "Open PDF" are distinguishable.
 */
export function ExternalAction({ href, children, context }: { href: string; children: string; context: string }) {
  const cut = children.lastIndexOf(' ') + 1;
  return (
    <a className="card__action" href={href} target="_blank" rel="noopener noreferrer">
      {/* One text run, so the underline is unbroken; the last word and the arrow never separate. */}
      <span>
        {children.slice(0, cut)}
        <span className="nowrap">
          {children.slice(cut)}
          <span className="visually-hidden">: {context}</span>
          <span aria-hidden="true">{' '}↗</span>
        </span>
      </span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function IssueCard({ issue, headingLevel = 3 }: { issue: Issue; headingLevel?: HeadingLevel }) {
  const href = usePlaceHref();
  const H = `h${headingLevel}` as const;
  const source = isMock(issue) ? null : primarySource(issue.sourceUrls);
  const mappable = getValidCoordinates(issue) !== null;
  return (
    <article className="card card--issue row">
      <div className="card__top row__topic">
        <span className="tag">{humanize(issue.category)}</span>
        {isMock(issue) && <MockBadge record={issue} />}
      </div>
      <div className="row__main">
        <H className="card__title">
          <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)} className="card__link">
            {issue.title}
          </Link>
        </H>
        <p className="card__summary">{issue.summary}</p>
        <p className={`row__where${issue.location ? '' : ' row__where--none'}`}>
          <span className="row__key">Where</span> {issue.location?.label ?? 'No specific address in the record'}
        </p>
        <div className="card__actions">
          {mappable && (
            <Link className="card__action" to={href(`/near-me?issue=${encodeURIComponent(issue.id)}`)}>
              View on map<span className="visually-hidden">: {issue.title}</span>
            </Link>
          )}
          {source ? (
            <ExternalAction href={source} context={issue.title}>
              Official record
            </ExternalAction>
          ) : (
            <span className="card__action card__action--muted">No official source linked</span>
          )}
        </div>
      </div>
      <p className="row__date">
        {issue.statusAsOf ? (
          <>
            <span className="visually-hidden">Status as of </span>
            <time dateTime={issue.statusAsOf}>{formatCompactDate(issue.statusAsOf)}</time>
          </>
        ) : (
          'No date recorded'
        )}
      </p>
      <p className="row__status">
        <span className="visually-hidden">Status: </span>
        <IssueStatusBadge status={issue.status} />
      </p>
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
  const href = usePlaceHref();
  const H = `h${headingLevel}` as const;
  const short = formatShortDate(meeting.date);
  const weekday = formatWeekday(meeting.date);
  const time = formatTime(meeting.startTime);
  const agendaUrl = agenda && !isMock(agenda) ? safeUrl(agenda.url) : null;
  return (
    <article className="card card--meeting row row--meeting">
      <div className="datechip" aria-hidden="true">
        {short ? (
          <>
            <span className="datechip__month">{short.month}</span>
            <span className="datechip__day">{short.day}</span>
            <span className="datechip__weekday">{weekday}</span>
          </>
        ) : (
          <span className="datechip__month">TBD</span>
        )}
      </div>
      <div className="card__body row__main">
        <span className="tag">{meetingTypeLabel(meeting.meetingType)}</span>
        <H className="card__title">
          <Link to={href(`/meetings/${encodeURIComponent(meeting.id)}`)} className="card__link">
            {meeting.title}
          </Link>
        </H>
        <p className="row__when">
          <span className="row__key">When</span> <time dateTime={meeting.date ?? undefined}>{formatCompactDate(meeting.date)}</time>
          {time ? `, ${time}` : ''}
        </p>
        {(agendaUrl || isMock(meeting)) && (
          <div className="card__actions">
            {agendaUrl && (
              <ExternalAction href={agendaUrl} context={meeting.title}>
                Agenda (PDF)
              </ExternalAction>
            )}
            {isMock(meeting) && <MockBadge record={meeting} />}
          </div>
        )}
      </div>
      <p className="row__status">
        <span className="visually-hidden">Status: </span>
        <MeetingStatusBadge status={meeting.status} />
      </p>
    </article>
  );
}

export function DocumentCard({ document, headingLevel = 3 }: { document: CivicDocument; headingLevel?: HeadingLevel }) {
  const href = usePlaceHref();
  const H = `h${headingLevel}` as const;
  const url = isMock(document) ? null : safeUrl(document.url);
  return (
    <article className="card card--document row row--document">
      <div className="card__top row__topic">
        <span className="tag">{humanize(document.documentType)}</span>
        {isMock(document) && <MockBadge record={document} />}
      </div>
      <div className="row__main">
      <H className="card__title">
        <Link to={href(`/documents/${encodeURIComponent(document.id)}`)} className="card__link">
          {document.title}
        </Link>
      </H>
      {document.publishedDate && <p className="card__when">Published {formatDate(document.publishedDate)}</p>}
      </div>
      <div className="card__actions row__aside">
        {url ? (
          <ExternalAction href={url} context={document.title}>
            {/GetMeetingFileStream|\.pdf$/i.test(url) ? 'Open PDF' : 'Open document'}
          </ExternalAction>
        ) : (
          <span className="card__action card__action--muted">No file linked yet</span>
        )}
      </div>
    </article>
  );
}
