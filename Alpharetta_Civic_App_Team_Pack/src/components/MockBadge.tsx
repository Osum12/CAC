import type { ProvenancedRecord } from '../types/civic';

export const isMock = (r: ProvenancedRecord) => r.mockOnly || r.dataMode === 'mock';

/** Shared provenance label. Every page uses this for mock records; curated records show a quieter tag. */
export function MockBadge({ record, size = 'sm' }: { record: ProvenancedRecord; size?: 'sm' | 'lg' }) {
  if (isMock(record)) {
    return (
      <span className={`badge badge--mock badge--${size}`} title="Sample data — not an official city record">
        <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
          <path d="M8 1.5 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6v3.6M8 11.4v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Sample data
      </span>
    );
  }
  return <span className={`badge badge--curated badge--${size}`}>Curated from official source</span>;
}

/** Inline notice for record detail pages explaining what a mock record is. */
export function MockNotice({ record }: { record: ProvenancedRecord }) {
  if (!isMock(record)) return null;
  return (
    <p className="mock-notice" role="note">
      <strong>Sample data — not an official city record.</strong> This record is fictional test content used to build the app. Its
      title, dates, status, and map point do not describe a real Alpharetta decision.
    </p>
  );
}
