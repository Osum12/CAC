import { useParams } from 'react-router-dom';
import { getDocumentsForMeeting, getIssuesForMeeting, getMeetingById } from '../services/civicData';
import { formatDate, formatTime, meetingTypeLabel } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { DocumentCard, IssueCard } from '../components/Cards';
import { MockBadge, MockNotice, isMock } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { MeetingStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';
import { BackLink } from '../components/BackLink';
import { usePlaceHref, useRecordSources } from '../services/placeContext';

export function MeetingDetailPage() {
  const href = usePlaceHref();
  const sources = useRecordSources();
  const { meetingId = '' } = useParams();
  const state = useAsync(async () => {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) return null;
    const [documents, issues] = await Promise.all([getDocumentsForMeeting(meetingId), getIssuesForMeeting(meetingId)]);
    return { meeting, documents, issues };
  }, [meetingId]);
  usePageTitle(state.status === 'ready' && state.data ? state.data.meeting.title : 'Meeting');

  if (state.status === 'loading') return <div className="page"><LoadingState /></div>;
  if (state.status === 'error') return <div className="page"><ErrorState onRetry={state.retry} /></div>;
  if (!state.data) return <NotFound kind="meeting" />;

  const { meeting, documents, issues } = state.data;
  const time = formatTime(meeting.startTime);
  const missingDocs = meeting.agendaDocumentIds.filter((id) => !documents.some((d) => d.id === id)).length;

  return (
    <article className="page detail">
      <BackLink fallbackTo={href('/archive')} fallbackLabel="Archive" />
      <div className="detail__grid">
        <header className="detail__header">
          <div className="card__top detail__kicker">
            <span className="tag">{meetingTypeLabel(meeting.meetingType)}</span>
            {sources && <span className="detail__body">{sources}</span>}
            {isMock(meeting) && <MockBadge record={meeting} size="lg" />}
          </div>
          <h1 className="detail__title">{meeting.title}</h1>
        </header>

        <aside className="detail__side">
          <dl className="record-meta">
            <div className="record-meta__row">
              <dt>Status</dt>
              <dd>
                <MeetingStatusBadge status={meeting.status} />
              </dd>
            </div>
            <div className="record-meta__row">
              <dt>Date</dt>
              <dd className="record-meta__mono">
                {formatDate(meeting.date)}
                {time ? ` at ${time}` : meeting.date ? ' (time not listed)' : ''}
              </dd>
            </div>
          </dl>
          <section className="panel panel--sources" aria-labelledby="m-watch-h">
            <h2 id="m-watch-h">Watch and verify</h2>
            <ul className="plain-list">
              <li>
                <SourceAction url={meeting.recordingUrl} label="Watch the recording" unavailableText={meeting.status === 'scheduled' ? 'No recording yet: this meeting hasn’t happened' : 'Recording not available'} />
              </li>
              <li>
                <SourceAction url={meeting.officialPageUrl} label="Official meeting page" unavailableText="Official page not linked yet" />
              </li>
            </ul>
            <p className="panel__checked">
              {meeting.lastVerifiedAt ? `Last checked ${formatDate(meeting.lastVerifiedAt.slice(0, 10))}.` : 'Not yet checked against an official source.'}
            </p>
          </section>
        </aside>

        <div className="detail__main">
          <MockNotice record={meeting} kind="meeting" />
          <section aria-labelledby="m-summary-h">
            <h2 id="m-summary-h">About this meeting</h2>
            <p className="prose">{meeting.summary || 'No summary has been written for this meeting yet.'}</p>
          </section>

          <section aria-labelledby="m-docs-h">
            <h2 id="m-docs-h">Agenda and documents</h2>
            {documents.length ? (
              <ul className="doc-list">
                {documents.map((d) => (
                  <li key={d.id}>
                    <DocumentCard document={d} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No agenda or documents are linked to this meeting yet." />
            )}
            {missingDocs > 0 && <p className="card__note">{missingDocs} linked document(s) could not be found in the dataset.</p>}
          </section>

          <section aria-labelledby="m-issues-h">
            <h2 id="m-issues-h">Issues on the agenda</h2>
            {issues.length ? (
              <ul className="issue-list">
                {issues.map((i) => (
                  <li key={i.id}>
                    <IssueCard issue={i} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No issues are linked to this meeting." />
            )}
            <p className="fine-print">Being on an agenda does not mean an item was approved. Check each issue’s status.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
