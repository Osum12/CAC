import { memo, useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams, useUrlText } from '../services/useUrlParams';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { filterIssues, isFiltering, statusesIn, topicsIn, type IssueFilterState } from '../services/filters';
import { formatDate, formatTime, formatWeekdayDate, humanize, ISSUE_STATUS_LABELS, primarySource, safeUrl, todayIso } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { ExternalAction, IssueCard, MeetingCard } from '../components/Cards';
import { getValidCoordinates } from '../services/nearMe';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { MockBadge, isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
import type { CivicDocument, Issue, IssueStatus, Meeting } from '../types/civic';
import { usePlace, usePlaceHref, useRecordSources } from '../services/placeContext';

/**
 * Upcoming = not held or canceled, and dated today or later. A "scheduled" meeting with no
 * date counts as upcoming; a "scheduled" meeting whose date has passed does not.
 */
export function splitMeetings(meetings: Meeting[], today = todayIso()) {
  const isUpcoming = (m: Meeting) => m.status !== 'completed' && m.status !== 'canceled' && (m.date ? m.date >= today : m.status === 'scheduled');
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

/** Statuses that mean the board has not finished with an item. */
const OPEN: IssueStatus[] = ['under_consideration', 'proposed'];
/** Statuses that record a finished outcome. */
const DECIDED: IssueStatus[] = ['approved', 'denied', 'withdrawn', 'completed'];

/** Decided items with a date, newest first. */
const decidedNewestFirst = (issues: Issue[]) =>
  issues.filter((i) => DECIDED.includes(i.status) && i.statusAsOf).sort((a, b) => b.statusAsOf!.localeCompare(a.statusAsOf!));

// In-page jumps also move keyboard focus, so screen-reader users land where sighted users do.
function jumpTo(el: HTMLElement | null) {
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

/**
 * Countywide reads as a briefing, in the order a resident asks: what is still open, what was
 * just decided, when the board meets, which topics have items, and then every item in full.
 */
export function CitywidePage() {
  usePageTitle('Countywide');
  const place = usePlace();
  const sources = useRecordSources();
  const state = useAsync(() => Promise.all([getMeetings(), getIssues(), getDocuments()]), []);
  const issuesHeading = useRef<HTMLHeadingElement>(null);

  const ready = state.status === 'ready' ? state.data : null;
  const anyMock = ready ? [...ready[0], ...ready[1], ...ready[2]].some(isMock) : false;
  const checked = ready && !anyMock ? lastChecked(ready[0]) : null;

  return (
    <div className="page page--briefing">
      <section className="hero hero--cover" aria-labelledby="citywide-title">
        <div className="hero__inner">
          <div className="hero__main">
            <p className="hero__place">{place?.name}, Georgia</p>
            <h1 id="citywide-title" className="hero__title">
              <span className="hero__line">What’s on the table</span> <span className="hero__line">in {place?.name}</span>
            </h1>
            <p className="hero__lede">Recent decisions and public meetings of the {sources}, in plain language, with a link to every official record.</p>
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
      {ready && <CitywideContent meetings={ready[0]} issues={ready[1]} documents={ready[2]} issuesHeading={issuesHeading} />}
    </div>
  );
}

type ContentProps = {
  meetings: Meeting[];
  issues: Issue[];
  documents: CivicDocument[];
  issuesHeading: RefObject<HTMLHeadingElement | null>;
};

function CitywideContent({ meetings, issues, documents, issuesHeading }: ContentProps) {
  const sources = useRecordSources();
  const href = usePlaceHref();
  const { params, setParam, clearParams } = useUrlParams();
  // The search box keeps its own text so fast typing is never lost; the URL follows it.
  const [query, onQuery] = useUrlText(params, setParam, 'q');
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
  const setFilter = (key: keyof IssueFilterState, value: string) => setParam(key, value);

  if (!meetings.length && !issues.length) {
    return (
      <EmptyState title="No civic records are loaded yet.">
        <p>When meetings and issues are added to the dataset, they’ll appear here.</p>
      </EmptyState>
    );
  }

  const filtering = isFiltering(filters);
  // The hero panel shows the newest decision (see Docket), so the decisions list skips it.
  const heroDecision = decidedNewestFirst(issues)[0]?.id ?? null;
  const matches = filterIssues(issues, filters);
  // Items the briefing above already explains: the hero's decision, the open items and the latest decisions.
  const shownAbove = new Set<string>([
    ...(heroDecision ? [heroDecision] : []),
    ...issues.filter((i) => OPEN.includes(i.status)).map((i) => i.id),
    ...decisionDays(issues, heroDecision).flatMap((d) => d.items.map((i) => i.id)),
  ]);

  return (
    <>
      <StillOpen issues={issues} meetings={meetings} />

      <div className="briefing-pair">
        <LatestDecisions issues={issues} skip={heroDecision} />

        <MeetingsAside meetings={meetings} issues={issues} documents={documents} />
      </div>

      <TopicOverview
        issues={issues}
        active={filters.topic}
        onPick={(topic) => {
          setFilter('topic', topic);
          // Choosing a topic moves to the filtered list; clearing one leaves focus on the button.
          if (topic) jumpTo(issuesHeading.current);
        }}
      />

      <section className="brief brief--issues" aria-labelledby="issues-heading">
        <div className="brief__head">
          <h2 id="issues-heading" className="brief__title" ref={issuesHeading} tabIndex={-1}>
            Issues
          </h2>
          <p className="brief__source">From the {sources}</p>
          <Link to={href('/near-me')} className="text-link">
            See them on the map
          </Link>
        </div>

        <form
          className="toolbar"
          role="search"
          aria-label="Search and filter issues"
          onSubmit={(e) => {
            e.preventDefault();
            jumpTo(issuesHeading.current);
          }}
        >
          <div className="toolbar__field toolbar__field--search">
            <label htmlFor="hero-q">Search issues</label>
            <div className="toolbar__search">
              <input id="hero-q" type="search" value={query} placeholder="e.g. property tax" onChange={(e) => onQuery(e.target.value)} />
              <button type="submit" className="toolbar__go">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
                  <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <span className="visually-hidden">Search</span>
              </button>
            </div>
          </div>
          <div className="toolbar__field">
            <label htmlFor="issue-topic">Topic</label>
            <select id="issue-topic" value={filters.topic} onChange={(e) => setFilter('topic', e.target.value)}>
              <option value="">All topics</option>
              {topicsIn(issues).map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar__field">
            <label htmlFor="issue-status">Status</label>
            <select id="issue-status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">Any status</option>
              {statusesIn(issues).map((s) => (
                <option key={s} value={s}>
                  {ISSUE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </form>
        <div className="results-row">
          <p className="results-count" role="status" aria-live="polite">
            {filtering ? `${matches.length} of ${issues.length} issues match` : `${issues.length} issues`}
          </p>
          {filtering && matches.length > 0 && (
            <button type="button" className="button button--ghost button--small" onClick={clearParams}>
              Clear filters
            </button>
          )}
        </div>

        {filtering ? (
          matches.length ? (
            <IssueList issues={matches} />
          ) : (
            <EmptyState
              title="No issues match these filters."
              action={
                <button type="button" className="button button--ghost" onClick={clearParams}>
                  Clear filters
                </button>
              }
            >
              <p>Try a different word, or choose “All topics” and “Any status”.</p>
            </EmptyState>
          )
        ) : (
          <IssueList issues={issues} shownAbove={shownAbove} />
        )}
      </section>
    </>
  );
}

/** 1. What the board has not finished with: the open items, each with why it may matter. */
const StillOpen = memo(function StillOpen({ issues, meetings }: { issues: Issue[]; meetings: Meeting[] }) {
  const href = usePlaceHref();
  const open = issues
    .filter((i) => OPEN.includes(i.status))
    .sort((a, b) => (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? '') || Number(b.featured) - Number(a.featured));
  const lastMeeting = (i: Issue) => meetings.filter((m) => i.meetingIds.includes(m.id) && m.date).sort((a, b) => b.date!.localeCompare(a.date!))[0] ?? null;
  return (
    <section className="openband" aria-labelledby="open-heading">
      <div className="openband__inner">
        <div className="openband__head">
          <h2 id="open-heading" className="brief__title">
            Still being decided
          </h2>
          <p className="openband__lede">
            {open.length === 0
              ? 'Every item in these records has a recorded outcome. Nothing is waiting on a vote.'
              : open.length === 1
                ? 'One item is waiting on a vote or more work from the board.'
                : `${open.length} items are waiting on a vote or more work from the board.`}
          </p>
        </div>
        {open.length > 0 && (
          <ul className="open-list">
            {open.map((i) => {
              const m = lastMeeting(i);
              return (
                <li key={i.id} className="open-item">
                  <p className="open-item__status">
                    <IssueStatusBadge status={i.status} />
                    <span className="open-item__asof">{i.statusAsOf ? `as of ${formatDate(i.statusAsOf)}` : 'no date recorded'}</span>
                  </p>
                  <h3 className="open-item__title">
                    <Link to={href(`/issues/${encodeURIComponent(i.id)}`)}>{i.title}</Link>
                  </h3>
                  <p className="open-item__why">{i.whyItMayMatter || i.summary}</p>
                  <p className="open-item__meta">
                    {humanize(i.category)}
                    {m ? `. Last on the agenda ${formatDate(m.date)}.` : '.'}
                    {isMock(i) && (
                      <>
                        {' '}
                        <MockBadge record={i} />
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
});

/**
 * The decisions listed under "Latest decisions": newest first, after the one in the hero panel,
 * whole days only until at least eight are shown, so no day is cut in half.
 */
function decisionDays(issues: Issue[], skip: string | null) {
  const decided = decidedNewestFirst(issues).filter((i) => i.id !== skip);
  const days: { date: string; items: Issue[] }[] = [];
  let shown = 0;
  for (const i of decided) {
    const day = days.at(-1);
    if (day && day.date === i.statusAsOf) day.items.push(i);
    else if (shown >= 8) break;
    else days.push({ date: i.statusAsOf!, items: [i] });
    shown += 1;
  }
  return days;
}

/** 2. The most recent decisions, grouped by the day they were made. */
const LatestDecisions = memo(function LatestDecisions({ issues, skip }: { issues: Issue[]; skip: string | null }) {
  const href = usePlaceHref();
  const days = decisionDays(issues, skip);
  return (
    <section className="brief brief--decisions" aria-labelledby="decisions-heading">
      <h2 id="decisions-heading" className="brief__title">
        Latest decisions
      </h2>
      {skip && days.length > 0 && <p className="brief__lede">Newest first, after the decision shown at the top of the page.</p>}
      {days.length === 0 ? (
        <p className="brief__empty">No decisions are recorded in these records yet.</p>
      ) : (
        days.map((d) => (
          <div key={d.date} className="decided">
            <h3 className="decided__day">
              Decided <time dateTime={d.date}>{formatDate(d.date)}</time>
            </h3>
            <ul className="decided__list">
              {d.items.map((i) => (
                <li key={i.id} className="decided__item">
                  <IssueStatusBadge status={i.status} />
                  <Link to={href(`/issues/${encodeURIComponent(i.id)}`)} className="decided__link">
                    {i.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
});

/** 3. The next meeting, or the most recent ones, with their agendas. */
const MeetingsAside = memo(function MeetingsAside({ meetings, issues, documents }: { meetings: Meeting[]; issues: Issue[]; documents: CivicDocument[] }) {
  const sources = useRecordSources();
  const href = usePlaceHref();
  const { upcoming, recent } = splitMeetings(meetings);
  return (
    <aside className="brief brief--meetings" aria-labelledby="meetings-heading">
      <h2 id="meetings-heading" className="brief__title" tabIndex={-1}>
        Meetings
      </h2>
      <p className="brief__source">From the {sources}</p>
      {upcoming.length > 0 && <MeetingGroup title="Coming up" meetings={upcoming} documents={documents} issues={issues} />}
      {recent.length > 0 ? (
        <MeetingGroup title="Recent" meetings={recent.slice(0, 4)} documents={documents} issues={issues} featureFirst={!upcoming.length} />
      ) : (
        <EmptyState title="No past meetings in this dataset." />
      )}
      <Link to={href('/archive')} className="text-link">
        Browse all meetings and documents
      </Link>
    </aside>
  );
});

/** 4. Topics with items, counted from the loaded records; each one filters the full list. */
const TopicOverview = memo(
  function TopicOverview({ issues, active, onPick }: { issues: Issue[]; active: string; onPick: (topic: string) => void }) {
    const topics = topicsIn(issues)
      .map((t) => {
        const items = issues.filter((i) => i.category === t);
        const open = items.filter((i) => OPEN.includes(i.status)).length;
        return { t, count: items.length, open };
      })
      .sort((a, b) => b.count - a.count || humanize(a.t).localeCompare(humanize(b.t)));
    if (!topics.length) return null;
    return (
      <section className="brief brief--topics" aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="brief__title">
          Browse by topic
        </h2>
        <p className="brief__lede">Choose a topic to see only its items in the list below.</p>
        <ul className="topics">
          {topics.map(({ t, count, open }) => (
            <li key={t}>
              <button type="button" className="topic" aria-pressed={active === t} onClick={() => onPick(active === t ? '' : t)}>
                <span className="topic__name">{humanize(t)}</span>
                <span className="topic__detail">
                  <span className="topic__count">{count}</span>
                  <span>{count === 1 ? ' issue' : ' issues'}</span>
                  {open > 0 && <span>{`, ${open} still being decided`}</span>}
                </span>
                <svg className="topic__chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  },
  (a, b) => a.issues === b.issues && a.active === b.active,
);

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Every item, newest status first, under one heading per month (months with no items are never
 * shown). Items the briefing already covers become one short line each, with their record links.
 */
function IssueList({ issues, shownAbove }: { issues: Issue[]; shownAbove?: Set<string> }) {
  const sorted = [...issues].sort((a, b) => (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? ''));
  const groups: { key: string; label: string; items: Issue[] }[] = [];
  for (const i of sorted) {
    const key = i.statusAsOf ? i.statusAsOf.slice(0, 7) : 'none';
    const last = groups.at(-1);
    if (last && last.key === key) last.items.push(i);
    else groups.push({ key, label: key === 'none' ? 'No status date recorded' : monthLabel(key), items: [i] });
  }
  return (
    <div className="month-groups">
      <p className="month-groups__note">Grouped by the month of each item’s latest status, newest first.</p>
      {groups.map((g) => {
        const full = g.items.filter((i) => !shownAbove?.has(i.id));
        const short = g.items.filter((i) => shownAbove?.has(i.id));
        return (
          <div key={g.key} className="month">
            <h3 className="month__title">{g.label}</h3>
            {full.length > 0 && (
              <ul className="issue-list">
                {full.map((i) => (
                  <li key={i.id}>
                    <IssueCard issue={i} headingLevel={4} />
                  </li>
                ))}
              </ul>
            )}
            {short.length > 0 && (
              <>
                <p className="compact__label">{full.length ? 'Also this month, explained above' : 'Explained above'}</p>
                <ul className="compact-list">
                  {short.map((i) => (
                    <li key={i.id}>
                      <CompactIssue issue={i} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** One line for an item the briefing already covers: status, title and its record links. */
function CompactIssue({ issue }: { issue: Issue }) {
  const href = usePlaceHref();
  const source = isMock(issue) ? null : primarySource(issue.sourceUrls);
  return (
    <div className="compact">
      <IssueStatusBadge status={issue.status} />
      <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)} className="compact__title">
        {issue.title}
      </Link>
      <span className="compact__links">
        {getValidCoordinates(issue) && (
          <Link className="card__action" to={href(`/near-me?issue=${encodeURIComponent(issue.id)}`)}>
            View on map<span className="visually-hidden">: {issue.title}</span>
          </Link>
        )}
        {source && (
          <ExternalAction href={source} context={issue.title}>
            Official record
          </ExternalAction>
        )}
      </span>
    </div>
  );
}

function MeetingGroup({
  title,
  meetings,
  documents,
  issues,
  featureFirst = false,
}: {
  title: string;
  meetings: Meeting[];
  documents: CivicDocument[];
  issues: Issue[];
  featureFirst?: boolean;
}) {
  return (
    <>
      <h3 className="brief__subhead">{title}</h3>
      <ul className="stack">
        {meetings.map((m, k) => {
          const onAgenda = issues.filter((i) => m.issueIds.includes(i.id)).length;
          return (
            <li key={m.id} className={k === 0 && featureFirst ? 'stack__featured' : undefined}>
              <MeetingCard
                meeting={m}
                agenda={agendaFor(m, documents)}
                headingLevel={4}
                note={
                  k === 0 && featureFirst && onAgenda > 0
                    ? onAgenda === 1
                      ? 'One issue in these records was on its agenda.'
                      : `${onAgenda} issues in these records were on its agenda.`
                    : undefined
                }
              />
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
  const decided = decidedNewestFirst(issues)[0];
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
              Read the agenda (PDF)
              <span className="visually-hidden"> for {next.title}, opens in a new tab</span>
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
          {decided.whyItMayMatter && <p className="docket__why">{decided.whyItMayMatter}</p>}
        </div>
      )}
    </aside>
  );
}
