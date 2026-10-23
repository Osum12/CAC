import { Link, useParams } from 'react-router-dom';
import { getDocumentsForIssue, getIssueById, getMeetingsForIssue } from '../services/civicData';
import { formatDate, formatTime, humanize, meetingStatusLabel, meetingTypeLabel, sourceLabel } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { BackLink } from '../components/BackLink';
import { DocumentCard } from '../components/Cards';
import { MockBadge, MockNotice, isMock } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { IssueStatusBadge, StatusIcon, issueIconKind } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';
import { PinIcon } from '../components/PinIcon';
import type { Issue, Meeting } from '../types/civic';
import { usePlaceHref } from '../services/placeContext';

export function IssueDetailPage() {
  const href = usePlaceHref();
  const { issueId = '' } = useParams();
  const state = useAsync(async () => {
    const issue = await getIssueById(issueId);
    if (!issue) return null;
    const [meetings, documents] = await Promise.all([getMeetingsForIssue(issueId), getDocumentsForIssue(issueId)]);
    return { issue, meetings, documents };
  }, [issueId]);
  usePageTitle(state.status === 'ready' && state.data ? state.data.issue.title : 'Issue');

  if (state.status === 'loading') return <div className="page"><LoadingState /></div>;
  if (state.status === 'error') return <div className="page"><ErrorState onRetry={state.retry} /></div>;
  if (!state.data) return <NotFound kind="issue" />;

  const { issue, meetings, documents } = state.data;
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
      </header>
      <MockNotice record={issue} kind="issue" />

      <section className="statusband" aria-labelledby="timeline-h">
        <div className="statusband__inner">
          <div className="detail__status statusband__now">
            <span className="statusband__label">Current status:</span>
            <IssueStatusBadge status={issue.status} />
            <span className="statusband__asof">{issue.statusAsOf ? `Status as of ${formatDate(issue.statusAsOf)}` : 'No status date recorded'}</span>
          </div>
          <h2 id="timeline-h" className="statusband__title">
            Timeline
          </h2>
          {meetings.length ? (
            <StatusStepper issue={issue} meetings={meetings} />
          ) : (
            <EmptyState title="No related meetings are linked to this issue." />
          )}
          {missingMeetings > 0 && <MissingNote count={missingMeetings} noun="meeting" />}
          <p className="statusband__note">
            Being on an agenda does not mean an item was approved.
            {!isMock(issue) && ' The status above comes from the recorded vote or official recommendation.'}
          </p>
        </div>
      </section>

      <div className="detail__grid">
        <div className="detail__main">
          <section aria-labelledby="summary-h">
            <h2 id="summary-h">In plain language</h2>
            <p className="prose">{issue.summary || 'No summary has been written for this issue yet.'}</p>
            {!isMock(issue) && (
              <p className="fine-print">This summary is a plain-language rewrite of the official documents listed below. Check them for the exact wording.</p>
            )}
          </section>

          <section aria-labelledby="why-h" className="callout">
            <h2 id="why-h">Why it may matter</h2>
            <p className="prose">{issue.whyItMayMatter || 'No explanation has been recorded for this issue.'}</p>
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

/** What the last step says: the recorded status in one sentence, with its date when there is one. */
function outcomeText(issue: Issue): string {
  const on = issue.statusAsOf ? formatDate(issue.statusAsOf) : null;
  switch (issue.status) {
    case 'approved':
      return on ? `Approved on ${on}` : 'Approved (no date recorded)';
    case 'completed':
      return on ? `Completed on ${on}` : 'Completed (no date recorded)';
    case 'denied':
      return on ? `Denied on ${on}` : 'Denied (no date recorded)';
    case 'withdrawn':
      return on ? `Withdrawn on ${on}` : 'Withdrawn (no date recorded)';
    case 'under_consideration':
      return on ? `Still under consideration as of ${on}` : 'Still under consideration';
    case 'proposed':
      return on ? `Proposed, as of ${on}` : 'Proposed, no date recorded';
    default:
      return 'No verified outcome yet';
  }
}

const OUTCOME_TONE: Record<string, string> = {
  approved: 'approved',
  completed: 'approved',
  denied: 'stopped',
  withdrawn: 'stopped',
  under_consideration: 'current',
  proposed: 'current',
};

/**
 * The issue's path, built only from what the record holds: each linked meeting, in date
 * order, then the recorded status. No stages are assumed beyond those.
 */
function StatusStepper({ issue, meetings }: { issue: Issue; meetings: Meeting[] }) {
  const href = usePlaceHref();
  const sorted = [...meetings].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const tone = OUTCOME_TONE[issue.status] ?? 'unknown';
  return (
    <ol className={`stepper stepper--${sorted.length + 1}`}>
      {sorted.map((m) => {
        const time = formatTime(m.startTime);
        const state = m.status === 'completed' ? 'done' : m.status === 'canceled' ? 'canceled' : 'upcoming';
        return (
          <li key={m.id} className={`stepper__step stepper__step--${state}`}>
            <span className="stepper__node" aria-hidden="true">
              <StatusIcon kind={state === 'done' ? 'check' : state === 'canceled' ? 'cross' : 'calendar'} className="stepper__icon" />
            </span>
            <p className="stepper__kicker">
              <time dateTime={m.date ?? undefined}>{formatDate(m.date)}</time>
              {time ? ` at ${time}` : ''}
            </p>
            <p className="stepper__title">
              <Link to={href(`/meetings/${encodeURIComponent(m.id)}`)}>{m.title}</Link>
            </p>
            <p className="stepper__meta">
              On the agenda. {meetingTypeLabel(m.meetingType)} meeting, {meetingStatusLabel(m.status).toLowerCase()}.
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
      <li className={`stepper__step stepper__step--outcome stepper__step--${tone}`} aria-current={tone === 'current' ? 'step' : undefined}>
        <span className="stepper__node" aria-hidden="true">
          <StatusIcon kind={issueIconKind(issue.status)} className="stepper__icon" />
        </span>
        <p className="stepper__kicker">Recorded status</p>
        <p className="stepper__title">{outcomeText(issue)}</p>
      </li>
    </ol>
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
              <PinIcon className="icon-lead" />
              View on map
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
