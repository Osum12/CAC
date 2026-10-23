import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParams } from '../services/useUrlParams';
import { getIssues } from '../services/civicData';
import { humanize } from '../services/format';
import { topicsIn } from '../services/filters';
import { DEMO_LOCATIONS, pointKind, rankIssuesForLocation, type RankedIssue } from '../services/nearMe';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { IssueMap, type MapPoint } from '../components/IssueMap';
import { MockBadge, isMock } from '../components/MockBadge';
import { IssueStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { usePlaceHref } from '../services/placeContext';
import { PinIcon } from '../components/PinIcon';

export function NearMePage() {
  usePageTitle('Near Me');
  const { params, setParam } = useUrlParams();
  // One public starting point; nothing about the viewer's own location is asked for or stored.
  const origin = DEMO_LOCATIONS[0];
  const selectedId = params.get('issue');
  const state = useAsync(() => getIssues(), []);

  const updateParam = (key: string, value: string | null) => {
    setParam(key, value);
  };

  const issues = state.status === 'ready' ? state.data : null;
  const topics = useMemo(() => (issues ? topicsIn(issues) : []), [issues]);
  const rawTopic = params.get('topic') ?? '';
  const topic = topics.includes(rawTopic) ? rawTopic : '';
  const ranked = useMemo(
    () => (issues ? rankIssuesForLocation(topic ? issues.filter((i) => i.category === topic) : issues, origin) : []),
    [issues, origin, topic],
  );
  const setTopic = (next: string) => {
    // A highlighted issue outside the new category would have no pin or card, so drop it.
    const selected = issues?.find((i) => i.id === selectedId);
    if (next && selected && selected.category !== next) updateParam('issue', null);
    updateParam('topic', next || null);
  };
  // Pin numbers count only issues that have coordinates, so pins read 1, 2, 3… with no gaps.
  const points: MapPoint[] = useMemo(
    () =>
      ranked
        .filter((r) => r.coords)
        .map((r, i) => ({ id: r.issue.id, title: r.issue.title, number: i + 1, coords: r.coords!, note: r.issue.location?.verified ? null : isMock(r.issue) ? 'sample map point' : pointKind(r.issue) })),
    [ranked],
  );
  const pinNumber = (id: string) => points.find((p) => p.id === id)?.number ?? null;

  // When a marker is chosen, bring its card into view. When the choice came from a card's
  // "Show on map" button on the stacked layout, bring the map into view instead.
  const listRef = useRef<HTMLOListElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const fromFeed = useRef(false);
  useEffect(() => {
    if (!selectedId) return;
    const stacked = window.matchMedia?.('(max-width: 900px)').matches;
    if (fromFeed.current) {
      fromFeed.current = false;
      if (stacked) {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        mapRef.current?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
      return;
    }
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
          Issues with a map location, nearest first. Distance helps you find nearby items, but it doesn’t tell you whether an issue
          affects a particular home.
        </p>
      </header>

      <p className="nearme__start">
        <PinIcon className="nearme__start-icon" />
        <span>
          Distances are measured from <strong>{origin.label}</strong>, {origin.description}.
        </span>
      </p>

      {state.status === 'loading' && <LoadingState rows={4} />}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'ready' && topics.length > 0 && (
        <form className="filters nearme__filters" role="search" aria-label="Filter issues by category" onSubmit={(e) => e.preventDefault()}>
          <div className="filters__field">
            <label htmlFor="nearme-topic">Category</label>
            <select id="nearme-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All categories</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </div>
          <p className="results-count nearme__count" role="status" aria-live="polite">
            {ranked.length} {ranked.length === 1 ? 'issue' : 'issues'}
            {topic ? ` in ${humanize(topic)}` : ''}, {points.length} on the map
          </p>
        </form>
      )}
      {state.status === 'ready' &&
        (ranked.length === 0 ? (
          <EmptyState title="No issues are in the dataset yet." />
        ) : (
          <div className="nearme">
            <section className="nearme__map" aria-labelledby="map-h" ref={mapRef}>
              <h2 id="map-h" className="visually-hidden">
                Map
              </h2>
              <IssueMap points={points} origin={origin} selectedId={selectedId} onSelect={(id) => updateParam('issue', id)} />
              <p className="fine-print">
                Numbered pins match the list. Dashed pins are approximate: they are placed from a street address, not an exact site boundary.{' '}
                {ranked.length - points.length > 0 &&
                  `${ranked.length - points.length} issue${ranked.length - points.length > 1 ? 's have' : ' has'} no map location and appear${ranked.length - points.length > 1 ? '' : 's'} in the list only.`}
              </p>
            </section>
            <section className="nearme__feed" aria-labelledby="feed-h">
              <h2 id="feed-h" className="nearme__feed-title">
                Sorted by distance from {origin.label}
              </h2>
              <ol className="feed" ref={listRef}>
                {ranked.map((r) => (
                  <li key={r.issue.id}>
                    <FeedItem
                      ranked={r}
                      number={pinNumber(r.issue.id)}
                      selected={r.issue.id === selectedId}
                      onShowOnMap={() => {
                        fromFeed.current = r.issue.id !== selectedId;
                        updateParam('issue', r.issue.id === selectedId ? null : r.issue.id);
                      }}
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

function FeedItem({ ranked, number, selected, onShowOnMap }: { ranked: RankedIssue; number: number | null; selected: boolean; onShowOnMap: () => void }) {
  const href = usePlaceHref();
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
        <div className="card__top">
          <span className="tag">{humanize(issue.category)}</span>
          <IssueStatusBadge status={issue.status} />
        </div>
        <h3 className="feed-item__title">
          <Link to={href(`/issues/${encodeURIComponent(issue.id)}`)}>{issue.title}</Link>
        </h3>
        <p className="feed-item__reason">
          <span className="visually-hidden">Why it’s listed: </span>
          {reason}
        </p>
        <div className="card__foot">
          {isMock(issue) && <MockBadge record={issue} />}
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
