import { Link } from 'react-router-dom';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueCard, MeetingCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { isMock } from '../components/MockBadge';
import type { Meeting } from '../types/civic';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Upcoming = not held or canceled, and dated today or later. A "scheduled" meeting with no
 * date counts as upcoming; a "scheduled" meeting whose date has passed does not.
 */
export function splitMeetings(meetings: Meeting[], today = todayIso()) {
  const isUpcoming = (m: Meeting) =>
    m.status !== 'completed' && m.status !== 'canceled' && (m.date ? m.date >= today : m.status === 'scheduled');
  const upcoming = meetings.filter(isUpcoming).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const recent = meetings.filter((m) => !isUpcoming(m)).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  return { upcoming, recent };
}

export function CitywidePage() {
  usePageTitle('Citywide');
  const state = useAsync(() => Promise.all([getMeetings(), getIssues(), getDocuments()]), []);

  return (
    <div className="page">
      <section className="hero" aria-labelledby="citywide-title">
        <p className="eyebrow eyebrow--light">Alpharetta, Georgia</p>
        <h1 id="citywide-title" className="hero__title">
          What’s on the table at City Hall
        </h1>
        <p className="hero__lede">
          Meetings, proposals, and public documents in one place, written in plain language with a path back to the original source.
        </p>
        {state.status === 'ready' && (
          <dl className="hero__stats">
            <div>
              <dt>Issues tracked</dt>
              <dd>{state.data[1].length}</dd>
            </div>
            <div>
              <dt>Meetings</dt>
              <dd>{state.data[0].length}</dd>
            </div>
            <div>
              <dt>Documents</dt>
              <dd>{state.data[2].length}</dd>
            </div>
          </dl>
        )}
        {state.status === 'ready' && [...state.data[0], ...state.data[1], ...state.data[2]].some(isMock) && (
          <p className="hero__note">These counts are of the sample records in this prototype, not city totals.</p>
        )}
      </section>

      {state.status === 'loading' && <LoadingState rows={4} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'ready' && <CitywideContent meetings={state.data[0]} issues={state.data[1]} />}
    </div>
  );
}

function CitywideContent({ meetings, issues }: { meetings: Meeting[]; issues: Awaited<ReturnType<typeof getIssues>> }) {
  const { upcoming, recent } = splitMeetings(meetings);
  const featured = issues.filter((i) => i.featured);
  const others = issues.filter((i) => !i.featured);

  if (!meetings.length && !issues.length) {
    return (
      <EmptyState title="No civic records are loaded yet.">
        <p>When meetings and issues are added to the dataset, they’ll appear here.</p>
      </EmptyState>
    );
  }

  return (
    <div className="citywide-grid">
      <section className="section section--issues" aria-labelledby="featured-heading">
        <div className="section__head">
          <h2 id="featured-heading">Featured issues</h2>
          <Link to="/near-me" className="text-link">
            Sort by distance in Near Me →
          </Link>
        </div>
        {featured.length ? (
          <div className="card-grid">
            {featured.map((i) => (
              <IssueCard key={i.id} issue={i} />
            ))}
          </div>
        ) : (
          <EmptyState title="No featured issues right now." />
        )}
        {others.length > 0 && (
          <>
            <h3 className="subhead">More issues</h3>
            <div className="card-grid">
              {others.map((i) => (
                <IssueCard key={i.id} issue={i} headingLevel={4} />
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="section section--meetings" aria-label="Meetings">
        <h2 id="upcoming-heading">Upcoming meetings</h2>
        {upcoming.length ? (
          <div className="stack">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming meetings in this dataset." />
        )}
        <h2 id="recent-heading" className="section__spaced">
          Recent meetings
        </h2>
        {recent.length ? (
          <div className="stack">
            {recent.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        ) : (
          <EmptyState title="No past meetings in this dataset." />
        )}
        <Link to="/archive" className="text-link section__spaced">
          Browse the full archive →
        </Link>
      </aside>
    </div>
  );
}
