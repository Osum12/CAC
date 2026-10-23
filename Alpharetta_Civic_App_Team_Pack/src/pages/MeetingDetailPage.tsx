import { useParams } from 'react-router-dom';
import { getDocumentsForMeeting, getIssuesForMeeting, getMeetingById } from '../services/civicData';
import { formatDate, formatShortDate, formatTime, formatWeekday, meetingTypeLabel } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { DocumentGroups, IssueCard } from '../components/Cards';
import { MockBadge, MockNotice, isMock } from '../components/MockBadge';
import { SourceAction } from '../components/SourceAction';
import { MeetingStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { NotFound } from './NotFoundPage';
import { BackLink } from '../components/BackLink';
import { usePlaceHref } from '../services/placeContext';

export function MeetingDetailPage() {
  const href = usePlaceHref();
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

  const short = formatShortDate(meeting.date);
  const open = issues.filter((i) => i.status === 'under_consideration' || i.status === 'proposed');
  const decided = issues.filter((i) => ['approved', 'denied', 'withdrawn', 'completed'].includes(i.status));
  const other = issues.filter((i) => !open.includes(i) && !decided.includes(i));
  const groups = [
    { key: 'open', title: 'Still being decided', items: open },
    { key: 'decided', title: 'Decided', items: decided },
    { key: 'other', title: 'Other items', items: other },
  ].filter((g) => g.items.length);

  return (
    <article className="page detail detail--meeting">
      <BackLink fallbackTo={href('/archive')} fallbackLabel="Archive" />
      <header className="detail__header">
        <div className="card__top">
          <span className="tag">{meetingTypeLabel(meeting.meetingType)}</span>
          {isMock(meeting) && <MockBadge record={meeting} size="lg" />}
        </div>
        <h1 className="detail__title">{meeting.title}</h1>
      </header>
      <MockNotice record={meeting} kind="meeting" />
      <div className="standing standing--meeting">
        <div className="standing__inner">
          <div className="standing__when">
            <div className="datechip datechip--lg" aria-hidden="true">
              {short ? (
                <>
                  <span className="datechip__weekday">{formatWeekday(meeting.date)}</span>
                  <span className="datechip__day">{short.day}</span>
                  <span className="datechip__month">{short.month}</span>
                </>
              ) : (
                <span className="datechip__month">TBD</span>
              )}
            </div>
            <div className="standing__now">
              <p className="standing__status">
                <MeetingStatusBadge status={meeting.status} />
              </p>
              <p className="standing__asof">
                {formatDate(meeting.date)}
                {time ? ` at ${time}` : meeting.date ? ' (time not listed)' : ''}
              </p>
              {issues.length > 0 && (
                <p className="standing__sentence">
                  {issues.length === 1 ? 'One issue in these records was on its agenda.' : `${issues.length} issues in these records were on its agenda.`}
                  {open.length > 0 && ` ${open.length === 1 ? 'One is' : `${open.length} are`} still being decided.`}
                </p>
              )}
            </div>
          </div>
          <section className="standing__means" aria-labelledby="m-summary-h">
            <h2 id="m-summary-h" className="standing__label">
              About this meeting
            </h2>
            <p className="standing__why">{meeting.summary || 'No summary has been written for this meeting yet.'}</p>
          </section>
        </div>
      </div>

      <div className="detail__grid">
        <div className="detail__main">
          <section aria-labelledby="m-issues-h">
            <h2 id="m-issues-h">Issues on the agenda</h2>
            {groups.length ? (
              groups.map((g) => (
                <div key={g.key} className="agenda-group">
                  <h3 className="agenda-group__title">{g.title}</h3>
                  <ul className="issue-list">
                    {g.items.map((i) => (
                      <li key={i.id}>
                        <IssueCard issue={i} headingLevel={4} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <EmptyState title="No issues are linked to this meeting." />
            )}
            <p className="fine-print">Being on an agenda does not mean an item was approved. Check each issue’s status.</p>
          </section>

          <section aria-labelledby="m-docs-h">
            <h2 id="m-docs-h">Agenda and documents</h2>
            {documents.length ? <DocumentGroups documents={documents} /> : <EmptyState title="No agenda or documents are linked to this meeting yet." />}
            {missingDocs > 0 && <p className="card__note">{missingDocs} linked document(s) could not be found in the dataset.</p>}
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel" aria-labelledby="m-watch-h">
            <h2 id="m-watch-h">Watch and verify</h2>
            <ul className="plain-list">
              <li>
                <SourceAction url={meeting.recordingUrl} label="Watch the recording" unavailableText={meeting.status === 'scheduled' ? 'No recording yet: this meeting hasn’t happened' : 'Recording not available'} />
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
