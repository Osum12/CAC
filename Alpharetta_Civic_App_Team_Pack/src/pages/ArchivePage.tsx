import { Link, useSearchParams } from 'react-router-dom';
import { getDocuments, getMeetings } from '../services/civicData';
import { formatDate, formatTime, humanize, meetingTypeLabel, safeUrl } from '../services/format';
import { DATE_RANGE_LABELS, documentMatches, inDateRange, isDateRange, meetingMatches, type DateRange } from '../services/filters';
import { MeetingStatusBadge } from '../components/StatusBadge';
import { ExternalAction } from '../components/Cards';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { MockBadge, isMock } from '../components/MockBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import type { CivicDocument, Meeting } from '../types/civic';

export type ArchiveFilter = 'all' | 'videos' | 'agendas' | 'documents';

export type ArchiveEntry =
  | { kind: 'meeting'; id: string; date: string | null; record: Meeting; groups: ArchiveFilter[] }
  | { kind: 'document'; id: string; date: string | null; record: CivicDocument; groups: ArchiveFilter[] };

const FILTERS: { id: ArchiveFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'videos', label: 'Videos' },
  { id: 'agendas', label: 'Agendas' },
  { id: 'documents', label: 'Documents' },
];

// Display grouping only; the source documentType values are never changed.
const AGENDA_TYPES = new Set(['agenda', 'agenda_packet']);

/** Builds one date-sorted list of meetings and documents, tagged with the filter groups each belongs to. */
export function buildArchiveEntries(meetings: Meeting[], documents: CivicDocument[]): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [
    ...meetings.map((m) => ({
      kind: 'meeting' as const,
      id: m.id,
      date: m.date,
      record: m,
      groups: ['all', ...(safeUrl(m.recordingUrl) ? ['videos' as const] : [])] as ArchiveFilter[],
    })),
    ...documents.map((d) => ({
      kind: 'document' as const,
      id: d.id,
      date: d.publishedDate,
      record: d,
      groups: ['all', AGENDA_TYPES.has(d.documentType) ? 'agendas' : 'documents'] as ArchiveFilter[],
    })),
  ];
  return entries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.kind.localeCompare(a.kind)); // same date: meeting before its documents
}

const EMPTY_COPY: Record<ArchiveFilter, string> = {
  all: 'No meetings or documents are in the archive yet.',
  videos: 'No meeting recordings are linked in this dataset yet.',
  agendas: 'No agendas are in this dataset yet.',
  documents: 'No other documents are in this dataset yet.',
};

export function ArchivePage() {
  usePageTitle('Archive');
  const [params, setParams] = useSearchParams();
  const raw = params.get('type');
  const filter: ArchiveFilter = FILTERS.some((f) => f.id === raw) ? (raw as ArchiveFilter) : 'all';
  const state = useAsync(() => Promise.all([getMeetings(), getDocuments()]), []);

  const setFilter = (next: ArchiveFilter) => {
    const p = new URLSearchParams(params);
    if (next === 'all') p.delete('type');
    else p.set('type', next);
    setParams(p, { replace: true });
  };

  const q = params.get('q') ?? '';
  const rawWhen = params.get('when') ?? '';
  const when: DateRange = isDateRange(rawWhen) ? rawWhen : '';
  const setParam = (key: 'q' | 'when', next: string) => {
    const p = new URLSearchParams(params);
    if (next) p.set(key, next);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const entries = state.status === 'ready' ? buildArchiveEntries(state.data[0], state.data[1]).filter((e) => entryMatches(e, q) && inDateRange(e.date, when)) : [];
  const visible = entries.filter((e) => e.groups.includes(filter));
  const count = (f: ArchiveFilter) => entries.filter((e) => e.groups.includes(f)).length;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Archive</h1>
        <p className="page-header__lede">
          Meetings, recordings, agendas, and minutes, each linked to the original file. This is a small selected set of records, not the city’s complete archive.
        </p>
      </header>

      <form className="filters filters--compact" role="search" aria-label="Search the archive" onSubmit={(e) => e.preventDefault()}>
        <div className="filters__field filters__field--grow">
          <label htmlFor="archive-q">Search meetings and documents</label>
          <input id="archive-q" type="search" value={q} placeholder="e.g. minutes, Planning Commission, September" onChange={(e) => setParam('q', e.target.value)} />
        </div>
        <div className="filters__field">
          <label htmlFor="archive-when">Date</label>
          <select id="archive-when" value={when} onChange={(e) => setParam('when', e.target.value)}>
            <option value="">Any time</option>
            {(Object.keys(DATE_RANGE_LABELS) as (keyof typeof DATE_RANGE_LABELS)[]).map((r) => (
              <option key={r} value={r}>
                {DATE_RANGE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="filter-bar" role="group" aria-label="Filter by record type">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            disabled={state.status !== 'ready'}
          >
            {f.label}
            {state.status === 'ready' && <span className="chip__count">{count(f.id)}</span>}
          </button>
        ))}
      </div>

      {state.status === 'loading' && <LoadingState rows={5} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'ready' && (
        <>
          <p className="results-count" role="status" aria-live="polite">
            {visible.length} {visible.length === 1 ? 'record' : 'records'}
            {q ? ` matching “${q}”` : ''}
            {when ? ` · ${DATE_RANGE_LABELS[when].toLowerCase()}` : ''}
          </p>
          {visible.length ? (
            <ol className="archive-list">
              {visible.map((e) => (
                <li key={`${e.kind}-${e.id}`}>
                  <ArchiveRow entry={e} />
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title={when ? `No ${filter === 'all' ? 'records' : FILTERS.find((f) => f.id === filter)!.label.toLowerCase()} match these filters for “${DATE_RANGE_LABELS[when]}”.` : emptyTitle(filter, q, count('all'))}
              action={
                <div className="button-row">
                  {q && filter !== 'all' && count('all') > 0 && (
                    <button type="button" className="button button--ghost" onClick={() => setFilter('all')}>
                      Show all types
                    </button>
                  )}
                  {(q || when || filter !== 'all') && (
                    <button type="button" className="button button--ghost" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                      Show all records
                    </button>
                  )}
                </div>
              }
            />
          )}
        </>
      )}
    </div>
  );
}

/** Explains an empty result, naming the active type so a combined search isn't misleading. */
function emptyTitle(filter: ArchiveFilter, q: string, matchesInAll: number): string {
  if (!q) return EMPTY_COPY[filter];
  if (filter === 'all') return `No records match “${q}”.`;
  const type = FILTERS.find((f) => f.id === filter)!.label.toLowerCase();
  return matchesInAll > 0
    ? `No ${type} match “${q}”. ${matchesInAll} other ${matchesInAll === 1 ? 'record matches' : 'records match'} in All.`
    : `No records match “${q}”.`;
}

const entryMatches = (e: ArchiveEntry, q: string) => (e.kind === 'meeting' ? meetingMatches(e.record, q) : documentMatches(e.record, q));

function ArchiveRow({ entry }: { entry: ArchiveEntry }) {
  const isMeeting = entry.kind === 'meeting';
  const to = isMeeting ? `/meetings/${encodeURIComponent(entry.id)}` : `/documents/${encodeURIComponent(entry.id)}`;
  const typeLabel = isMeeting ? `Meeting · ${meetingTypeLabel(entry.record.meetingType)}` : humanize(entry.record.documentType);
  const mock = isMock(entry.record);
  const recording = isMeeting && !mock ? safeUrl(entry.record.recordingUrl) : null;
  const file = !isMeeting && !mock ? safeUrl(entry.record.url) : null;
  const time = isMeeting ? formatTime(entry.record.startTime) : null;

  return (
    <article className={`archive-row archive-row--${entry.kind}`}>
      <span className="archive-row__icon" aria-hidden="true">
        {isMeeting ? '◷' : '▤'}
      </span>
      <div className="archive-row__body">
        <div className="card__top">
          <span className="eyebrow">{typeLabel}</span>
          {isMeeting && <MeetingStatusBadge status={entry.record.status} />}
          {mock && <MockBadge record={entry.record} />}
        </div>
        <h2 className="archive-row__title">
          <Link to={to} className="card__link">
            {entry.record.title}
          </Link>
        </h2>
        <p className="archive-row__date">
          {isMeeting ? '' : 'Published '}
          <time dateTime={entry.date ?? undefined}>{formatDate(entry.date)}</time>
          {time ? ` · ${time}` : ''}
        </p>
        <div className="card__actions">
          {isMeeting ? (
            recording ? (
              <ExternalAction href={recording} context={entry.record.title}>
                Watch recording
              </ExternalAction>
            ) : (
              <span className="card__action card__action--muted">No recording linked</span>
            )
          ) : file ? (
            <ExternalAction href={file} context={entry.record.title}>
              Open PDF
            </ExternalAction>
          ) : (
            <span className="card__action card__action--muted">No file linked</span>
          )}
        </div>
      </div>
    </article>
  );
}
