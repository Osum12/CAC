import { Link, useParams } from 'react-router-dom';
import { getDocumentsForIssue, getIssueById, getIssues, getMeetingsForIssue } from '../services/civicData';
import { formatDate, formatTime, humanize, meetingStatusLabel, meetingTypeLabel, sourceLabel } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { BackLink } from '../components/BackLink';
import { DocumentCard, KeepTallies } from '../components/Cards';
import { MockBadge, MockNotice, isMock } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { IssueStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';
import type { Issue, Meeting } from '../types/civic';
import { usePlaceHref } from '../services/placeContext';
import { shortDate, StatusDot, StatusTrack } from '../components/DataDesk';

export function IssueDetailPage() {
  const href = usePlaceHref();
  const { issueId = '' } = useParams();
  const state = useAsync(async () => {
    const issue = await getIssueById(issueId);
    if (!issue) return null;
    const [meetings, documents, all] = await Promise.all([getMeetingsForIssue(issueId), getDocumentsForIssue(issueId), getIssues()]);
    return { issue, meetings, documents, all };
  }, [issueId]);
  usePageTitle(state.status === 'ready' && state.data ? state.data.issue.title : 'Issue');

  if (state.status === 'loading') return <div className="page"><LoadingState /></div>;
  if (state.status === 'error') return <div className="page"><ErrorState onRetry={state.retry} /></div>;
  if (!state.data) return <NotFound kind="issue" />;

  const { issue, meetings, documents, all } = state.data;
  const missingMeetings = issue.meetingIds.filter((id) => !meetings.some((m) => m.id === id)).length;
  const missingDocs = issue.documentIds.filter((id) => !documents.some((d) => d.id === id)).length;

  return (
    <article className="page detail">
      <BackLink fallbackTo={href('/')} fallbackLabel="All issues" />
      <header className="detail__header">
        <div className="card__top">
          <span className="tag">{humanize(issue.category)}</span>
          {isMock(issue) && <MockBadge record={issue} size="lg" />}
        </div>
        <h1 className="detail__title">{issue.title}</h1>
        <div className="detail__status">
          <IssueStatusBadge status={issue.status} />
          <span className="muted">{issue.statusAsOf ? `Status as of ${formatDate(issue.statusAsOf)}` : 'No status date recorded'}</span>
        </div>
        <dl className="ledger" aria-label="Linked records">
          <div className="ledger__item">
            <dt>Meetings</dt>
            <dd className="num">{meetings.length}</dd>
          </div>
          <div className="ledger__item">
            <dt>Documents</dt>
            <dd className="num">{documents.length}</dd>
          </div>
          <div className="ledger__item">
            <dt>Official sources</dt>
            <dd className="num">{issue.sourceUrls.length}</dd>
          </div>
        </dl>
      </header>
      <MockNotice record={issue} kind="issue" />

      <div className="detail__grid">
        <div className="detail__main">
          <section aria-labelledby="summary-h">
            <h2 id="summary-h">In plain language</h2>
            <p className="prose">{issue.summary ? <KeepTallies text={issue.summary} /> : 'No summary has been written for this issue yet.'}</p>
            {!isMock(issue) && (
              <p className="fine-print">This summary is a plain-language rewrite of the official documents listed below. Check them for the exact wording.</p>
            )}
          </section>

          <section aria-labelledby="why-h" className="callout">
            <h2 id="why-h">Why it may matter</h2>
            <p className="prose">{issue.whyItMayMatter || 'No explanation has been recorded for this issue.'}</p>
          </section>

          <section aria-labelledby="timeline-h">
            <h2 id="timeline-h">Timeline</h2>
            {meetings.length > 0 && <StatusTrack issue={issue} meetings={meetings} />}
            {meetings.length ? <MeetingTimeline meetings={meetings} /> : <EmptyState title="No related meetings are linked to this issue." />}
            {missingMeetings > 0 && <MissingNote count={missingMeetings} noun="meeting" />}
            <p className="fine-print">
              Being on an agenda does not mean an item was approved.
              {!isMock(issue) && ' The status above comes from the recorded vote or official recommendation.'}
            </p>
          </section>

          <section aria-labelledby="docs-h">
            <h2 id="docs-h">Documents</h2>
            {documents.length ? (
              <ul className="card-grid card-grid--tight">
                {documents.map((d) => (
                  <li key={d.id}>
                    <DocumentCard document={d} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No documents are linked to this issue." />
            )}
            {missingDocs > 0 && <MissingNote count={missingDocs} noun="document" />}
          </section>

          <RelatedRecords issue={issue} all={all} />
        </div>

        <aside className="detail__side">
          <section className="panel" aria-labelledby="sources-h">
            <h2 id="sources-h">Official sources</h2>
            {issue.sourceUrls.length ? (
              <ul className="plain-list">
                {issue.sourceUrls.map((url, i) => (
                  <li key={i}>
                    <SourceAction url={url} label={numberedSourceLabel(issue.sourceUrls, i)} unavailableText="Source link is not valid" />
                  </li>
                ))}
              </ul>
            ) : (
              <SourceAction url={null} label="" unavailableText="No official source has been added for this record yet." />
            )}
          </section>
          <LocationPanel issue={issue} />
        </aside>
      </div>
    </article>
  );
}

/** Related meetings in date order, so readers can follow the issue's path through its meetings. */
function MeetingTimeline({ meetings }: { meetings: Meeting[] }) {
  const href = usePlaceHref();
  const sorted = [...meetings].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  return (
    <ol className="timeline">
      {sorted.map((m) => {
        const time = formatTime(m.startTime);
        return (
          <li key={m.id} className={`timeline__item timeline__item--${m.status === 'scheduled' ? 'upcoming' : 'past'}`}>
            <p className="timeline__date">
              <time dateTime={m.date ?? undefined}>{formatDate(m.date)}</time>
              {time ? ` at ${time}` : ''}
            </p>
            <p className="timeline__title">
              <Link to={href(`/meetings/${encodeURIComponent(m.id)}`)}>{m.title}</Link>
            </p>
            <p className="timeline__meta">
              {meetingTypeLabel(m.meetingType)} meeting, {meetingStatusLabel(m.status).toLowerCase()}
              {isMock(m) && (
                <>
                  {' '}
                  <MockBadge record={m} />
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Other items that went through the same meetings, then other items on the same topic. Each row
 * shows its status as a glyph (named for screen readers) and the date that status was recorded.
 */
function RelatedRecords({ issue, all }: { issue: Issue; all: Issue[] }) {
  const others = all.filter((i) => i.id !== issue.id);
  const shared = (i: Issue) => i.meetingIds.filter((m) => issue.meetingIds.includes(m)).length;
  const sameMeetings = others
    .filter((i) => shared(i) > 0)
    .sort((a, b) => shared(b) - shared(a) || (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? ''))
    .slice(0, 6);
  const sameTopic = others
    .filter((i) => i.category === issue.category && !sameMeetings.includes(i))
    .sort((a, b) => (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? ''))
    .slice(0, 4);
  if (!sameMeetings.length && !sameTopic.length) return null;
  return (
    <section aria-labelledby="related-h">
      <h2 id="related-h">Related records</h2>
      <div className="related">
        {sameMeetings.length > 0 && (
          <RelatedList title="Taken up at the same meetings" items={sameMeetings} note={(i) => `${shared(i)} shared ${shared(i) === 1 ? 'meeting' : 'meetings'}`} />
        )}
        {sameTopic.length > 0 && <RelatedList title={`More on ${humanize(issue.category).toLowerCase()}`} items={sameTopic} />}
      </div>
    </section>
  );
}

function RelatedList({ title, items, note }: { title: string; items: Issue[]; note?: (i: Issue) => string }) {
  const href = usePlaceHref();
  return (
    <div className="related__group">
      <h3 className="related__title">{title}</h3>
      <ul className="related__list">
        {items.map((i) => (
          <li key={i.id} className="related__item">
            <StatusDot status={i.status} />
            <span className="related__body">
              <Link to={href(`/issues/${encodeURIComponent(i.id)}`)} className="related__link">
                {i.title}
              </Link>
              <span className="related__meta">
                {i.statusAsOf ? `Status from ${shortDate(i.statusAsOf)}` : 'No status date'}
                {note ? `, ${note(i)}` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LocationPanel({ issue }: { issue: Issue }) {
  const href = usePlaceHref();
  const loc = issue.location;
  const coords = getValidCoordinates(issue);
  return (
    <section className="panel" aria-labelledby="location-h">
      <h2 id="location-h">Location</h2>
      {!loc ? (
        <p className="muted">No location is recorded for this issue, so it does not appear on the map.</p>
      ) : (
        <>
          <p className="panel__strong">{loc.label ?? loc.address ?? 'Unnamed location'}</p>
          {loc.address && loc.address !== loc.label && <p>{loc.address}</p>}
          <p className="muted">
            {loc.verified
              ? 'Location checked against the source.'
              : loc.locationType === 'mock_marker'
                ? 'Sample map point for testing. It is not a real project site.'
                : loc.locationType === 'approximate'
                  ? 'The street address comes from the official record. The map point is approximate: it was looked up from that address, not taken from an exact site boundary.'
                  : 'The exact location has not been mapped.'}
          </p>
          {coords ? (
            <Link to={href(`/near-me?issue=${encodeURIComponent(issue.id)}`)} className="button button--small">
              <span aria-hidden="true" className="icon-lead">⌖</span>View on map
            </Link>
          ) : (
            <p className="muted">This issue isn’t shown on the map because the source gives no exact address.</p>
          )}
        </>
      )}
    </section>
  );
}

function MissingNote({ count, noun }: { count: number; noun: string }) {
  return (
    <p className="card__note">
      {count} linked {noun}
      {count > 1 ? 's' : ''} could not be found in the dataset.
    </p>
  );
}

/** Source labels, numbered when several links share one ("Item record … (1 of 2)"), so each is distinct. */
function numberedSourceLabel(urls: string[], i: number): string {
  const labels = urls.map((u, k) => sourceLabel(u, k));
  const same = labels.map((l, k) => (l === labels[i] ? k : -1)).filter((k) => k >= 0);
  return same.length > 1 ? `${labels[i]} (${same.indexOf(i) + 1} of ${same.length})` : labels[i];
}
