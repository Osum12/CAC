import { Link, useParams } from 'react-router-dom';
import { getDocumentsForMeeting, getIssuesForMeeting, getMeetingById } from '../services/civicData';
import { formatDate, formatTime, meetingTypeLabel } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { DocumentCard, IssueCard } from '../components/Cards';
import { MockBadge, MockNotice } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { MeetingStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';

export function MeetingDetailPage() {
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
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/archive">Archive</Link> <span aria-hidden="true">/</span> <span>Meeting</span>
      </nav>
      <header className="detail__header">
        <div className="card__meta">
          <span className="eyebrow">{meetingTypeLabel(meeting.meetingType)}</span>
          <MockBadge record={meeting} size="lg" />
        </div>
        <h1 className="detail__title">{meeting.title}</h1>
        <div className="detail__status">
          <MeetingStatusBadge status={meeting.status} />
          <span className="muted">
            {formatDate(meeting.date)}
            {time ? ` at ${time}` : meeting.date ? ' · time not listed' : ''}
          </span>
        </div>
      </header>
      <MockNotice record={meeting} kind="meeting" />

      <div className="detail__grid">
        <div className="detail__main">
          <section aria-labelledby="m-summary-h">
            <h2 id="m-summary-h">About this meeting</h2>
            <p className="prose">{meeting.summary || 'No summary has been written for this meeting yet.'}</p>
          </section>

          <section aria-labelledby="m-docs-h">
            <h2 id="m-docs-h">Agenda and documents</h2>
            {documents.length ? (
              <div className="card-grid card-grid--tight">
                {documents.map((d) => (
                  <DocumentCard key={d.id} document={d} />
                ))}
              </div>
            ) : (
              <EmptyState title="No agenda or documents are linked to this meeting yet." />
            )}
            {missingDocs > 0 && <p className="card__note">{missingDocs} linked document(s) could not be found in the dataset.</p>}
          </section>

          <section aria-labelledby="m-issues-h">
            <h2 id="m-issues-h">Issues on the agenda</h2>
            {issues.length ? (
              <div className="card-grid card-grid--tight">
                {issues.map((i) => (
                  <IssueCard key={i.id} issue={i} />
                ))}
              </div>
            ) : (
              <EmptyState title="No issues are linked to this meeting." />
            )}
            <p className="fine-print">Being on an agenda does not mean an item was approved. Check each issue’s status.</p>
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel" aria-labelledby="m-watch-h">
            <h2 id="m-watch-h">Watch and verify</h2>
            <ul className="plain-list">
              <li>
                <SourceAction url={meeting.recordingUrl} label="Watch the recording" unavailableText="Recording not available" />
              </li>
              <li>
                <SourceAction url={meeting.officialPageUrl} label="Official meeting page" unavailableText="Official page not linked yet" />
              </li>
            </ul>
            <p className="muted">
              {meeting.lastVerifiedAt ? `Last checked ${formatDate(meeting.lastVerifiedAt.slice(0, 10))}.` : 'Not yet checked against an official source.'}
            </p>
          </section>
        </aside>
      </div>
    </article>
  );
}
