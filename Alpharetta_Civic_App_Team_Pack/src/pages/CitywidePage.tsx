import { memo, useRef, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams, useUrlText } from '../services/useUrlParams';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { filterIssues, isFiltering, statusesIn, topicsIn, type IssueFilterState } from '../services/filters';
import { formatDate, formatTime, formatWeekdayDate, humanize, ISSUE_STATUS_LABELS, safeUrl, todayIso } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueCard, KeepTallies, MeetingCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
import type { CivicDocument, Issue, IssueStatus, Meeting } from '../types/civic';
import { usePlace, usePlaceHref, useRecordSources } from '../services/placeContext';
import {
  countBy,
  countStatuses,
  DECIDED,
  Figure,
  listSentence,
  MeetingColumns,
  plural,
  RecordTimeline,
  shortDate,
  SourceLine,
  StatusTrack,
  StatusUnits,
  statusOf,
  statusSentence,
  TopicBars,
} from '../components/DataDesk';

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
    <div className="page page--county">
      <section className="cover" aria-labelledby="citywide-title">
        <div className="cover__inner">
          <p className="cover__place">{place?.name}, Georgia</p>
          <h1 id="citywide-title" className="cover__title">
            <span className="hero__line">What’s on the table</span> <span className="hero__line">in {place?.name}</span>
          </h1>
          <div className="cover__side">
            <p className="cover__lede">Recent decisions and public meetings of the {sources}, in plain language, with a link to every official record.</p>
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
              <input id="hero-q" type="search" value={query} placeholder="Search issues, e.g. property tax" onChange={(e) => onQuery(e.target.value)} />
              <button type="submit" className="hero-search__button">
                Search
              </button>
            </form>
            {ready && (
              <p className="cover__note">
                {anyMock
                  ? 'These records include sample data and are not city totals.'
                  : `A selection of recent items, not every decision.${checked ? ` Last checked against official county records on ${formatDate(checked)}.` : ''}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {state.status === 'loading' && <LoadingState rows={4} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {ready && <Lead meetings={ready[0]} issues={ready[1]} documents={ready[2]} />}
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
      <Desk meetings={meetings} issues={issues} documents={documents} topic={filters.topic} onTopic={(t) => setFilter('topic', t === filters.topic ? '' : t)} />
      <div className="citywide-grid">
        <section className="section section--issues" aria-labelledby="issues-heading">
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

          {filtering && !matches.length ? (
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
          ) : (
            <IssueGroups issues={filtering ? matches : issues} />
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
 * "The record in numbers": four figures counted from the records this page loaded, each with a
 * sentence title computed from the data. Choosing a topic bar filters the issue list below.
 */
const Desk = memo(DeskFigures, (a, b) => a.meetings === b.meetings && a.issues === b.issues && a.documents === b.documents && a.topic === b.topic);

function DeskFigures({
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
  const href = usePlaceHref();
  const sample = [...meetings, ...issues, ...documents].some(isMock);
  const checked = sample ? null : lastChecked(meetings);
  if (!issues.length) return null;

  const statuses = countStatuses(issues);
  const top = [...statuses].sort((a, b) => b.count - a.count)[0];
  const topics = countBy(issues, (i) => i.category);
  const leaders = topics.filter((t) => t.count === topics[0].count);

  const busiest = countBy(
    issues.filter((i) => i.statusAsOf),
    (i) => i.statusAsOf!,
  )[0];
  const perMeeting = meetings
    .filter((m) => m.date)
    .map((m) => ({ m, n: issues.filter((i) => m.issueIds.includes(i.id) || i.meetingIds.includes(m.id)).length }))
    .sort((a, b) => b.n - a.n || a.m.date!.localeCompare(b.m.date!));
  const most = perMeeting[0];
  const decided = issues.filter((i) => DECIDED.includes(statusOf(i))).length;

  return (
    <section className="desk" aria-labelledby="desk-title">
      <div className="desk__inner">
        <header className="desk__head">
          <h2 id="desk-title" className="desk__title">
            The record in numbers
          </h2>
          <p className="desk__lead">
            {plural(issues.length, 'item')} on record: {statusSentence(statuses)}.
          </p>
          <p className="desk__note">
            {decided} of {issues.length} have a final decision recorded. Counts cover the items collected in this app, not every decision the county made.
          </p>
        </header>

        <div className="desk__grid">
          <Figure
            id="fig-status"
            className="figure--wide"
            title={`${top.count} of ${issues.length} items are ${ISSUE_STATUS_LABELS[top.status].toLowerCase()}`}
            subtitle="Each square is one item, grouped by its current status. Point at a square to see which item it is."
          >
            <StatusUnits issues={issues} label="Items by current status" />
          </Figure>

          <Figure
            id="fig-timeline"
            className="figure--wide"
            title={
              busiest && busiest.count > 1
                ? `${formatDate(busiest.key).replace(/, \d{4}$/, '')} was the busiest day: ${busiest.count} items reached their current status`
                : 'When each item reached its current status'
            }
            subtitle="Each dot is one item, placed on the date its current status was recorded and colored by that status. Rings under the line are board meetings."
          >
            <RecordTimeline issues={issues} meetings={meetings} />
          </Figure>

          <Figure
            id="fig-topics"
            title={
              leaders.length === 1
                ? `${humanize(leaders[0].key)} leads with ${plural(leaders[0].count, 'item')}`
                : `${listSentence(leaders.map((l) => humanize(l.key)))} lead with ${leaders[0].count} items each`
            }
            subtitle="Items by topic, split by current status. Choose a topic to filter the list below."
          >
            <TopicBars
              caption="Items by topic and status"
              rows={topics.map((t) => ({
                key: t.key,
                label: humanize(t.key),
                issues: issues.filter((i) => i.category === t.key),
                pressed: topic === t.key,
                onSelect: () => onTopic(t.key),
              }))}
            />
          </Figure>

          <Figure
            id="fig-meetings"
            title={most && most.n ? `The ${shortDate(most.m.date!)} meeting took up the most: ${plural(most.n, 'item')}` : 'Items per meeting'}
            subtitle="Items on each meeting’s agenda, split by their current status. Choose a column to open that meeting."
          >
            <MeetingColumns meetings={meetings} issues={issues} href={href} />
          </Figure>
        </div>
        <SourceLine source={sources} checked={checked} sample={sample} />
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

/** The list, grouped by where each item stands: open items first, then outcomes. */
const GROUPS: { key: string; title: string; statuses: IssueStatus[] }[] = [
  { key: 'open', title: 'Still open', statuses: ['under_consideration', 'proposed'] },
  { key: 'denied', title: 'Denied or withdrawn', statuses: ['denied', 'withdrawn'] },
  { key: 'approved', title: 'Approved or completed', statuses: ['approved', 'completed'] },
  { key: 'other', title: 'Status not recorded', statuses: ['unknown'] },
];

const latestFirst = (a: Issue, b: Issue) => (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? '') || Number(b.featured) - Number(a.featured);

function IssueGroups({ issues }: { issues: Issue[] }) {
  const groups = GROUPS.map((g) => ({ ...g, items: issues.filter((i) => g.statuses.includes(statusOf(i))).sort(latestFirst) })).filter((g) => g.items.length);
  return (
    <div className="issue-groups">
      {groups.map((g) => (
        <section key={g.key} className={`issue-group issue-group--${g.key}`} aria-labelledby={`group-${g.key}`}>
          <h3 id={`group-${g.key}`} className="issue-group__title">
            {g.title}
            <span className="issue-group__count">{g.items.length}</span>
          </h3>
          <ul className="issue-list">
            {g.items.map((i) => (
              <li key={i.id}>
                <IssueCard issue={i} headingLevel={4} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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
 * The lead: the most recent recorded decision, told as a story (headline, status, summary, why it
 * may matter, and its path through the board's meetings), plus the next scheduled meeting when
 * there is one. Everything shown comes from the dataset; nothing is invented.
 */
const Lead = memo(LeadStory);

function LeadStory({ meetings, issues, documents }: { meetings: Meeting[]; issues: Issue[]; documents: CivicDocument[] }) {
  const href = usePlaceHref();
  const meetingPlace = usePlace()?.recordSources[0]?.meetingPlace ?? 'City Hall';
  const next = splitMeetings(meetings).upcoming[0] ?? null;
  const onAgenda = next ? issues.filter((i) => next.issueIds.includes(i.id)) : [];
  const decided = issues
    .filter((i) => DECIDED.includes(statusOf(i)) && i.statusAsOf)
    .sort((a, b) => b.statusAsOf!.localeCompare(a.statusAsOf!) || Number(b.featured) - Number(a.featured))[0];
  const agenda = next ? agendaFor(next, documents) : null;
  if (!next && !decided) return null;
  const path = decided ? meetings.filter((m) => decided.meetingIds.includes(m.id)) : [];
  return (
    <aside className={`lead${next ? ' lead--with-next' : ''}`} aria-label={next ? `Next at ${meetingPlace}` : 'Latest decision'}>
      {decided && (
        <article className="lead__story">
          <p className="lead__kicker">
            Latest decision<span className="lead__topic">{humanize(decided.category)}</span>
          </p>
          <h2 className="lead__title">
            <Link to={href(`/issues/${encodeURIComponent(decided.id)}`)}>{decided.title}</Link>
          </h2>
          <p className="lead__meta">
            <IssueStatusBadge status={decided.status} /> on {formatDate(decided.statusAsOf)}
          </p>
          {decided.summary && (
            <p className="lead__summary">
              <KeepTallies text={decided.summary} />
            </p>
          )}
        </article>
      )}
      <div className="lead__side">
        {next && (
          <div className="lead__next">
            <p className="lead__kicker">Next at {meetingPlace}</p>
            <p className="lead__date">
              <time dateTime={next.date ?? undefined}>{formatWeekdayDate(next.date)}</time>
              {next.startTime && <span className="lead__time">{formatTime(next.startTime)}</span>}
            </p>
            <p className="lead__next-title">
              <Link to={href(`/meetings/${encodeURIComponent(next.id)}`)}>{next.title}</Link>
            </p>
            {onAgenda.length > 0 && (
              <>
                <p className="lead__label">On the agenda</p>
                <ul className="lead__list">
                  {onAgenda.map((i) => (
                    <li key={i.id}>
                      <Link to={href(`/issues/${encodeURIComponent(i.id)}`)}>{i.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {agenda && safeUrl(agenda.url) && !isMock(agenda) && (
              <a className="lead__source" href={safeUrl(agenda.url)!} target="_blank" rel="noopener noreferrer">
                Read the agenda (PDF)<span className="visually-hidden"> for {next.title}, opens in a new tab</span>
              </a>
            )}
          </div>
        )}
        {decided?.whyItMayMatter && (
          <div className="lead__why">
            <p className="lead__label">Why it may matter</p>
            <p className="lead__why-text">{decided.whyItMayMatter}</p>
          </div>
        )}
        {decided && path.length > 0 && (
          <div className="lead__path">
            <p className="lead__label">How it got here</p>
            <StatusTrack issue={decided} meetings={path} />
          </div>
        )}
      </div>
    </aside>
  );
}
