import { useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams, useUrlText } from '../services/useUrlParams';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { filterIssues, isFiltering, statusesIn, topicsIn, type IssueFilterState } from '../services/filters';
import { formatCompactDate, formatDate, formatTime, formatWeekdayDate, humanize, ISSUE_STATUS_LABELS, safeUrl, todayIso } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { ExternalAction, IssueCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { MockBadge, isMock } from '../components/MockBadge';
import { IssueStatusBadge, MeetingStatusBadge } from '../components/StatusBadge';
import { RegisterHead } from '../components/Register';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { usePlace, usePlaceHref, useRecordSources } from '../services/placeContext';

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
  usePageTitle('Countywide');
  const place = usePlace();
  const sources = useRecordSources();
  const state = useAsync(() => Promise.all([getMeetings(), getIssues(), getDocuments()]), []);
  const issuesHeading = useRef<HTMLHeadingElement>(null);
  const meetingsHeading = useRef<HTMLHeadingElement>(null);
  const { params, setParam } = useUrlParams();
  // The search box keeps its own text so fast typing is never lost; the URL follows it.
  const [query, onQuery] = useUrlText(params, setParam, 'q');

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
      <section className="hero hero--cover" aria-labelledby="citywide-title">
        <div className="hero__inner">
          <p className="hero__place">{place?.name}, Georgia</p>
          <div className="hero__main">
            <h1 id="citywide-title" className="hero__title">
              <span className="hero__line">What’s on the table</span> <span className="hero__line">in {place?.name}</span>
            </h1>
            <p className="hero__lede">Recent decisions and public meetings of the {sources}, in plain language, with a link to every official record.</p>
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
                Search issues
              </label>
              <input
                id="hero-q"
                type="search"
                value={query}
                placeholder="e.g. property tax"
                onChange={(e) => onQuery(e.target.value)}
              />
              <button type="submit" className="hero-search__button">
                Search
              </button>
            </form>
            {ready && (
              <p className="hero__note">
                {anyMock
                  ? 'These records include sample data and are not city totals.'
                  : `A selection of recent items, not every decision.${checked ? ` Last checked against official county records on ${formatDate(checked)}.` : ''}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {ready && <Docket meetings={ready[0]} issues={ready[1]} documents={ready[2]} />}

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
  const sources = useRecordSources();
  const href = usePlaceHref();
  const { params, setParam, clearParams } = useUrlParams();
  // Values from the URL are only honored if they exist in the data, so a stale or mistyped
  // link never filters by something the dropdowns can't show.
  const rawTopic = params.get('topic') ?? '';
  const rawStatus = params.get('status') ?? '';
  const filters: IssueFilterState = {
    q: params.get('q') ?? '',
    topic: topicsIn(issues).includes(rawTopic) ? rawTopic : '',
    status: (statusesIn(issues) as string[]).includes(rawStatus) ? rawStatus : '',
    when: '',
  };
  const setFilter = (key: keyof IssueFilterState, value: string) => {
    setParam(key, value);
  };
  const clearFilters = () => {
    clearParams();
  };

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
      <section className="section board board--issues" aria-labelledby="issues-heading">
        <div className="board__label">
          <div className="section__head">
            <h2 id="issues-heading" ref={issuesHeading} tabIndex={-1}>
              Issues
            </h2>
            <p className="section__source">From the {sources}</p>
            <Link to={href('/near-me')} className="text-link">
              See them on the map
            </Link>
          </div>
          <IssueFilters issues={issues} filters={filters} onChange={setFilter} onClear={clearFilters} />
          <p className="results-count" role="status" aria-live="polite">
            {filtering ? `${matches.length} of ${issues.length} issues match` : `${issues.length} issues`}
          </p>
        </div>

        {/* A compact index of meetings: after the filters in reading order, in the left rail on wide screens. */}
        <aside className="board__meetings" aria-labelledby="meetings-heading">
          <h2 id="meetings-heading" ref={meetingsHeading} tabIndex={-1}>
            Meetings
          </h2>
          <p className="section__source">From the {sources}</p>
          {upcoming.length > 0 && <MeetingIndex title="Coming up" meetings={upcoming} documents={documents} showTime />}
          {recent.length > 0 ? (
            <MeetingIndex title="Recent" meetings={recent.slice(0, 4)} documents={documents} />
          ) : (
            <p className="meeting-index__empty">No past meetings in this dataset.</p>
          )}
          <Link to={href('/archive')} className="text-link">
            Browse all meetings and documents
          </Link>
        </aside>

        <div className="board__rows">
          <RegisterHead columns={['Topic', 'Issue', 'Status date', 'Status']} />
          {filtering ? (
            matches.length ? (
              <GroupedIssues issues={matches} />
            ) : (
              <EmptyState
                title="No issues match these filters."
                action={
                  <button type="button" className="button button--ghost" onClick={clearFilters}>
                    Clear filters
                  </button>
                }
              >
                <p>Try a different word, or choose “All topics” and “Any status”.</p>
              </EmptyState>
            )
          ) : (
            <GroupedIssues issues={issues} />
          )}
        </div>

      </section>
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
      {isFiltering(filters) && (
        <button type="button" className="button button--ghost filters__clear" onClick={onClear}>
          Clear
        </button>
      )}
    </form>
  );
}

/** Main items first, then the most recently decided. */
const byImportance = (issues: Issue[]) =>
  [...issues].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? ''));

function IssueList({ issues, headingLevel }: { issues: Issue[]; headingLevel: 3 | 4 }) {
  return (
    <ul className="issue-list register">
      {issues.map((i) => (
        <li key={i.id}>
          <IssueCard issue={i} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

/** Display groups for the issue register, in reading order. Statuses are shown as recorded; empty groups are left out. */
const STATUS_GROUPS: { title: string; statuses: Issue['status'][] }[] = [
  { title: 'Still being decided', statuses: ['proposed', 'under_consideration'] },
  { title: 'Denied', statuses: ['denied'] },
  { title: 'Withdrawn', statuses: ['withdrawn'] },
  { title: 'Approved', statuses: ['approved', 'completed'] },
];

function GroupedIssues({ issues }: { issues: Issue[] }) {
  const sorted = byImportance(issues);
  const known = STATUS_GROUPS.flatMap((g) => g.statuses);
  const groups = [
    ...STATUS_GROUPS.map((g) => ({ title: g.title, items: sorted.filter((i) => g.statuses.includes(i.status)) })),
    { title: 'Status not verified', items: sorted.filter((i) => !known.includes(i.status)) },
  ].filter((g) => g.items.length > 0);
  return (
    <>
      {groups.map((g) => (
        <div key={g.title} className="issue-group">
          <h3 className="issue-group__title">
            {g.title}{' '}
            <span className="issue-group__count">
              {g.items.length}
              <span className="visually-hidden"> {g.items.length === 1 ? 'issue' : 'issues'}</span>
            </span>
          </h3>
          <IssueList issues={g.items} headingLevel={4} />
        </div>
      ))}
    </>
  );
}

/**
 * A meeting title shortened for the index: the board's name (given once above the list) and the
 * trailing date (shown on the row) are kept for screen readers but not repeated on screen.
 */
function splitTitle(title: string): [string, string, string] {
  const m = title.match(/^(Board of Commissioners )?(.*?)(, [A-Z][a-z]+ \d{1,2}, \d{4})?$/);
  return m && m[2] ? [m[1] ?? '', m[2], m[3] ?? ''] : ['', title, ''];
}

function MeetingIndex({ title, meetings, documents, showTime = false }: { title: string; meetings: Meeting[]; documents: CivicDocument[]; showTime?: boolean }) {
  const href = usePlaceHref();
  return (
    <>
      <h3 className="meeting-index__title">{title}</h3>
      <ul className="meeting-index">
        {meetings.map((m) => {
          const agenda = agendaFor(m, documents);
          const agendaUrl = agenda && !isMock(agenda) ? safeUrl(agenda.url) : null;
          const [board, name, datePart] = splitTitle(m.title);
          return (
            <li key={m.id} className="meeting-index__item">
              <p className="meeting-index__meta">
                <time dateTime={m.date ?? undefined}>{m.date ? formatCompactDate(m.date) : 'Date to be announced'}</time>
                {showTime && m.startTime && <span>{formatTime(m.startTime)}</span>}
                <MeetingStatusBadge status={m.status} />
                {agendaUrl && (
                  <ExternalAction href={agendaUrl} context={m.title}>
                    Agenda (PDF)
                  </ExternalAction>
                )}
                {isMock(m) && <MockBadge record={m} />}
              </p>
              <h4 className="meeting-index__name">
                <Link to={href(`/meetings/${encodeURIComponent(m.id)}`)}>
                  {board && <span className="visually-hidden">{board}</span>}
                  {name}
                  {datePart && <span className="visually-hidden">{datePart}</span>}
                </Link>
              </h4>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * "Next at <meeting place>": the next scheduled meeting, what is on its agenda, and the most
 * recent recorded decision. Everything shown comes from the dataset; nothing is invented.
 */
function Docket({ meetings, issues, documents }: { meetings: Meeting[]; issues: Issue[]; documents: CivicDocument[] }) {
  const href = usePlaceHref();
  const meetingPlace = usePlace()?.recordSources[0]?.meetingPlace ?? 'City Hall';
  const next = splitMeetings(meetings).upcoming[0] ?? null;
  const onAgenda = next ? issues.filter((i) => next.issueIds.includes(i.id)) : [];
  const decided = issues
    .filter((i) => ['approved', 'denied', 'withdrawn', 'completed'].includes(i.status) && i.statusAsOf)
    .sort((a, b) => b.statusAsOf!.localeCompare(a.statusAsOf!))[0];
  const agenda = next ? agendaFor(next, documents) : null;
  if (!next && !decided) return null;
  return (
    <aside className="docket nowband" aria-label={next ? `Next at ${meetingPlace}` : 'Latest decision'}>
      <div className="nowband__inner">
      <p className="nowband__label">
        <span className="nowband__beacon" aria-hidden="true" />
        Right now
      </p>
      {next && (
        <div className="docket__block">
          <p className="docket__kicker">Next at {meetingPlace}</p>
          <p className="docket__date">
            <time dateTime={next.date ?? undefined}>{formatWeekdayDate(next.date)}</time>
            {next.startTime && <span className="docket__time">{formatTime(next.startTime)}</span>}
          </p>
          <p className="docket__title">
            <Link to={href(`/meetings/${encodeURIComponent(next.id)}`)}>{next.title}</Link>
          </p>
          {onAgenda.length > 0 && (
            <>
              <p className="docket__label">On the agenda</p>
              <ul className="docket__list">
                {onAgenda.map((i) => (
                  <li key={i.id}>
                    <Link to={href(`/issues/${encodeURIComponent(i.id)}`)}>{i.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {agenda && safeUrl(agenda.url) && !isMock(agenda) && (
            <a className="docket__source" href={safeUrl(agenda.url)!} target="_blank" rel="noopener noreferrer">
              Read the agenda (PDF)<span className="visually-hidden"> for {next.title}, opens in a new tab</span>
            </a>
          )}
        </div>
      )}
      {decided && (
        <div className="docket__block docket__block--decided">
          <p className="docket__kicker">Latest decision</p>
          <p className="docket__title docket__title--small">
            <Link to={href(`/issues/${encodeURIComponent(decided.id)}`)}>{decided.title}</Link>
          </p>
          <p className="docket__meta">
            <IssueStatusBadge status={decided.status} /> on {formatDate(decided.statusAsOf)}
          </p>
        </div>
      )}
      </div>
    </aside>
  );
}
