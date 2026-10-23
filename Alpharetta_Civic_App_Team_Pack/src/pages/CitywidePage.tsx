import { useRef, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams, useUrlText } from '../services/useUrlParams';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { filterIssues, isFiltering, statusesIn, topicsIn, type IssueFilterState } from '../services/filters';
import { formatDate, formatTime, formatWeekdayDate, humanize, ISSUE_STATUS_LABELS, safeUrl, todayIso } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueCard, MeetingCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
import type { CivicDocument, Issue, Meeting } from '../types/civic';
import { usePlace, usePlaceHref, useRecordSources } from '../services/placeContext';
import { BarTable, countBy, countStatuses, Figure, MeetingStrip, SourceLine, StatusBar, statusSentence } from '../components/DataDesk';

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
          <div className="hero__main">
            <p className="hero__place">{place?.name}, Georgia</p>
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
                placeholder="Search issues, e.g. property tax"
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
          {ready && <Docket meetings={ready[0]} issues={ready[1]} documents={ready[2]} />}
        </div>
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
    <>
      <Glance meetings={meetings} issues={issues} documents={documents} topic={filters.topic} onTopic={(t) => setFilter('topic', t === filters.topic ? '' : t)} />
      <div className="citywide-grid">
        <section className="section" aria-labelledby="issues-heading">
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
                <p>Try a different word, or choose “All topics” and “Any status”.</p>
              </EmptyState>
            )
          ) : (
            <IssueList issues={byImportance(issues)} headingLevel={3} />
          )}
        </section>

        <aside className="section section--meetings" aria-labelledby="meetings-heading">
          <h2 id="meetings-heading" ref={meetingsHeading} tabIndex={-1}>
            Meetings
          </h2>
          <p className="section__source">From the {sources}</p>
          {upcoming.length > 0 && <MeetingGroup title="Coming up" meetings={upcoming} documents={documents} empty="" />}
          <MeetingGroup title="Recent" meetings={recent.slice(0, 4)} documents={documents} empty="No past meetings in this dataset." />
          <Link to={href('/archive')} className="text-link">
            Browse all meetings and documents
          </Link>
        </aside>
      </div>
    </>
  );
}

/**
 * "The record in numbers": status, topic, and meeting figures counted from the records this page
 * loaded. Choosing a topic bar filters the issue list below (the results count announces it).
 */
function Glance({
  meetings,
  issues,
  documents,
  topic,
  onTopic,
}: {
  meetings: Meeting[];
  issues: Issue[];
  documents: CivicDocument[];
  topic: string;
  onTopic: (topic: string) => void;
}) {
  const sources = useRecordSources();
  const sample = [...meetings, ...issues, ...documents].some(isMock);
  const checked = sample ? null : lastChecked(meetings);
  const statuses = countStatuses(issues);
  const topics = countBy(issues, (i) => i.category);
  const source = <SourceLine source={sources} checked={checked} sample={sample} />;
  if (!issues.length) return null;
  return (
    <section className="glance" aria-labelledby="glance-title">
      <div className="glance__inner">
        <h2 id="glance-title" className="glance__title">
          The record in numbers
        </h2>
        <p className="glance__lead">
          {issues.length} {issues.length === 1 ? 'item' : 'items'} on record: {statusSentence(statuses)}.
        </p>
        <p className="glance__note">Counts cover the items collected in this app, not every decision the county made.</p>
        <div className="glance__grid">
          <Figure id="fig-status" title="Where each item stands" source={source} className="figure--wide">
            <StatusBar counts={statuses} label="Items by current status" />
          </Figure>
          <Figure id="fig-topics" title="Items by topic" source={source}>
            <p className="figure__hint">Choose a topic to filter the list below.</p>
            <BarTable
              caption="Items by topic"
              unit="Items"
              rows={topics.map((t) => ({
                key: t.key,
                label: humanize(t.key),
                value: t.count,
                pressed: topic === t.key,
                onSelect: () => onTopic(t.key),
                actionLabel: `: ${t.count} ${t.count === 1 ? 'item' : 'items'}`,
              }))}
            />
          </Figure>
          <Figure id="fig-meetings" title="When the board met" source={source}>
            <MeetingStrip meetings={meetings} />
          </Figure>
        </div>
      </div>
    </section>
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
    <aside className="docket" aria-label={next ? `Next at ${meetingPlace}` : 'Latest decision'}>
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
    </aside>
  );
}
