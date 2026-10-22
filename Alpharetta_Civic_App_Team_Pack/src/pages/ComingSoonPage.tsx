import { Link } from 'react-router-dom';
import {
  availableCounties,
  chooserPath,
  countiesOf,
  countyNames,
  countyPath,
  municipalitiesInCounty,
  type County,
  type Jurisdiction,
  type Municipality,
} from '../services/jurisdictions';
import { usePageTitle } from '../services/usePageTitle';

const joinNames = (names: string[]) =>
  names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;

/**
 * Shown for every city, and for every county without civic records. It never loads or
 * shows civic records; it only uses the location directory.
 */
export function ComingSoon({ place }: { place: Jurisdiction }) {
  usePageTitle(`${place.name}: coming soon`);
  const covered = availableCounties();
  // For a city, prefer the covered county it is in (Roswell → Fulton County).
  const home = place.level === 'municipality' ? (countiesOf(place).find((c) => c.civicDataAvailable) ?? null) : null;
  const explore = home ?? covered[0];
  const ownRecords = home?.recordSources.find((s) => s.name === `City of ${place.name}`);
  const where = place.level === 'county' ? 'County in Georgia' : `${capitalize(place.kind)} in ${countyNames(countiesOf(place))}, Georgia`;

  return (
    <div className="page">
      <section className="soon" aria-labelledby="soon-title">
        <div className="soon__inner">
          <div className="soon__main">
            <p className="soon__badge">
              <ClockIcon /> Coming soon
            </p>
            <p className="soon__where">{where}</p>
            <h1 id="soon-title" className="soon__title">
              {place.name} is coming soon.
            </h1>
            <p className="soon__lede">
              We’re building a clearer way to follow local government across Georgia. Civic records are currently available for{' '}
              {joinNames(covered.map((c) => c.name))}.
            </p>
            {home && (
              <p className="soon__detail">
                {ownRecords
                  ? `Records from the ${ownRecords.name} are on the ${home.name} page for now.`
                  : `${place.name} is in ${home.name}, which has its own page.`}
              </p>
            )}
            <div className="soon__actions">
              {explore && (
                <Link to={countyPath(explore)} className="soon__primary">
                  Explore {explore.name}
                </Link>
              )}
              <Link to={chooserPath(place)} className="soon__secondary">
                Change location
              </Link>
            </div>
          </div>
          <SoonMotif />
        </div>
      </section>

      {place.level === 'county' ? (
        <CountyPlaces county={place} cities={municipalitiesInCounty(place.id)} />
      ) : (
        <section className="soon-more" aria-labelledby="soon-counties-h">
          <h2 id="soon-counties-h" className="soon-more__title">
            {place.countyIds.length > 1 ? `${place.name} spans ${place.countyIds.length} counties` : `${place.name} is in ${countyNames(countiesOf(place))}`}
          </h2>
          <ul className="soon-places">
            {countiesOf(place).map((c) => (
              <li key={c.id}>
                <Link to={countyPath(c)} className="soon-place">
                  <span className="soon-place__name">{c.name}</span>{' '}
                  <span className="soon-place__status">{c.civicDataAvailable ? 'Issues, meetings, map, and archive' : 'Coming soon'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!ownRecords && (
        <p className="soon__why fine-print">
          Georgia Civic only shows records that have been checked against official sources. None have been added for {place.name} yet, so this page
          shows no issues, meetings, or documents.
        </p>
      )}
    </div>
  );
}

function CountyPlaces({ county, cities }: { county: County; cities: Municipality[] }) {
  return (
    <section className="soon-more" aria-labelledby="soon-cities-h">
      <h2 id="soon-cities-h" className="soon-more__title">
        Cities and towns in {county.name}
      </h2>
      {cities.length ? (
        <ul className="soon-places">
          {cities.map((m) => (
            <li key={m.id}>
              <Link to={`/${m.id}`} className="soon-place">
                <span className="soon-place__name">{m.name}</span> <span className="soon-place__status">Coming soon</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Our directory has no incorporated cities or towns listed for {county.name}.</p>
      )}
    </section>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Decorative: a location pin with survey rings, drawn in the hero's ember line color. */
function SoonMotif() {
  return (
    <svg className="soon__motif" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <circle cx="120" cy="150" r="34" strokeWidth="1.5" opacity="0.7" />
        <circle cx="120" cy="150" r="62" strokeWidth="1.2" opacity="0.45" strokeDasharray="3 7" />
        <circle cx="120" cy="150" r="90" strokeWidth="1" opacity="0.28" />
        <circle cx="120" cy="150" r="116" strokeWidth="1" opacity="0.16" strokeDasharray="2 9" />
        <path d="M120 150s-30-26-30-52a30 30 0 0 1 60 0c0 26-30 52-30 52Z" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="120" cy="98" r="10" strokeWidth="3" />
      </g>
    </svg>
  );
}
