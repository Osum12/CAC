import { useRef, type ReactNode, type RefObject } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { DATE_RANGE_LABELS, filterIssues, isFiltering, statusesIn, topicsIn, type DateRange, type IssueFilterState } from '../services/filters';
import { formatDate, humanize, ISSUE_STATUS_LABELS, safeUrl, todayIso } from '../services/format';
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
  const [params, setParams] = useSearchParams();

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
        <p className="hero__place">Alpharetta, Georgia</p>
        <h1 id="citywide-title" className="hero__title">
          What’s on the table at City Hall
        </h1>
        <p className="hero__lede">Recent proposals, decisions, and public meetings, explained in plain language with a link to every official source.</p>
        <form
          className="hero-search"
          role="search"
          aria-label="Issue search"
          onSubmit={(e) => {
            e.preventDefault();
            jumpTo(issuesHeading.current);
          }}
        >
          <label htmlFor="hero-q" className="visually-hidden">
            Search city issues
          </label>
          <input
            id="hero-q"
            type="search"
            value={params.get('q') ?? ''}
            placeholder="Search issues, e.g. speed limit"
            onChange={(e) => {
              const p = new URLSearchParams(params);
              if (e.target.value) p.set('q', e.target.value);
              else p.delete('q');
              setParams(p, { replace: true });
            }}
          />
          <button type="submit" className="hero-search__button">
            Search
          </button>
        </form>
        {ready && (
          <p className="hero__note">
            {anyMock
              ? 'These records include sample data and are not city totals.'
              : `A selected set of recent records, not every city item.${checked ? ` Meeting records last checked against official city documents on ${formatDate(checked)}.` : ''}`}
          </p>
        )}
      </section>

      {ready && (
        <nav className="quicklinks" aria-label="Shortcuts">
          <ul>
            <li>
              <Link to={`/near-me?loc=${DEMO_LOCATIONS[0].id}`} className="quicklink">
                <QuickIcon name="pin" />
                <span className="quicklink__label">Find issues near me</span>
                <span className="quicklink__hint">Sorted by distance from City Hall</span>
              </Link>
            </li>
            <li>
              <button type="button" className="quicklink" onClick={() => jumpTo(meetingsHeading.current)}>
                <QuickIcon name="calendar" />
                <span className="quicklink__label">Upcoming meetings</span>
                <span className="quicklink__hint">{plural(splitMeetings(ready[0]).upcoming.length, 'meeting')} scheduled</span>
              </button>
            </li>
            <li>
              <Link to="/archive?type=videos" className="quicklink">
                <QuickIcon name="play" />
                <span className="quicklink__label">Meeting recordings</span>
                <span className="quicklink__hint">{plural(ready[0].filter((m) => safeUrl(m.recordingUrl)).length, 'video')} on the city portal</span>
              </Link>
            </li>
            <li>
              <Link to="/archive" className="quicklink">
                <QuickIcon name="document" />
                <span className="quicklink__label">Agendas and minutes</span>
                <span className="quicklink__hint">{plural(ready[2].length, 'official document')}</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}

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
            See them on the map
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
          Browse all meetings and documents
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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Simple line icons for the shortcut row. Decorative; the link text carries the meaning. */
function QuickIcon({ name }: { name: 'pin' | 'calendar' | 'play' | 'document' }) {
  const paths = {
    pin: <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
    calendar: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m3 0h2m-7 4h2m3 0h2" />,
    play: <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm6 4v6l5-3-5-3Z" />,
    document: <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6m-6 4h6" />,
  };
  return (
    <span className="quicklink__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </svg>
    </span>
  );
}
