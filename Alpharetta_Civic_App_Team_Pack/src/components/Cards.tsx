import { Fragment } from 'react';
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
  return (
    <a className="card__action" href={href} target="_blank" rel="noopener noreferrer">
      <WithArrow text={children} />
      <span className="visually-hidden">: {context}</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

/** Link text whose last word and the outbound "↗" never part across a line break. */
export function WithArrow({ text }: { text: string }) {
  const cut = text.lastIndexOf(' ');
  return (
    <span>
      {cut >= 0 ? text.slice(0, cut + 1) : ''}
      <span className="nowrap">
        {text.slice(cut + 1)}
        <span aria-hidden="true">{' '}↗</span>
      </span>
    </span>
  );
}

/**
 * Keeps vote tallies and ranges such as "5-0" or "4-1" on one line. The text itself is
 * unchanged; each tally is only wrapped in a no-break span.
 */
export function KeepTallies({ text }: { text: string }) {
  const parts = text.split(/(\d+-\d+)/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span key={i} className="nowrap">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function IssueCard({ issue, headingLevel = 3 }: { issue: Issue; headingLevel?: HeadingLevel }) {
  const href = usePlaceHref();
  const H = `h${headingLevel}` as const;
  const source = isMock(issue) ? null : primarySource(issue.sourceUrls);
  const mappable = getValidCoordinates(issue) !== null;
  return (
    <article className="card card--issue">
      {/* Topic and status share one column on wide screens (see .card__meta in global.css). */}
      <div className="card__meta">
      <div className="card__top">
        <span className="tag">{humanize(issue.category)}</span>
        {isMock(issue) && <MockBadge record={issue} />}
      </div>
      <dl className="facts">
        <div className="facts__row facts__row--status">
          <dt>Status</dt>
          <dd>
            <IssueStatusBadge status={issue.status} />
            <span className="facts__note">{issue.statusAsOf ? ` as of ${formatDate(issue.statusAsOf)}` : ' (no date recorded)'}</span>
          </dd>
        </div>
        <div className={`facts__row${issue.location ? '' : ' facts__row--no-place'}`}>
          <dt>Where</dt>
          <dd>{issue.location?.label ?? 'No specific address in the record'}</dd>
        </div>
      </dl>
      </div>
      <H className="card__title">
        <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)} className="card__link">
          {issue.title}
        </Link>
      </H>
      <p className="card__summary">
        <KeepTallies text={issue.summary} />
      </p>
      <div className="card__actions">
        {mappable && (
          <Link className="card__action" to={href(`/near-me?issue=${encodeURIComponent(issue.id)}`)}>
            <span aria-hidden="true" className="icon-lead">⌖</span>View on map<span className="visually-hidden">: {issue.title}</span>
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
        <span className="tag card__eyebrow">{meetingTypeLabel(meeting.meetingType)}</span>
        <H className="card__title">
          <Link to={href(`/meetings/${encodeURIComponent(meeting.id)}`)} className="card__link">
            {meeting.title}
          </Link>
        </H>
        <dl className="facts">
          <div className="facts__row">
            <dt>When</dt>
            <dd>
              {/* The date chip and the title already show the date, so with a start time the
                  row shows only the time; the date stays available to screen readers. */}
              <time dateTime={meeting.date ?? undefined} className={time && meeting.date ? 'visually-hidden' : undefined}>
                {formatCompactDate(meeting.date)}
                {time && meeting.date ? ', ' : ''}
              </time>
              {time ? `${meeting.date ? '' : ', '}${time}` : ''}
            </dd>
          </div>
          <div className="facts__row">
            <dt>Status</dt>
            <dd>
              <MeetingStatusBadge status={meeting.status} />
            </dd>
          </div>
        </dl>
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
    </article>
  );
}

export function DocumentCard({ document, headingLevel = 3 }: { document: CivicDocument; headingLevel?: HeadingLevel }) {
  const href = usePlaceHref();
  const H = `h${headingLevel}` as const;
  const url = isMock(document) ? null : safeUrl(document.url);
  return (
    <article className="card card--document">
      <div className="card__top">
        <span className="tag">{humanize(document.documentType)}</span>
        {isMock(document) && <MockBadge record={document} />}
      </div>
      <H className="card__title">
        <Link to={href(`/documents/${encodeURIComponent(document.id)}`)} className="card__link">
          {document.title}
        </Link>
      </H>
      {document.publishedDate && <p className="card__when">Published {formatDate(document.publishedDate)}</p>}
      <div className="card__actions">
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
