import { LocationSelector } from '../components/LocationSelector';
import { LensArtwork } from '../components/LensArtwork';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES } from '../services/jurisdictions';
import { usePageTitle } from '../services/usePageTitle';
import { ArrowLabel } from '../components/SourceAction';

// What Council Lens does, in order. Describes the app, not any place's records.
const STEPS = [
  { title: 'Discover', text: 'Find local proposals, decisions, and public meetings.' },
  { title: 'Understand', text: 'Read clear summaries of complex civic information.' },
  { title: 'Verify', text: 'Go directly to the original government records.' },
];

/** Statewide front door: choose a county and, optionally, a city. Shows no civic records itself. */
export function GeorgiaHomePage() {
  usePageTitle(null);
  return (
    <div className="page">
      <section className="hero hero--state" aria-labelledby="home-title">
        <div className="hero__inner">
          <LensArtwork />
          <div className="hero__main">
            <h1 id="home-title" className="hero__title">
              <span className="hero__line">Know what’s happening</span> <span className="hero__line">in your community.</span>
            </h1>
            <p className="hero__lede">
              Explore local proposals, public meetings, and decisions that shape the places you call home.
            </p>
          </div>
          <LocationSelector />
        </div>
      </section>

      <section className="howto" aria-labelledby="howto-title">
        <h2 id="howto-title" className="howto__title">
          A clearer view of local government.
        </h2>
        <ol className="howto__list">
          {STEPS.map((s, i) => (
            <li key={s.title} className="howto__step">
              <span className="howto__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="howto__name">{s.title}</h3>
              <p className="howto__text">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="statewide__note fine-print">
        The location list covers all {COUNTIES.length} Georgia counties and {MUNICIPALITIES.length} incorporated cities, towns, and consolidated
        governments, from the{' '}
        <a href={DIRECTORY_SOURCE.urls[1]} target="_blank" rel="noreferrer">
          <ArrowLabel text="U.S. Census Bureau’s 2020 place list" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        . Places incorporated since 2020 aren’t listed yet.
      </p>
    </div>
  );
}
