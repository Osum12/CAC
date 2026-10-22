import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getIssues } from '../services/civicData';
import { humanize } from '../services/format';
import { DEMO_LOCATIONS, rankIssuesForLocation, type RankedIssue } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueMap, type MapPoint } from '../components/IssueMap';
import { MockBadge, isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';

export function NearMePage() {
  usePageTitle('Near Me');
  const [params, setParams] = useSearchParams();
  const origin = DEMO_LOCATIONS.find((l) => l.id === params.get('loc')) ?? null;
  const selectedId = params.get('issue');
  const state = useAsync(() => getIssues(), []);

  const updateParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const issues = state.status === 'ready' ? state.data : null;
  const ranked = useMemo(() => (issues ? rankIssuesForLocation(issues, origin) : []), [issues, origin]);
  // Pin numbers count only issues that have coordinates, so pins read 1, 2, 3… with no gaps.
  const points: MapPoint[] = useMemo(
    () =>
      ranked
        .filter((r) => r.coords)
        .map((r, i) => ({ id: r.issue.id, title: r.issue.title, number: i + 1, coords: r.coords!, sample: isMock(r.issue) || !r.issue.location?.verified })),
    [ranked],
  );
  const pinNumber = (id: string) => points.find((p) => p.id === id)?.number ?? null;

  // When a marker is chosen, bring its card into view.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!selectedId) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listRef.current
      ?.querySelector(`[data-issue-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView?.({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [selectedId, ranked]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Near Me</h1>
        <p className="page-header__lede">
          See which issues have a map point close to a location. Every Alpharetta issue stays in the list. Distance helps you sort them, but
          it doesn’t tell you whether an issue affects a particular home.
        </p>
      </header>

      <LocationPicker originId={origin?.id ?? null} onChoose={(id) => updateParam('loc', id)} />

      {state.status === 'loading' && <LoadingState rows={4} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'ready' &&
        (ranked.length === 0 ? (
          <EmptyState title="No issues are in the dataset yet." />
        ) : (
          <div className="nearme">
            <section className="nearme__map" aria-labelledby="map-h">
              <h2 id="map-h" className="visually-hidden">
                Map
              </h2>
              <IssueMap points={points} origin={origin} selectedId={selectedId} onSelect={(id) => updateParam('issue', id)} />
              <p className="fine-print">
                Numbered pins match the list. Pins marked as sample are fictional test points, not real project sites.{' '}
                {ranked.length - points.length > 0 &&
                  `${ranked.length - points.length} issue${ranked.length - points.length > 1 ? 's have' : ' has'} no map location and appear${ranked.length - points.length > 1 ? '' : 's'} in the list only.`}
              </p>
            </section>
            <section className="nearme__feed" aria-labelledby="feed-h">
              <h2 id="feed-h" className="nearme__feed-title">
                {origin ? `Sorted by distance from ${origin.label}` : 'All Alpharetta issues'}
              </h2>
              {!origin && <p className="muted">Pick a demo point above to sort this list by distance.</p>}
              <ol className="feed" ref={listRef}>
                {ranked.map((r) => (
                  <li key={r.issue.id}>
                    <FeedItem
                      ranked={r}
                      number={pinNumber(r.issue.id)}
                      selected={r.issue.id === selectedId}
                      onShowOnMap={() => updateParam('issue', r.issue.id === selectedId ? null : r.issue.id)}
                    />
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ))}
    </div>
  );
}

function LocationPicker({ originId, onChoose }: { originId: string | null; onChoose: (id: string | null) => void }) {
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  // There is no geocoding service in this prototype. An entered address is never
  // looked up, stored, or logged; the user is told plainly and offered demo points.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = address.trim();
    if (!value) {
      setMessage({ tone: 'error', text: 'Enter an address, or choose a demo point instead.' });
      return;
    }
    if (value.length < 5 || !/[a-z]/i.test(value)) {
      setMessage({ tone: 'error', text: 'That doesn’t look like a street address. Try something like a street number and name.' });
      return;
    }
    setAddress('');
    setMessage({
      tone: 'info',
      text: 'Address lookup isn’t connected in this prototype, so we didn’t search for that address and haven’t saved it. Choose a demo point to try the feature.',
    });
  };

  return (
    <section className="locator" aria-labelledby="locator-h">
      <h2 id="locator-h" className="locator__title">
        Choose a location
      </h2>
      <div className="locator__grid">
        <fieldset className="locator__demo">
          <legend>Demo points (fictional)</legend>
          <div className="locator__options">
            {[{ id: null, label: 'No location', description: 'Show every issue unsorted' }, ...DEMO_LOCATIONS].map((l) => (
              <label key={l.id ?? 'none'} className="radio-card">
                <input
                  type="radio"
                  name="demo-location"
                  checked={originId === l.id}
                  onChange={() => {
                    onChoose(l.id);
                    setMessage(null);
                  }}
                />
                <span className="radio-card__label">{l.label}</span>
                <span className="radio-card__desc">{l.description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <form className="locator__address" onSubmit={onSubmit} noValidate>
          <label htmlFor="address-input">Or enter an address</label>
          <div className="input-row">
            <input
              id="address-input"
              type="text"
              autoComplete="off"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-describedby="address-help address-msg"
              aria-invalid={message?.tone === 'error'}
            />
            <button type="submit" className="button">
              Search
            </button>
          </div>
          <p id="address-help" className="fine-print">
            Address search isn’t available in this prototype yet.
          </p>
          <p id="address-msg" className={`form-msg${message ? ` form-msg--${message.tone}` : ''}`} role="status" aria-live="polite">
            {message?.text}
          </p>
        </form>
      </div>
    </section>
  );
}

function FeedItem({ ranked, number, selected, onShowOnMap }: { ranked: RankedIssue; number: number | null; selected: boolean; onShowOnMap: () => void }) {
  const { issue, coords, reason } = ranked;
  return (
    <article className={`feed-item${selected ? ' feed-item--selected' : ''}`} data-issue-id={issue.id}>
      {number !== null ? (
        <span className="feed-item__num">
          <span className="visually-hidden">Map pin </span>
          {number}
        </span>
      ) : (
        <span className="feed-item__num feed-item__num--none" aria-hidden="true">
          —
        </span>
      )}
      <div className="feed-item__body">
        <div className="card__meta">
          <span className="eyebrow">{humanize(issue.category)}</span>
          <MockBadge record={issue} />
        </div>
        <h3 className="feed-item__title">
          <Link to={`/issues/${encodeURIComponent(issue.id)}`}>{issue.title}</Link>
        </h3>
        <p className="feed-item__reason">
          <span className="visually-hidden">Why it’s listed: </span>
          {reason}
        </p>
        <div className="card__foot">
          <IssueStatusBadge status={issue.status} />
          {coords && (
            <button type="button" className="button button--small button--ghost" aria-pressed={selected} onClick={onShowOnMap}>
              {selected ? 'Highlighted on map' : 'Show on map'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
