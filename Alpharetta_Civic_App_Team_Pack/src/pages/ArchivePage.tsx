import { Link, useSearchParams } from 'react-router-dom';
import { getDocuments, getMeetings } from '../services/civicData';
import { formatDate, humanize, meetingTypeLabel, safeUrl } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { MockBadge } from '../components/MockBadge';
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

  const entries = state.status === 'ready' ? buildArchiveEntries(state.data[0], state.data[1]) : [];
  const visible = entries.filter((e) => e.groups.includes(filter));
  const count = (f: ArchiveFilter) => entries.filter((e) => e.groups.includes(f)).length;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Archive</h1>
        <p className="page-header__lede">
          Meetings, recordings, agendas, and supporting documents. This is a small selected set of records, not the city’s complete archive.
        </p>
      </header>

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
          <p className="visually-hidden" role="status" aria-live="polite">
            Showing {visible.length} {visible.length === 1 ? 'record' : 'records'}
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
              title={EMPTY_COPY[filter]}
              action={
                filter !== 'all' && (
                  <button type="button" className="button button--ghost" onClick={() => setFilter('all')}>
                    Show all records
                  </button>
                )
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function ArchiveRow({ entry }: { entry: ArchiveEntry }) {
  const isMeeting = entry.kind === 'meeting';
  const to = isMeeting ? `/meetings/${encodeURIComponent(entry.id)}` : `/documents/${encodeURIComponent(entry.id)}`;
  const typeLabel = isMeeting ? `Meeting · ${meetingTypeLabel(entry.record.meetingType)}` : humanize(entry.record.documentType);
  const availability = isMeeting
    ? safeUrl(entry.record.recordingUrl)
      ? 'Recording available'
      : 'No recording linked'
    : safeUrl(entry.record.url)
      ? 'File available'
      : 'No file linked';

  return (
    <article className={`archive-row archive-row--${entry.kind}`}>
      <span className="archive-row__icon" aria-hidden="true">
        {isMeeting ? '◷' : '▤'}
      </span>
      <div className="archive-row__body">
        <div className="card__meta">
          <span className="eyebrow">{typeLabel}</span>
          <MockBadge record={entry.record} />
        </div>
        <h2 className="archive-row__title">
          <Link to={to} className="card__link">
            {entry.record.title}
          </Link>
        </h2>
        <p className="muted">
          {formatDate(entry.date)} · {availability}
        </p>
      </div>
    </article>
  );
}
