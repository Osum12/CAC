import { Link, useParams } from 'react-router-dom';
import { getDocumentsForIssue, getIssueById, getMeetingsForIssue } from '../services/civicData';
import { formatDate, humanize } from '../services/format';
import { getValidCoordinates } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { DocumentCard, MeetingCard } from '../components/Cards';
import { MockBadge, MockNotice } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { IssueStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';
import type { Issue } from '../types/civic';

export function IssueDetailPage() {
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
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/">Citywide</Link> <span aria-hidden="true">/</span> <span>Issue</span>
      </nav>
      <header className="detail__header">
        <div className="card__meta">
          <span className="eyebrow">{humanize(issue.category)}</span>
          <MockBadge record={issue} size="lg" />
        </div>
        <h1 className="detail__title">{issue.title}</h1>
        <div className="detail__status">
          <IssueStatusBadge status={issue.status} />
          <span className="muted">{issue.statusAsOf ? `Status as of ${formatDate(issue.statusAsOf)}` : 'No status date recorded'}</span>
        </div>
      </header>
      <MockNotice record={issue} kind="issue" />

      <div className="detail__grid">
        <div className="detail__main">
          <section aria-labelledby="summary-h">
            <h2 id="summary-h">Summary</h2>
            <p className="prose">{issue.summary || 'No summary has been written for this issue yet.'}</p>
          </section>

          <section aria-labelledby="why-h" className="callout">
            <h2 id="why-h">Why it may matter</h2>
            <p className="prose">{issue.whyItMayMatter || 'No explanation has been recorded for this issue.'}</p>
          </section>

          <section aria-labelledby="meetings-h">
            <h2 id="meetings-h">Discussed at</h2>
            {meetings.length ? (
              <div className="stack">
                {meetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} />
                ))}
              </div>
            ) : (
              <EmptyState title="No related meetings are linked to this issue." />
            )}
            {missingMeetings > 0 && <MissingNote count={missingMeetings} noun="meeting" />}
          </section>

          <section aria-labelledby="docs-h">
            <h2 id="docs-h">Documents</h2>
            {documents.length ? (
              <div className="card-grid card-grid--tight">
                {documents.map((d) => (
                  <DocumentCard key={d.id} document={d} />
                ))}
              </div>
            ) : (
              <EmptyState title="No documents are linked to this issue." />
            )}
            {missingDocs > 0 && <MissingNote count={missingDocs} noun="document" />}
          </section>
        </div>

        <aside className="detail__side">
          <LocationPanel issue={issue} />
          <section className="panel" aria-labelledby="sources-h">
            <h2 id="sources-h">Sources</h2>
            {issue.sourceUrls.length ? (
              <ul className="plain-list">
                {issue.sourceUrls.map((url, i) => (
                  <li key={i}>
                    <SourceAction url={url} label={sourceLabel(url, i)} unavailableText="Source link is not valid" />
                  </li>
                ))}
              </ul>
            ) : (
              <SourceAction url={null} label="" unavailableText="No official source has been added for this record yet." />
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}

function LocationPanel({ issue }: { issue: Issue }) {
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
          {loc.address && loc.label && <p>{loc.address}</p>}
          <p className="muted">
            {loc.verified
              ? 'Location checked against the source.'
              : loc.locationType === 'mock_marker'
                ? 'Sample map point for testing. It is not a real project site.'
                : loc.locationType === 'approximate'
                  ? 'The street address comes from the city document. The map point is approximate: it was looked up from that address, not taken from an exact site boundary.'
                  : 'The exact location has not been mapped.'}
          </p>
          {coords ? (
            <Link to={`/near-me?issue=${encodeURIComponent(issue.id)}`} className="text-link">
              See it on the Near Me map →
            </Link>
          ) : (
            <p className="muted">This issue isn’t shown on the map because the source gives no exact address.</p>
          )}
        </>
      )}
    </section>
  );
}

/** Names a source link by where it points, so readers know what they will open. */
function sourceLabel(url: string, index: number): string {
  if (/portal\.civicclerk\.com\/event\//.test(url)) return 'Meeting page on the city’s portal';
  if (/civicclerk\.com\/.*GetMeetingFileStream/.test(url)) return 'Official meeting document (PDF)';
  return `Official source ${index + 1}`;
}

function MissingNote({ count, noun }: { count: number; noun: string }) {
  return (
    <p className="card__note">
      {count} linked {noun}
      {count > 1 ? 's' : ''} could not be found in the dataset.
    </p>
  );
}
