import { Link } from 'react-router-dom';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { formatCompactDate, formatDate, formatShortDate, formatTime, formatWeekday, humanize, meetingTypeLabel, primarySource, safeUrl } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { MockBadge, isMock } from './MockBadge';
import { IssueStatusBadge, MeetingStatusBadge } from './StatusBadge';
import { usePlaceHref } from '../services/placeContext';
import { PinIcon } from './PinIcon';

// Cards use a "stretched link": the title link's click area covers the whole card,
// so screen readers hear one clear link per card. Secondary actions (map, source,
// agenda) sit above that layer in `.card__actions` so they stay separately clickable.

type HeadingLevel = 2 | 3 | 4;

/**
 * Small outbound link used inside card action rows. `context` (usually the record title)
 * is added for screen readers so repeated links like "Open PDF" are distinguishable.
 */
export function ExternalAction({ href, children, context }: { href: string; children: string; context: string }) {
  // The last word and the arrow share a no-wrap span so the arrow never sits alone on a line.
  const cut = children.lastIndexOf(' ') + 1;
  return (
    <a className="card__action" href={href} target="_blank" rel="noopener noreferrer">
      <span>
        {children.slice(0, cut)}
        <span className="nowrap">
          {children.slice(cut)}
          <span className="visually-hidden">: {context}</span>
          <span aria-hidden="true">{'\u00a0'}↗</span>
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
    <article className={`card card--issue card--${issue.status}`}>
      <div className="issue__meta">
        <IssueStatusBadge status={issue.status} />
        <p className="issue__asof">{issue.statusAsOf ? `as of ${formatDate(issue.statusAsOf)}` : 'No status date recorded'}</p>
        <span className="tag">{humanize(issue.category)}</span>
        {isMock(issue) && <MockBadge record={issue} />}
      </div>
      <div className="issue__body">
        <H className="card__title">
          <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)} className="card__link">
            {issue.title}
          </Link>
        </H>
        <p className="card__summary">{issue.summary}</p>
        {issue.location?.label && (
          <p className="issue__where">
            <PinIcon className="icon-lead" />
            <span className="visually-hidden">Where: </span>
            {issue.location.label}
          </p>
        )}
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
    </article>
  );
}

export function MeetingCard({
  meeting,
  agenda,
  headingLevel = 3,
  note,
}: {
  meeting: Meeting;
  /** The meeting's agenda document, if one exists in the dataset. */
  agenda?: CivicDocument | null;
  headingLevel?: HeadingLevel;
  /** An optional line under the meeting, such as how many issues were on its agenda. */
  note?: string;
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
            <span className="datechip__month">{short.month}</span>
            <span className="datechip__day">{short.day}</span>
            <span className="datechip__weekday">{weekday}</span>
          </>
        ) : (
          <span className="datechip__month">TBD</span>
        )}
      </div>
      <div className="card__body">
        <span className="tag">{meetingTypeLabel(meeting.meetingType)}</span>
        <H className="card__title">
          <Link to={href(`/meetings/${encodeURIComponent(meeting.id)}`)} className="card__link">
            {meeting.title}
          </Link>
        </H>
        <dl className="facts">
          <div className="facts__row">
            <dt>When</dt>
            <dd>
              {/* The date chip shows the date to sighted readers; the full date stays here for screen readers. */}
              <time dateTime={meeting.date ?? undefined} className={short ? 'visually-hidden' : undefined}>
                {formatCompactDate(meeting.date)}
                {short ? ', ' : ''}
              </time>
              {short ? (time ?? 'Time not listed') : time ? `, ${time}` : ''}
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
        {note && <p className="card__note">{note}</p>}
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

const DOC_GROUP_LABELS: Record<string, string> = {
  agenda: 'Agendas',
  agenda_packet: 'Agenda packets',
  minutes: 'Minutes',
  presentation: 'Presentations',
  resolution: 'Resolutions',
  ordinance: 'Ordinances',
  draft_policy: 'Draft policies',
  fact_sheet: 'Fact sheets',
  staff_report: 'Staff reports',
  supporting_document: 'Supporting documents',
};

/** Documents sorted into labeled groups by type (agendas, presentations, …), in a fixed order. */
export function DocumentGroups({ documents, headingLevel = 3 }: { documents: CivicDocument[]; headingLevel?: 3 | 4 }) {
  const H = `h${headingLevel}` as const;
  const order = Object.keys(DOC_GROUP_LABELS);
  const types = [...new Set(documents.map((d) => d.documentType))].sort(
    (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b),
  );
  return (
    <div className="doc-groups">
      {types.map((t) => (
        <div key={t} className="doc-group">
          <H className="doc-group__title">{DOC_GROUP_LABELS[t] ?? humanize(t)}</H>
          <ul className="doc-list">
            {documents
              .filter((d) => d.documentType === t)
              .map((d) => (
                <li key={d.id}>
                  <DocumentCard document={d} headingLevel={4} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
