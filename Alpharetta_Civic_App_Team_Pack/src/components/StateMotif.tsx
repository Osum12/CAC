import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COUNTIES, DIRECTORY_SOURCE, getCounty, MUNICIPALITIES } from '../services/jurisdictions';

// Georgia, county by county: an abstract skyline drawn only from the location directory (U.S.
// Census Bureau place list). One column per county, A to Z; its height is how many incorporated
// cities and towns the directory lists in it. It says nothing about civic records or coverage.

const placesIn = new Map<string, number>();
for (const m of MUNICIPALITIES) for (const c of m.countyIds) placesIn.set(c, (placesIn.get(c) ?? 0) + 1);
const COLUMNS = COUNTIES.map((c) => ({ id: c.id, name: c.name, places: placesIn.get(c.id) ?? 0 }));
const MAX = Math.max(1, ...COLUMNS.map((c) => c.places));
const TALLEST = COLUMNS.reduce((a, b) => (b.places > a.places ? b : a));
const SPANNING = MUNICIPALITIES.filter((m) => m.countyIds.length > 1).length;

const cityWord = (n: number) => `${n} incorporated ${n === 1 ? 'city or town' : 'cities and towns'}`;

export function StateMotif() {
  const [params] = useSearchParams();
  const chosen = getCounty(params.get('county'));
  const pick = chosen ? COLUMNS.find((c) => c.id === chosen.id) : undefined;
  const focus = pick ?? TALLEST;
  const index = COLUMNS.indexOf(focus);
  const x = ((index + 0.5) / COLUMNS.length) * 100;

  return (
    <section className="motif" aria-labelledby="motif-title">
      <div className="motif__inner">
        <h2 id="motif-title" className="motif__title">
          <span className="motif__num">{COUNTIES.length}</span> counties, <span className="motif__num">{MUNICIPALITIES.length}</span> cities and towns
        </h2>
        <figure className="motif__figure" aria-labelledby="motif-caption">
          <div className="motif__plot" aria-hidden="true">
            <div className="motif__bars">
              {COLUMNS.map((c, i) => (
                <span
                  key={c.id}
                  className={`motif__bar${c === focus ? ' is-focus' : ''}`}
                  style={{ '--h': c.places / MAX, '--i': i } as CSSProperties}
                />
              ))}
            </div>
            <span className={`motif__note${x > 62 ? ' motif__note--left' : ''}`} style={{ left: `${x}%`, '--h': focus.places / MAX } as CSSProperties}>
              <strong>{focus.name}</strong>
              <span>{cityWord(focus.places)}</span>
            </span>
            <span className="motif__axis">
              <span>{COLUMNS[0].name.replace(/ County$/, '')}</span>
              <span>{COLUMNS.at(-1)!.name.replace(/ County$/, '')}</span>
            </span>
          </div>
          <figcaption id="motif-caption" className="motif__caption">
            <p>
            Each column is one of Georgia’s {COUNTIES.length} counties, from {COLUMNS[0].name} to {COLUMNS.at(-1)!.name}. Its height is the number of
            incorporated cities, towns, and consolidated governments in it. {pick ? `You chose ${pick.name}: ${cityWord(pick.places)}.` : `${TALLEST.name} has the most (${TALLEST.places}).`}{' '}
            {SPANNING} places cross a county line and count in each county they touch. The list comes from the{' '}
            <a href={DIRECTORY_SOURCE.urls[1]} rel="noreferrer">
              U.S. Census Bureau’s 2020 place list
            </a>
            ; places incorporated since 2020 aren’t listed yet.
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
