import type { CSSProperties, ReactNode } from 'react';
import type { Issue, IssueStatus, Meeting } from '../types/civic';
import { formatDate, ISSUE_STATUS_LABELS } from '../services/format';
import { STATUS_GLYPHS } from './StatusBadge';

// "Data Desk" figures. Every number here is counted at render time from records the page
// already loaded through src/services; nothing is hard-coded. Each figure prints its numbers
// as text next to the bars, so no value is carried by length or color alone.

/** Display order for statuses: settled outcomes first, then open, then the rest. */
const STATUS_ORDER: IssueStatus[] = ['approved', 'completed', 'under_consideration', 'proposed', 'denied', 'withdrawn', 'unknown'];

export type StatusCount = { status: IssueStatus; count: number };

export function countStatuses(issues: Issue[]): StatusCount[] {
  return STATUS_ORDER.map((status) => ({
    status,
    count: issues.filter((i) => (i.status in ISSUE_STATUS_LABELS ? i.status : 'unknown') === status).length,
  })).filter((s) => s.count > 0);
}

export function countBy<T>(items: T[], key: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return [...map.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "19 approved, 3 under consideration and 2 denied" */
export function statusSentence(counts: StatusCount[]): string {
  const parts = counts.map((c) => `${c.count} ${ISSUE_STATUS_LABELS[c.status].toLowerCase()}`);
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

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

/** A figure: title, the chart, then (when it stands alone) the source line. */
export function Figure({ id, title, children, source, className = '' }: { id: string; title: string; children: ReactNode; source?: ReactNode; className?: string }) {
  return (
    <figure className={`figure ${className}`} aria-labelledby={id}>
      <figcaption id={id} className="figure__title">
        {title}
      </figcaption>
      {children}
      {source}
    </figure>
  );
}

/** One stacked bar of issue statuses, with a legend that prints every count and share. */
export function StatusBar({ counts, label }: { counts: StatusCount[]; label: string }) {
  const total = counts.reduce((s, c) => s + c.count, 0);
  if (!total) return null;
  return (
    <div className="statusbar">
      <div className="statusbar__track" aria-hidden="true">
        {counts.map((c, i) => (
          <span
            key={c.status}
            className={`statusbar__seg seg--${c.status}`}
            style={{ '--share': c.count / total, '--i': i } as CSSProperties}
          />
        ))}
      </div>
      <table className="statusbar__legend">
        <caption className="visually-hidden">{label}</caption>
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Items</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((c) => (
            <tr key={c.status}>
              <th scope="row">
                <span className={`key seg--${c.status}`} aria-hidden="true">
                  {STATUS_GLYPHS[c.status]}
                </span>
                {ISSUE_STATUS_LABELS[c.status]}
              </th>
              <td className="num">{c.count}</td>
              <td className="num num--muted">{Math.round((c.count / total) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type BarRow = { key: string; label: string; value: number; pressed?: boolean; onSelect?: () => void; actionLabel?: string };

/**
 * Horizontal bars in a table (ProPublica's bar-in-table cells): label, bar, and the number as text.
 * Rows with `onSelect` become toggle buttons, e.g. to filter the list below by that topic.
 */
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
          <tr key={r.key} className={r.pressed ? 'is-pressed' : undefined}>
            <th scope="row" className="bartable__label">
              {r.onSelect ? (
                <button type="button" className="bartable__button" aria-pressed={Boolean(r.pressed)} onClick={r.onSelect}>
                  {r.label}
                  {r.actionLabel && <span className="visually-hidden">{r.actionLabel}</span>}
                </button>
              ) : (
                r.label
              )}
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

const monthName = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayOf = (iso: string) => Date.parse(`${iso}T12:00:00Z`) / 86_400_000;

/**
 * Meetings on a dated strip: one mark per meeting, placed by date between the first and last
 * meeting, with month ticks. The per-month counts underneath are the text equivalent.
 */
export function MeetingStrip({ meetings }: { meetings: Meeting[] }) {
  const dated = meetings.filter((m): m is Meeting & { date: string } => Boolean(m.date)).sort((a, b) => a.date.localeCompare(b.date));
  if (!dated.length) return <p className="figure__empty">No meetings in this dataset have a date.</p>;
  const first = dated[0].date;
  const last = dated.at(-1)!.date;
  // Pad the axis to whole months so the ticks sit on the 1st.
  const start = `${first.slice(0, 7)}-01`;
  const endMonth = new Date(`${last.slice(0, 7)}-01T12:00:00Z`);
  endMonth.setUTCMonth(endMonth.getUTCMonth() + 1);
  const end = endMonth.toISOString().slice(0, 10);
  const span = Math.max(1, dayOf(end) - dayOf(start));
  const at = (iso: string) => ((dayOf(iso) - dayOf(start)) / span) * 100;

  const months: string[] = [];
  for (const d = new Date(`${start}T12:00:00Z`); d.toISOString().slice(0, 10) < end; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 10));
  const perMonth = months.map((m) => ({ month: m, count: dated.filter((x) => x.date.startsWith(m.slice(0, 7))).length }));

  // Marks closer than ~3% of the axis stack upward so none hides another.
  const lastInRow: number[] = [];
  const marks = dated.map((m) => {
    const x = at(m.date);
    let row = lastInRow.findIndex((prev) => x - prev > 3);
    if (row === -1) row = lastInRow.length;
    lastInRow[row] = x;
    return { m, x, row };
  });

  return (
    <div className="strip">
      <div className="strip__plot" aria-hidden="true" style={{ '--rows': lastInRow.length } as CSSProperties}>
        {months.map((m) => (
          <span key={m} className="strip__tick" style={{ left: `${at(m)}%` }}>
            <span className="strip__ticklabel">{new Date(`${m}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span>
          </span>
        ))}
        {marks.map(({ m, x, row }, i) => (
          <span key={m.id} className="strip__mark" style={{ left: `${x}%`, '--row': row, '--i': i } as CSSProperties} />
        ))}
        <span className="strip__axis" />
      </div>
      <table className="strip__table">
        <caption className="visually-hidden">Meetings per month</caption>
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Meetings</th>
          </tr>
        </thead>
        <tbody>
          {perMonth.map((p) => (
            <tr key={p.month}>
              <th scope="row">{monthName(p.month)}</th>
              <td className="num">{plural(p.count, 'meeting')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="strip__range">
        First on record {formatDate(first)}; latest {formatDate(last)}.
      </p>
    </div>
  );
}

/** One square per county, filled where civic records exist. Squares are in alphabetical order, not a map. */
export function CoverageGrid({ counties, highlightId }: { counties: { id: string; name: string; civicDataAvailable: boolean }[]; highlightId?: string }) {
  const covered = counties.filter((c) => c.civicDataAvailable);
  const highlight = counties.find((c) => c.id === highlightId);
  return (
    <div className="coverage">
      <div className="coverage__grid" aria-hidden="true">
        {counties.map((c) => (
          <span
            key={c.id}
            className={`coverage__cell${c.civicDataAvailable ? ' is-covered' : ''}${c.id === highlightId ? ' is-here' : ''}`}
          />
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
        One square per county, in alphabetical order. Records available: {covered.length ? covered.map((c) => c.name).join(', ') : 'none yet'}. The other {counties.length - covered.length}: coming soon.
        {highlight && !highlight.civicDataAvailable ? ` ${highlight.name} is the square with a ring.` : ''}
      </p>
    </div>
  );
}

