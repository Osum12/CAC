import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Issue, IssueStatus, Meeting } from '../types/civic';
import { formatDate, ISSUE_STATUS_LABELS } from '../services/format';
import { STATUS_GLYPHS } from './StatusBadge';

// "Data Desk" figures. Every number here is counted at render time from records the page
// already loaded through src/services; nothing is hard-coded. Each figure has a sentence title
// that states what it shows, direct labels on the marks, and a "Show the numbers" table, so no
// value is carried by length, position or color alone.

/** Display order for statuses: settled outcomes first, then open, then the rest. */
export const STATUS_ORDER: IssueStatus[] = ['approved', 'completed', 'under_consideration', 'proposed', 'denied', 'withdrawn', 'unknown'];
export const DECIDED: IssueStatus[] = ['approved', 'completed', 'denied', 'withdrawn'];

/** The status a record displays as: anything unexpected is "unknown". */
export const statusOf = (i: Issue): IssueStatus => (i.status in ISSUE_STATUS_LABELS ? i.status : 'unknown');

export type StatusCount = { status: IssueStatus; count: number };

export function countStatuses(issues: Issue[]): StatusCount[] {
  return STATUS_ORDER.map((status) => ({ status, count: issues.filter((i) => statusOf(i) === status).length })).filter((s) => s.count > 0);
}

export function countBy<T>(items: T[], key: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return [...map.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "19 approved, 3 under consideration and 2 denied" */
export function statusSentence(counts: StatusCount[]): string {
  const parts = counts.map((c) => `${c.count} ${ISSUE_STATUS_LABELS[c.status].toLowerCase()}`);
  return listSentence(parts);
}

export function listSentence(parts: string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

// ---------- dates ----------

/** Whole days since 1970 for an ISO date, independent of time zone. */
export const dayNumber = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
/** "Oct 7" */
export const shortDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthLabel = (iso: string, style: 'short' | 'long' = 'short') =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: style, timeZone: 'UTC', ...(style === 'long' ? { year: 'numeric' } : {}) });

/** A date axis padded out to whole months, with a tick on the first of each month. */
export function monthAxis(dates: string[]) {
  const sorted = [...dates].sort();
  const start = `${sorted[0].slice(0, 7)}-01`;
  // End a little after the last date, so the newest marks are not pushed against a blank month.
  const last = new Date(`${sorted.at(-1)!.slice(0, 10)}T12:00:00Z`);
  last.setUTCDate(last.getUTCDate() + 10);
  const end = last.toISOString().slice(0, 10);
  const span = Math.max(1, dayNumber(end) - dayNumber(start));
  const at = (iso: string) => ((dayNumber(iso) - dayNumber(start)) / span) * 100;
  const months: string[] = [];
  for (const d = new Date(`${start}T12:00:00Z`); d.toISOString().slice(0, 10) < end; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 10));
  return { start, end, at, months };
}

// ---------- shared pieces ----------

/** The source line every figure carries. */
export function SourceLine({ source, checked, sample }: { source: string; checked: string | null; sample?: boolean }) {
  return (
    <p className="figure__source">
      {sample
        ? 'Counted from the sample records shown on this page. These are test figures, not official totals.'
        : `Source: ${source} records${checked ? `, checked ${formatDate(checked)}` : ''}.`}
    </p>
  );
}

/** A figure: a sentence title, an optional plain-language subtitle, the chart, then the numbers. */
export function Figure({
  id,
  title,
  subtitle,
  children,
  source,
  className = '',
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  source?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`figure ${className}`} aria-labelledby={id}>
      <figcaption id={id} className="figure__title">
        {title}
      </figcaption>
      {subtitle && <p className="figure__sub">{subtitle}</p>}
      {children}
      {source}
    </figure>
  );
}

/** The text equivalent of a chart, one click away (Our World in Data's "Table" tab). */
export function NumbersTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="numbers">
      <summary className="numbers__toggle">
        Show the numbers<span className="visually-hidden">: {caption}</span>
      </summary>
      {/* Wide tables scroll inside their own focusable region, never the page. */}
      <div className="numbers__scroll" role="region" tabIndex={0} aria-label={caption}>
      <table className="numbers__table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={i && typeof rows[0]?.[i] === 'number' ? 'num' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((c, i) =>
                i ? (
                  <td key={i} className={typeof c === 'number' ? 'num' : 'numbers__text'}>
                    {c}
                  </td>
                ) : (
                  <th key={i} scope="row">
                    {c}
                  </th>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </details>
  );
}

/** Status key: color swatch plus the status's own shape glyph, then its name. */
export function StatusKey({ statuses }: { statuses: IssueStatus[] }) {
  return (
    <ul className="statuskey" aria-label="Key">
      {statuses.map((s) => (
        <li key={s} className="statuskey__item">
          <span className={`swatch seg--${s}`} aria-hidden="true">
            {STATUS_GLYPHS[s]}
          </span>
          {ISSUE_STATUS_LABELS[s]}
        </li>
      ))}
    </ul>
  );
}

/** A small status mark for lists: the glyph in its color, named for assistive tech. */
export function StatusDot({ status }: { status: IssueStatus }) {
  const s = status in ISSUE_STATUS_LABELS ? status : 'unknown';
  return (
    <span className={`swatch swatch--sm seg--${s}`} role="img" aria-label={`Status: ${ISSUE_STATUS_LABELS[s].toLowerCase()}`}>
      <span aria-hidden="true">{STATUS_GLYPHS[s]}</span>
    </span>
  );
}

// ---------- 1. Status mix: one square per item ----------

/**
 * Unit chart: one square per item, grouped by status. With a few dozen records, counting
 * squares is more honest than a percentage. The table names every item in each group.
 */
export function StatusUnits({ issues, label }: { issues: Issue[]; label: string }) {
  const total = issues.length;
  const groups = STATUS_ORDER.map((status) => ({ status, items: issues.filter((i) => statusOf(i) === status) })).filter((g) => g.items.length);
  if (!total) return null;
  return (
    <div className="units">
      <div className="units__groups">
        {groups.map((g) => (
          <div key={g.status} className={`units__group seg--${g.status}`} style={{ '--n': g.items.length } as CSSProperties}>
            <p className="units__label">
              <span className="units__count">{g.items.length}</span>
              <span className="units__name">
                <span aria-hidden="true" className="units__glyph">
                  {STATUS_GLYPHS[g.status]}
                </span>{' '}
                {ISSUE_STATUS_LABELS[g.status].toLowerCase()}
              </span>
            </p>
            <div className="units__cells" aria-hidden="true">
              {g.items.map((i, k) => (
                <span key={i.id} className="unit" data-tip={i.title} style={{ '--i': k } as CSSProperties} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <NumbersTable
        caption={label}
        head={['Status', 'Items', 'Share', 'Which items']}
        rows={groups.map((g) => [ISSUE_STATUS_LABELS[g.status], g.items.length, `${Math.round((g.items.length / total) * 100)}%`, g.items.map((i) => i.title).join('; ')])}
      />
    </div>
  );
}

// ---------- 2. Topics, each bar split by status ----------

export type TopicRow = { key: string; label: string; issues: Issue[]; pressed?: boolean; onSelect?: () => void };

/**
 * Horizontal bars, one per topic, split by status. Rows with `onSelect` are toggle buttons
 * that filter the issue list below.
 */
export function TopicBars({ rows, caption }: { rows: TopicRow[]; caption: string }) {
  const max = Math.max(1, ...rows.map((r) => r.issues.length));
  const used = STATUS_ORDER.filter((s) => rows.some((r) => r.issues.some((i) => statusOf(i) === s)));
  return (
    <div className="topics">
      <StatusKey statuses={used} />
      <ul className="topics__rows">
        {rows.map((r, row) => {
          const parts = countStatuses(r.issues);
          return (
            <li key={r.key} className={`topics__row${r.pressed ? ' is-pressed' : ''}`}>
              {r.onSelect ? (
                <button type="button" className="topics__button" aria-pressed={Boolean(r.pressed)} onClick={r.onSelect}>
                  <span className="topics__label">{r.label}</span>
                  <span className="visually-hidden">
                    : {plural(r.issues.length, 'item')}, {statusSentence(parts)}
                  </span>
                </button>
              ) : (
                <span className="topics__label">{r.label}</span>
              )}
              <span className="topics__track" aria-hidden="true">
                <span className="topics__bar" style={{ '--share': r.issues.length / max, '--i': row } as CSSProperties}>
                  {parts.map((p) => (
                    <span
                      key={p.status}
                      className={`topics__seg seg--${p.status}`}
                      style={{ flexGrow: p.count }}
                      data-tip={`${ISSUE_STATUS_LABELS[p.status]}: ${p.count}`}
                    />
                  ))}
                </span>
                <span className="topics__value">{r.issues.length}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <NumbersTable
        caption={caption}
        head={['Topic', 'Items', ...used.map((s) => ISSUE_STATUS_LABELS[s])]}
        rows={rows.map((r) => [r.label, r.issues.length, ...used.map((s) => r.issues.filter((i) => statusOf(i) === s).length)])}
      />
    </div>
  );
}

// ---------- 3. Timeline: status dates above the axis, meetings below ----------

/**
 * Every item placed on the date its status was last recorded (its "as of" date, not necessarily
 * the day it was decided; stacked dots, colored by status), with the board's meetings under the
 * same date axis. The date shared by the most items is annotated in words.
 */
export function RecordTimeline({ issues, meetings }: { issues: Issue[]; meetings: Meeting[] }) {
  const dated = issues.filter((i): i is Issue & { statusAsOf: string } => Boolean(i.statusAsOf));
  const met = meetings.filter((m): m is Meeting & { date: string } => Boolean(m.date)).sort((a, b) => a.date.localeCompare(b.date));
  const all = [...dated.map((i) => i.statusAsOf), ...met.map((m) => m.date)];
  if (!all.length) return <p className="figure__empty">No dated records to place on a timeline.</p>;
  const axis = monthAxis(all);

  const byDate = new Map<string, (Issue & { statusAsOf: string })[]>();
  for (const i of [...dated].sort((a, b) => STATUS_ORDER.indexOf(statusOf(a)) - STATUS_ORDER.indexOf(statusOf(b))))
    byDate.set(i.statusAsOf, [...(byDate.get(i.statusAsOf) ?? []), i]);
  const columns = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const tallest = Math.max(1, ...columns.map(([, list]) => list.length));
  const busiest = columns.reduce<[string, Issue[]] | null>((best, c) => (!best || c[1].length > best[1].length ? c : best), null);

  const meetingDays = countBy(met, (m) => m.date).sort((a, b) => a.key.localeCompare(b.key));
  const tableDates = [...new Set(all)].sort();

  // Dates a few days apart would overlap on a phone, so each mark sits at its date or just
  // clear of its left neighbor, whichever is further right (CSS max(), resolved at any width).
  const dodge = (x: number, prev: { x: number; w: number } | null) =>
    prev ? `max(${x.toFixed(3)}%, calc(${prev.x.toFixed(3)}% + ${prev.w}px))` : `${x.toFixed(3)}%`;
  const colLeft = new Map<string, string>();
  columns.forEach(([date], k) => colLeft.set(date, dodge(axis.at(date), k ? { x: axis.at(columns[k - 1][0]), w: 15 } : null)));
  const ringLeft = new Map<string, string>();
  meetingDays.forEach((d, k) => ringLeft.set(d.key, dodge(axis.at(d.key), k ? { x: axis.at(meetingDays[k - 1].key), w: meetingDays[k - 1].count * 14 + 4 } : null)));

  return (
    <div className="tl">
      <ul className="tl__legend" aria-hidden="true">
        <li>
          <span className="tl__legend-dot" /> One item, on the date its status was last recorded
        </li>
        <li>
          <span className="tl__legend-meeting" /> A board meeting
        </li>
      </ul>
      <div className="tl__plot" aria-hidden="true" style={{ '--stack': tallest } as CSSProperties}>
        {axis.months.map((m) => (
          <span key={m} className="tl__month" style={{ left: `${axis.at(m)}%` }}>
            <span className="tl__month-label">{monthLabel(m)}</span>
          </span>
        ))}
        {columns.map(([date, list]) => (
          <span key={date} className="tl__col" style={{ left: colLeft.get(date) }}>
            {list.map((i, k) => (
              <span key={i.id} className={`tl__dot seg--${statusOf(i)}`} style={{ '--k': k } as CSSProperties} data-tip={`${shortDate(date)}: ${i.title}`} />
            ))}
          </span>
        ))}
        {busiest && busiest[1].length > 1 && (
          <span
            className={`tl__note${axis.at(busiest[0]) > 55 ? ' tl__note--left' : ''}`}
            style={{ left: colLeft.get(busiest[0]), '--k': busiest[1].length } as CSSProperties}
          >
            <strong>{shortDate(busiest[0])}</strong> is the latest status date for {plural(busiest[1].length, 'item')}
          </span>
        )}
        <span className="tl__axis" />
        {meetingDays.map((d) => (
          <span key={d.key} className="tl__meeting" style={{ left: ringLeft.get(d.key) }} data-tip={`${shortDate(d.key)}: ${plural(d.count, 'meeting')}`}>
            {Array.from({ length: d.count }, (_, k) => (
              <span key={k} className="tl__ring" />
            ))}
          </span>
        ))}
      </div>
      <NumbersTable
        caption="Status last recorded, and board meetings, by date"
        head={['Date', 'Meetings', 'Items with status last recorded']}
        rows={tableDates.map((d) => {
          const list = byDate.get(d) ?? [];
          return [formatDate(d), met.filter((m) => m.date === d).length, list.length ? `${list.length} (${statusSentence(countStatuses(list))})` : 0];
        })}
      />
    </div>
  );
}

// ---------- 4. Items per meeting ----------

/**
 * One column per meeting, as tall as the number of items in this app linked to it (real agendas
 * were much longer), split by those items' current status. Each column links to its meeting.
 */
export function MeetingColumns({ meetings, issues, href }: { meetings: Meeting[]; issues: Issue[]; href: (path: string) => string }) {
  const rows = meetings
    .filter((m) => m.date)
    .sort((a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id))
    .map((m) => ({ m, items: issues.filter((i) => m.issueIds.includes(i.id) || i.meetingIds.includes(m.id)) }));
  if (!rows.length) return <p className="figure__empty">No dated meetings in this dataset.</p>;
  const max = Math.max(1, ...rows.map((r) => r.items.length));
  const ticks = niceTicks(max);
  const used = STATUS_ORDER.filter((s) => rows.some((r) => r.items.some((i) => statusOf(i) === s)));
  const sameDay = (r: (typeof rows)[number]) => rows.filter((x) => x.m.date === r.m.date).length > 1;
  return (
    <div className="cols">
      <StatusKey statuses={used} />
      <div className="cols__plot" style={{ '--max': ticks.at(-1) } as CSSProperties}>
        <div className="cols__grid" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="cols__gridline" style={{ bottom: `${(t / ticks.at(-1)!) * 100}%` }}>
              <span className="cols__tick">{t}</span>
            </span>
          ))}
        </div>
        <ol className="cols__list">
          {rows.map((r, k) => {
            const parts = countStatuses(r.items);
            const evening = sameDay(r) && (r.m.startTime ?? '') >= '12:00';
            return (
              <li key={r.m.id} className="cols__item">
                <Link
                  to={href(`/meetings/${encodeURIComponent(r.m.id)}`)}
                  className="cols__link"
                  data-tip={`${shortDate(r.m.date!)}${evening ? ' evening' : ''}: ${plural(r.items.length, 'item')}`}
                  aria-label={`${formatDate(r.m.date)}${evening ? ' (evening)' : ''} meeting: ${plural(r.items.length, 'item')} in this app${r.items.length ? `, ${statusSentence(parts)}` : ''}`}
                >
                  <span className="cols__bar" style={{ '--share': r.items.length / ticks.at(-1)!, '--i': k } as CSSProperties} aria-hidden="true">
                    <span className="cols__value">{r.items.length}</span>
                    {parts.map((p) => (
                      <span key={p.status} className={`cols__seg seg--${p.status}`} style={{ flexGrow: p.count }} />
                    ))}
                  </span>
                  <span className="cols__date" aria-hidden="true">
                    <span className="cols__month">{shortDate(r.m.date!).split(' ')[0]}</span>
                    <span className="cols__day">{shortDate(r.m.date!).split(' ')[1]}</span>
                    {sameDay(r) && <span className="cols__sub">{evening ? 'eve.' : 'day'}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      <NumbersTable
        caption="Items in this app linked to each meeting, by current status"
        head={['Meeting', 'Items here', ...used.map((s) => ISSUE_STATUS_LABELS[s])]}
        rows={rows.map((r) => [
          `${formatDate(r.m.date)}${sameDay(r) ? ((r.m.startTime ?? '') >= '12:00' ? ', evening' : ', daytime') : ''}`,
          r.items.length,
          ...used.map((s) => r.items.filter((i) => statusOf(i) === s).length),
        ])}
      />
    </div>
  );
}

/** Round tick values for a count axis starting at zero. */
function niceTicks(max: number): number[] {
  const step = max <= 5 ? 1 : max <= 12 ? 3 : max <= 25 ? 5 : Math.ceil(max / 5 / 5) * 5;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return ticks;
}

// ---------- Issue page: the item's path through its meetings ----------

/**
 * A date-scaled track for one item: each linked meeting is a stop, and the date its current
 * status was recorded is the last stop. The list under it (in the page) names every meeting.
 */
export function StatusTrack({ issue, meetings }: { issue: Issue; meetings: Meeting[] }) {
  const dated = meetings.filter((m): m is Meeting & { date: string } => Boolean(m.date)).sort((a, b) => a.date.localeCompare(b.date));
  const status = statusOf(issue);
  const meetingDates = [...new Set(dated.map((m) => m.date))];
  const dates = [...meetingDates, ...(issue.statusAsOf ? [issue.statusAsOf] : [])].sort();
  const first = dates[0];
  const last = dates.at(-1);
  const days = first && last ? dayNumber(last) - dayNumber(first) : 0;
  const lead = (
    <p className="track__lead">
      {dated.length ? `Taken up at ${plural(dated.length, 'meeting')}` : 'No dated meetings'}
      {dated.length > 1 && days > 0 ? ` over ${plural(days, 'day')}` : ''}
      {issue.statusAsOf ? `; status as of ${shortDate(issue.statusAsOf)}: ${ISSUE_STATUS_LABELS[status].toLowerCase()}.` : '; no status date recorded.'}
    </p>
  );
  // A single meeting needs no chart: the sentence says it all.
  if (dated.length < 2 || !first || !last) return <div className="track track--text">{lead}</div>;
  // Pad either side so the end stops never sit on the frame.
  const s = dayNumber(first) - 4;
  const span = Math.max(8, dayNumber(last) + 4 - s);
  const at = (iso: string) => ((dayNumber(iso) - s) / span) * 100;
  const countOn = (d: string) => dated.filter((m) => m.date === d).length;
  return (
    <div className="track">
      {lead}
      <div className="track__plot" aria-hidden="true">
        <span className="track__line" style={{ left: `${at(first)}%`, width: `${at(last) - at(first)}%` }} />
        {meetingDates.map((d) => (
          <span key={d} className={`track__stop${countOn(d) > 1 ? ' track__stop--multi' : ''}`} style={{ left: `${at(d)}%` }}>
            {countOn(d) > 1 && <span className="track__n">{countOn(d)}</span>}
            <span className="track__label">{shortDate(d)}</span>
          </span>
        ))}
        {issue.statusAsOf && (
          <span className={`track__status seg--${status}`} style={{ left: `${at(issue.statusAsOf)}%` }}>
            <span className="track__glyph">{STATUS_GLYPHS[status]}</span>
          </span>
        )}
      </div>
      <p className="track__key" aria-hidden="true">
        Rings are meetings{meetingDates.some((d) => countOn(d) > 1) ? '; a number counts meetings held that day' : ''}. The colored mark is the status date.
      </p>
    </div>
  );
}

// ---------- Meeting page: what became of the items ----------

/**
 * The meeting's items as squares in three groups: a final status dated this meeting's day, a
 * final status dated another day, or still open. Squares are sorted by status in each group. Counts are printed beside each group.
 */
export function MeetingOutcome({ meeting, issues }: { meeting: Meeting; issues: Issue[] }) {
  const open = (i: Issue) => !DECIDED.includes(statusOf(i));
  const groups = [
    {
      key: 'here',
      title: 'Final status dated this day',
      note: 'Approved, denied, withdrawn or completed, with the status dated the day of this meeting',
      items: issues.filter((i) => !open(i) && meeting.date && i.statusAsOf === meeting.date),
    },
    {
      key: 'later',
      title: 'Final status dated another day',
      note: 'A final status dated on a different day',
      items: issues.filter((i) => !open(i) && !(meeting.date && i.statusAsOf === meeting.date)),
    },
    { key: 'open', title: 'Still open', note: 'No final decision recorded yet', items: issues.filter(open) },
  ]
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => STATUS_ORDER.indexOf(statusOf(a)) - STATUS_ORDER.indexOf(statusOf(b))) }))
    .filter((g) => g.items.length);
  const used = STATUS_ORDER.filter((s) => issues.some((i) => statusOf(i) === s));
  return (
    <div className="outcome">
      <div className="outcome__groups">
        {groups.map((g) => (
          <section key={g.key} className="outcome__group" aria-label={`${g.title}: ${plural(g.items.length, 'item')}`}>
            <p className="outcome__count">{g.items.length}</p>
            <p className="outcome__title">{g.title}</p>
            <p className="outcome__note">{g.note}</p>
            <ul className="outcome__cells">
              {g.items.map((i) => (
                <li key={i.id} className={`unit unit--lg seg--${statusOf(i)}`} data-tip={i.title}>
                  <span className="visually-hidden">
                    {i.title}, {ISSUE_STATUS_LABELS[statusOf(i)].toLowerCase()}
                  </span>
                  <span aria-hidden="true" className="unit__glyph">
                    {STATUS_GLYPHS[statusOf(i)]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <StatusKey statuses={used} />
    </div>
  );
}

// ---------- Coming Soon: statewide coverage squares ----------

/** One square per county, filled where civic records exist. Squares are in alphabetical order, not a map. */
export function CoverageGrid({ counties, highlightId }: { counties: { id: string; name: string; civicDataAvailable: boolean }[]; highlightId?: string }) {
  const covered = counties.filter((c) => c.civicDataAvailable);
  const highlight = counties.find((c) => c.id === highlightId);
  return (
    <div className="coverage">
      <div className="coverage__grid" aria-hidden="true">
        {counties.map((c) => (
          <span key={c.id} className={`coverage__cell${c.civicDataAvailable ? ' is-covered' : ''}${c.id === highlightId ? ' is-here' : ''}`} />
        ))}
      </div>
      <div className="coverage__key" aria-hidden="true">
        <span className="coverage__keyitem">
          <span className="coverage__cell is-covered" /> Records available
        </span>
        {highlight && !highlight.civicDataAvailable && (
          <span className="coverage__keyitem">
            <span className="coverage__cell is-here" /> {highlight.name}
          </span>
        )}
        <span className="coverage__keyitem">
          <span className="coverage__cell" /> Coming soon
        </span>
      </div>
      <p className="coverage__text">
        One square per county, in alphabetical order. Records available: {covered.length ? covered.map((c) => c.name).join(', ') : 'none yet'}. The other{' '}
        {counties.length - covered.length}: coming soon.
        {highlight && !highlight.civicDataAvailable ? ` ${highlight.name} is the square with a ring.` : ''}
      </p>
    </div>
  );
}

/** Horizontal bars in a table (used by the archive's records-per-month figure). */
export type BarRow = { key: string; label: string; value: number };
export function BarTable({ rows, caption, unit }: { rows: BarRow[]; caption: string; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <table className="bartable">
      <caption className="visually-hidden">{caption}</caption>
      <thead className="visually-hidden">
        <tr>
          <th scope="col">Name</th>
          <th scope="col">{unit}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.key}>
            <th scope="row" className="bartable__label">
              {r.label}
            </th>
            <td className="bartable__cell">
              <span className="bartable__bar" aria-hidden="true" style={{ '--share': r.value / max, '--i': i } as CSSProperties} />
              <span className="num">{r.value}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
