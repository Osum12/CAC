import { useRef, type ReactNode, type RefObject } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { DATE_RANGE_LABELS, filterIssues, isFiltering, statusesIn, topicsIn, type DateRange, type IssueFilterState } from '../services/filters';
import { formatDate, humanize, ISSUE_STATUS_LABELS, todayIso } from '../services/format';
import { DEMO_LOCATIONS } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueCard, MeetingCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { isMock } from '../components/MockBadge';
import type { CivicDocument, Issue, Meeting } from '../types/civic';

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

/** Issue dates (when a status was set) are never in the future, so "Upcoming" isn't offered here. */
const ISSUE_DATE_RANGES: Exclude<DateRange, '' | 'upcoming'>[] = ['30d', '90d', 'year'];

/** The agenda for a meeting: prefers a plain agenda over a packet. */
export function agendaFor(meeting: Meeting, documents: CivicDocument[]): CivicDocument | null {
  const docs = meeting.agendaDocumentIds.map((id) => documents.find((d) => d.id === id)).filter((d): d is CivicDocument => Boolean(d));
  return docs.find((d) => d.documentType === 'agenda') ?? docs[0] ?? null;
}

/** Most recent verification date across curated records, or null when none is recorded. */
function lastChecked(meetings: Meeting[]): string | null {
  const dates = meetings.filter((m) => !isMock(m) && m.lastVerifiedAt).map((m) => m.lastVerifiedAt!.slice(0, 10));
  return dates.length ? dates.sort().at(-1)! : null;
}

export function CitywidePage() {
  usePageTitle('Citywide');
  const state = useAsync(() => Promise.all([getMeetings(), getIssues(), getDocuments()]), []);
  const issuesHeading = useRef<HTMLHeadingElement>(null);
  const meetingsHeading = useRef<HTMLHeadingElement>(null);

  // In-page jumps also move keyboard focus, so screen-reader users land where sighted users do.
  const jumpTo = (el: HTMLElement | null) => {
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  const ready = state.status === 'ready' ? state.data : null;
  const anyMock = ready ? [...ready[0], ...ready[1], ...ready[2]].some(isMock) : false;
  const checked = ready && !anyMock ? lastChecked(ready[0]) : null;

  return (
    <div className="page">
      <section className="hero" aria-labelledby="citywide-title">
        <p className="eyebrow eyebrow--light">Alpharetta, Georgia</p>
        <h1 id="citywide-title" className="hero__title">
          What’s on the table at City Hall
        </h1>
        <p className="hero__lede">
          Recent proposals, decisions, and public meetings, written in plain language with a link to every official source.
        </p>
        <div className="hero__actions">
          <button type="button" className="button button--on-dark" onClick={() => jumpTo(issuesHeading.current)}>
            Explore city issues
          </button>
          <Link to={`/near-me?loc=${DEMO_LOCATIONS[0].id}`} className="button button--outline-light">
            Find issues near me
          </Link>
        </div>
        {ready && (
          <ul className="hero__stats" aria-label="What’s in this app">
            <li>
              <button type="button" className="hero__stat" onClick={() => jumpTo(issuesHeading.current)}>
                <strong>{ready[1].length}</strong> issues
              </button>
            </li>
            <li>
              <button type="button" className="hero__stat" onClick={() => jumpTo(meetingsHeading.current)}>
                <strong>{ready[0].length}</strong> meetings
              </button>
            </li>
            <li>
              <span className="hero__stat hero__stat--static">
                <strong>{ready[2].length}</strong> official documents
              </span>
            </li>
          </ul>
        )}
        {ready && (
          <p className="hero__note">
            {anyMock
              ? 'These counts include sample records and are not city totals.'
              : `A selected set of recent records, not every city item.${checked ? ` Meeting records last checked against official city documents on ${formatDate(checked)}.` : ''}`}
          </p>
        )}
      </section>

      {state.status === 'loading' && <LoadingState rows={4} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {ready && (
        <CitywideContent
          meetings={ready[0]}
          issues={ready[1]}
          documents={ready[2]}
          issuesHeading={issuesHeading}
          meetingsHeading={meetingsHeading}
        />
      )}
    </div>
  );
}

type ContentProps = {
  meetings: Meeting[];
  issues: Issue[];
  documents: CivicDocument[];
  issuesHeading: RefObject<HTMLHeadingElement | null>;
  meetingsHeading: RefObject<HTMLHeadingElement | null>;
};

function CitywideContent({ meetings, issues, documents, issuesHeading, meetingsHeading }: ContentProps) {
  const [params, setParams] = useSearchParams();
  // Values from the URL are only honored if they exist in the data, so a stale or mistyped
  // link never filters by something the dropdowns can't show.
  const rawTopic = params.get('topic') ?? '';
  const rawStatus = params.get('status') ?? '';
  const rawWhen = params.get('when') ?? '';
  const filters: IssueFilterState = {
    q: params.get('q') ?? '',
    topic: topicsIn(issues).includes(rawTopic) ? rawTopic : '',
    status: (statusesIn(issues) as string[]).includes(rawStatus) ? rawStatus : '',
    when: (ISSUE_DATE_RANGES as string[]).includes(rawWhen) ? (rawWhen as DateRange) : '',
  };
  const setFilter = (key: keyof IssueFilterState, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };
  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });

  if (!meetings.length && !issues.length) {
    return (
      <EmptyState title="No civic records are loaded yet.">
        <p>When meetings and issues are added to the dataset, they’ll appear here.</p>
      </EmptyState>
    );
  }

  const { upcoming, recent } = splitMeetings(meetings);
  const filtering = isFiltering(filters);
  const matches = filterIssues(issues, filters);

  return (
    <div className="citywide-grid">
      <section className="section" aria-labelledby="issues-heading">
        <div className="section__head">
          <h2 id="issues-heading" ref={issuesHeading} tabIndex={-1}>
            City issues
          </h2>
          <Link to="/near-me" className="text-link">
            See them on the map →
          </Link>
        </div>

        <IssueFilters issues={issues} filters={filters} onChange={setFilter} onClear={clearFilters} />
        <p className="results-count" role="status" aria-live="polite">
          {filtering ? `${matches.length} of ${issues.length} issues match` : `${issues.length} issues`}
        </p>

        {filtering ? (
          matches.length ? (
            <IssueList issues={matches} headingLevel={3} />
          ) : (
            <EmptyState
              title="No issues match these filters."
              action={
                <button type="button" className="button button--ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              }
            >
              <p>Try a different word, or choose “All topics”, “Any status”, and “Any time”.</p>
            </EmptyState>
          )
        ) : (
          <>
            <IssueGroup title="Featured" issues={issues.filter((i) => i.featured)} />
            <IssueGroup title="More issues" issues={issues.filter((i) => !i.featured)} />
          </>
        )}
      </section>

      <aside className="section section--meetings" aria-labelledby="meetings-heading">
        <h2 id="meetings-heading" ref={meetingsHeading} tabIndex={-1}>
          Meetings
        </h2>
        <MeetingGroup title="Coming up" meetings={upcoming} documents={documents} empty="No upcoming meetings in this dataset." />
        <MeetingGroup title="Recent" meetings={recent} documents={documents} empty="No past meetings in this dataset." />
        <Link to="/archive" className="text-link">
          Browse all meetings and documents →
        </Link>
      </aside>
    </div>
  );
}

function IssueFilters({
  issues,
  filters,
  onChange,
  onClear,
}: {
  issues: Issue[];
  filters: IssueFilterState;
  onChange: (key: keyof IssueFilterState, value: string) => void;
  onClear: () => void;
}) {
  return (
    <form className="filters" role="search" aria-label="Search and filter issues" onSubmit={(e) => e.preventDefault()}>
      <div className="filters__field filters__field--grow">
        <label htmlFor="issue-q">Search issues</label>
        <input id="issue-q" type="search" value={filters.q} placeholder="e.g. speed limit, Windward" onChange={(e) => onChange('q', e.target.value)} />
      </div>
      <div className="filters__field">
        <label htmlFor="issue-topic">Topic</label>
        <select id="issue-topic" value={filters.topic} onChange={(e) => onChange('topic', e.target.value)}>
          <option value="">All topics</option>
          {topicsIn(issues).map((t) => (
            <option key={t} value={t}>
              {humanize(t)}
            </option>
          ))}
        </select>
      </div>
      <div className="filters__field">
        <label htmlFor="issue-status">Status</label>
        <select id="issue-status" value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">Any status</option>
          {statusesIn(issues).map((s) => (
            <option key={s} value={s}>
              {ISSUE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="filters__field">
        <label htmlFor="issue-when">Updated</label>
        <select id="issue-when" value={filters.when} onChange={(e) => onChange('when', e.target.value)}>
          <option value="">Any time</option>
          {ISSUE_DATE_RANGES.map((r) => (
            <option key={r} value={r}>
              {DATE_RANGE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {isFiltering(filters) && (
        <button type="button" className="button button--ghost filters__clear" onClick={onClear}>
          Clear
        </button>
      )}
    </form>
  );
}

function IssueGroup({ title, issues }: { title: string; issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <>
      <h3 className="subhead">{title}</h3>
      <IssueList issues={issues} headingLevel={4} />
    </>
  );
}

function IssueList({ issues, headingLevel }: { issues: Issue[]; headingLevel: 3 | 4 }) {
  return (
    <ul className="issue-list">
      {issues.map((i) => (
        <li key={i.id}>
          <IssueCard issue={i} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

function MeetingGroup({ title, meetings, documents, empty }: { title: string; meetings: Meeting[]; documents: CivicDocument[]; empty: ReactNode }) {
  return (
    <>
      <h3 className="subhead">{title}</h3>
      {meetings.length ? (
        <ul className="stack">
          {meetings.map((m) => (
            <li key={m.id}>
              <MeetingCard meeting={m} agenda={agendaFor(m, documents)} headingLevel={4} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={String(empty)} />
      )}
    </>
  );
}
