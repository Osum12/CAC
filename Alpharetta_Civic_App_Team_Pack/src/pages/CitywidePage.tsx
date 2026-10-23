import { useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams, useUrlText } from '../services/useUrlParams';
import { getDocuments, getIssues, getMeetings } from '../services/civicData';
import { filterIssues, isFiltering, statusesIn, topicsIn, type IssueFilterState } from '../services/filters';
import {
  formatCompactDate,
  formatDate,
  formatTime,
  formatWeekdayDate,
  humanize,
  ISSUE_STATUS_LABELS,
  parseIsoDate,
  safeUrl,
  todayIso,
} from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { ExternalAction, IssueCard } from '../components/Cards';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { MockBadge, isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
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

/**
 * The meeting an issue is filed under on this page: the latest of its linked meetings held on or
 * before the date its current status was recorded (the meeting where that status was set). If none
 * qualifies (an item heading to a future meeting) it is the latest linked meeting. Presentation only:
 * the issue's own meeting links are never changed.
 */
export function homeMeeting(issue: Issue, meetings: Meeting[]): Meeting | null {
  const linked = issue.meetingIds.map((id) => meetings.find((m) => m.id === id)).filter((m): m is Meeting => Boolean(m));
  if (!linked.length) return null;
  const dated = linked.filter((m) => m.date).sort((a, b) => b.date!.localeCompare(a.date!));
  const asOf = issue.statusAsOf;
  return (asOf ? dated.find((m) => m.date! <= asOf) : undefined) ?? dated[0] ?? linked[0];
}

type Session = {
  key: string;
  meeting: Meeting | null;
  upcoming: boolean;
  /** Issues filed under this meeting. */
  issues: Issue[];
  /** Issues that were also on this meeting's agenda but are filed under another meeting. */
  also: { issue: Issue; filedUnder: Meeting | null }[];
};

/** Main items first, then the most recently updated, then by title. */
const byImportance = (a: Issue, b: Issue) =>
  Number(b.featured) - Number(a.featured) || (b.statusAsOf ?? '').localeCompare(a.statusAsOf ?? '') || a.title.localeCompare(b.title);

/**
 * Groups issues into one chapter per meeting, newest first (upcoming meetings on top), with issues
 * linked to no meeting in a last chapter. Chapters with nothing to show are left out.
 */
export function groupBySession(meetings: Meeting[], issues: Issue[], filtering: boolean): Session[] {
  const { upcoming } = splitMeetings(meetings);
  const home = new Map(issues.map((i) => [i.id, homeMeeting(i, meetings)]));
  const sessions: Session[] = meetings.map((m) => ({
    key: m.id,
    meeting: m,
    upcoming: upcoming.includes(m),
    issues: issues.filter((i) => home.get(i.id)?.id === m.id).sort(byImportance),
    also: issues
      .filter((i) => i.meetingIds.includes(m.id) && home.get(i.id)?.id !== m.id)
      .sort(byImportance)
      .map((i) => ({ issue: i, filedUnder: home.get(i.id) ?? null })),
  }));
  const order = (s: Session) => (s.meeting?.date ?? (s.upcoming ? '9999' : '0000'));
  const visible = sessions
    .filter((s) => s.issues.length > 0 || (!filtering && s.also.length > 0))
    .sort((a, b) => Number(b.upcoming) - Number(a.upcoming) || order(b).localeCompare(order(a)) || (b.meeting?.startTime ?? '').localeCompare(a.meeting?.startTime ?? ''));
  const unfiled = issues.filter((i) => !home.get(i.id)).sort(byImportance);
  if (unfiled.length) visible.push({ key: 'no-meeting', meeting: null, upcoming: false, issues: unfiled, also: [] });
  return visible;
}

export function CitywidePage() {
  usePageTitle('Countywide');
  const place = usePlace();
  const sources = useRecordSources();
  const state = useAsync(() => Promise.all([getMeetings(), getIssues(), getDocuments()]), []);
  const issuesHeading = useRef<HTMLHeadingElement>(null);
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
      <section className="county-hero" aria-labelledby="citywide-title">
        <div className="county-hero__main">
          <p className="kicker">{place?.name}, Georgia</p>
          <h1 id="citywide-title" className="county-hero__title">
            <span className="hero__line">What’s on the table</span> <span className="hero__line">in {place?.name}</span>
          </h1>
          <p className="county-hero__lede">Recent decisions and public meetings of the {sources}, in plain language, with a link to every official record.</p>
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
            <p className="county-hero__note">
              {anyMock
                ? 'These records include sample data and are not city totals.'
                : `A selection of recent items, not every decision.${checked ? ` Last checked against official county records on ${formatDate(checked)}.` : ''}`}
            </p>
          )}
        </div>
        {ready && <Docket meetings={ready[0]} issues={ready[1]} documents={ready[2]} />}
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
  const sessions = groupBySession(meetings, matches, filtering);

  return (
    <div className="county-body">
      <section className="record" aria-labelledby="issues-heading">
        <header className="record__head">
          <h2 id="issues-heading" ref={issuesHeading} tabIndex={-1}>
            Issues
          </h2>
          <p className="record__source">From the {sources}</p>
          <p className="record__intro">
            Filed by the meeting where each item was last decided or discussed, newest first.{' '}
            <Link to={href('/near-me')}>See them on the map</Link>
          </p>
        </header>

        <div className="record__tools">
          <IssueFilters issues={issues} filters={filters} onChange={(k, v) => setParam(k, v)} onClear={clearParams} />
          <p className="results-count" role="status" aria-live="polite">
            {filtering ? `${matches.length} of ${issues.length} issues match` : `${issues.length} issues`}
          </p>
        </div>

        {filtering && !matches.length ? (
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
        ) : (
          <div className="sessions">
            {sessions.map((s) => (
              <SessionChapter key={s.key} session={s} documents={documents} />
            ))}
          </div>
        )}
      </section>

      <aside className="rail" aria-labelledby="meetings-heading">
        <h2 id="meetings-heading" className="rail__title">
          Meetings
        </h2>
        <p className="rail__source">From the {sources}</p>
        {upcoming.length > 0 && <RailGroup title="Coming up" meetings={upcoming} documents={documents} />}
        {recent.length > 0 ? (
          <RailGroup title="Recent" meetings={recent.slice(0, 4)} documents={documents} />
        ) : (
          <p className="muted">No past meetings in this dataset.</p>
        )}
        <Link to={href('/archive')} className="rail__more">
          Browse all meetings and documents
        </Link>
      </aside>
    </div>
  );
}

/** "Board of Commissioners First Regular Meeting, October 7, 2026" reads without its date beside the big date. */
function withoutDate(m: Meeting): string {
  const tail = `, ${formatDate(m.date, '')}`;
  return m.date && m.title.endsWith(tail) ? m.title.slice(0, -tail.length) : m.title;
}

/** Big chapter date: day numeral, month and year, weekday. Decorative copy of the heading's date. */
function DateMark({ iso, upcoming }: { iso: string | null; upcoming: boolean }) {
  const d = parseIsoDate(iso);
  if (!d)
    return (
      <div className="datemark datemark--none" aria-hidden="true">
        <span className="datemark__month">{upcoming ? 'Date to be announced' : 'No meeting'}</span>
      </div>
    );
  return (
    <div className="datemark" aria-hidden="true">
      <span className="datemark__day">{d.getDate()}</span>
      <span className="datemark__month">
        {d.toLocaleDateString('en-US', { month: 'long' })} {d.getFullYear()}
      </span>
      <span className="datemark__weekday">{d.toLocaleDateString('en-US', { weekday: 'long' })}</span>
    </div>
  );
}

function SessionChapter({ session, documents }: { session: Session; documents: CivicDocument[] }) {
  const href = usePlaceHref();
  const { meeting, issues, also, upcoming } = session;
  const headingId = `session-${session.key}`;
  const decided = issues.length === 1 ? '1 item' : `${issues.length} items`;

  if (!meeting) {
    return (
      <section className="session session--none" aria-labelledby={headingId}>
        <DateMark iso={null} upcoming={false} />
        <div className="session__body">
          <header className="session__head">
            <h3 id={headingId} className="session__title">
              Not tied to a meeting
            </h3>
            <p className="session__meta">{decided} with no meeting linked in the records.</p>
          </header>
          <IssueEntries issues={issues} />
        </div>
      </section>
    );
  }

  const mock = isMock(meeting);
  const agenda = agendaFor(meeting, documents);
  const agendaUrl = agenda && !isMock(agenda) ? safeUrl(agenda.url) : null;
  const video = mock ? null : safeUrl(meeting.recordingUrl);
  const official = mock ? null : safeUrl(meeting.officialPageUrl);
  const time = formatTime(meeting.startTime);

  return (
    <section className={`session${upcoming ? ' session--upcoming' : ''}`} aria-labelledby={headingId}>
      <DateMark iso={meeting.date} upcoming={upcoming} />
      <div className="session__body">
        <header className="session__head">
          {upcoming && <p className="session__flag">Coming up</p>}
          <h3 id={headingId} className="session__title">
            <Link to={href(`/meetings/${encodeURIComponent(meeting.id)}`)}>{withoutDate(meeting)}</Link>
          </h3>
          <p className="session__meta">
            <span>
              <time dateTime={meeting.date ?? undefined}>{formatDate(meeting.date, 'Date to be announced')}</time>
              {time ? `, ${time}` : ''}
            </span>
            {issues.length > 0 && <span className="session__count">{upcoming ? `${decided} on the agenda` : `${decided} filed here`}</span>}
            {mock && <MockBadge record={meeting} />}
          </p>
          {(agendaUrl || video || official) && (
            <div className="session__links">
              {agendaUrl && (
                <ExternalAction href={agendaUrl} context={meeting.title}>
                  Official agenda
                </ExternalAction>
              )}
              {video && (
                <ExternalAction href={video} context={meeting.title}>
                  Meeting video
                </ExternalAction>
              )}
              {official && (
                <ExternalAction href={official} context={meeting.title}>
                  Meeting page
                </ExternalAction>
              )}
            </div>
          )}
        </header>
        {issues.length > 0 && <IssueEntries issues={issues} />}
        {also.length > 0 && (
          <div className="session__also">
            <p className="session__also-title">Also on this agenda</p>
            <ul>
              {also.map(({ issue, filedUnder }) => (
                <li key={issue.id}>
                  <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)}>{issue.title}</Link>
                  {filedUnder?.date && <span className="session__also-note"> Filed under {formatDate(filedUnder.date)}.</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function IssueEntries({ issues }: { issues: Issue[] }) {
  return (
    <ul className="issue-list">
      {issues.map((i) => (
        <li key={i.id}>
          <IssueCard issue={i} headingLevel={4} />
        </li>
      ))}
    </ul>
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

function RailGroup({ title, meetings, documents }: { title: string; meetings: Meeting[]; documents: CivicDocument[] }) {
  const href = usePlaceHref();
  return (
    <>
      <h3 className="rail__group">{title}</h3>
      <ul className="rail__list">
        {meetings.map((m) => {
          const agenda = agendaFor(m, documents);
          const agendaUrl = agenda && !isMock(agenda) ? safeUrl(agenda.url) : null;
          const time = formatTime(m.startTime);
          return (
            <li key={m.id} className="rail__item">
              <p className="rail__date">
                <time dateTime={m.date ?? undefined}>{formatCompactDate(m.date, 'Date to be announced')}</time>
                {time ? `, ${time}` : ''}
              </p>
              <h4 className="rail__name">
                <Link to={href(`/meetings/${encodeURIComponent(m.id)}`)}>{m.title}</Link>
              </h4>
              {(agendaUrl || isMock(m)) && (
                <div className="rail__actions">
                  {agendaUrl && (
                    <ExternalAction href={agendaUrl} context={m.title}>
                      Agenda (PDF)
                    </ExternalAction>
                  )}
                  {isMock(m) && <MockBadge record={m} />}
                </div>
              )}
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
  const decisions = issues
    .filter((i) => ['approved', 'denied', 'withdrawn', 'completed'].includes(i.status) && i.statusAsOf)
    .sort((a, b) => b.statusAsOf!.localeCompare(a.statusAsOf!));
  const decided = decisions[0];
  // With no meeting to announce, the panel also lists the next few most recent decisions (some may share its date).
  const earlier = next ? [] : decisions.slice(1, 4);
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
          <p className="docket__title">
            <Link to={href(`/issues/${encodeURIComponent(decided.id)}`)}>{decided.title}</Link>
          </p>
          <p className="docket__meta">
            <IssueStatusBadge status={decided.status} /> on {formatDate(decided.statusAsOf)}
          </p>
          {earlier.length > 0 && (
            <>
              <p className="docket__label">Other recent decisions</p>
              <ul className="docket__decisions">
                {earlier.map((i) => (
                  <li key={i.id}>
                    <Link to={href(`/issues/${encodeURIComponent(i.id)}`)}>{i.title}</Link>
                    <span className="docket__when">
                      <IssueStatusBadge status={i.status} /> {formatCompactDate(i.statusAsOf)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
