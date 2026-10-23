import { LocationSelector } from '../components/LocationSelector';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES } from '../services/jurisdictions';
import { usePageTitle } from '../services/usePageTitle';

// What a visitor does here, in order. Describes the app, not any place's records.
const STEPS = [
  {
    title: 'Choose your place',
    text: 'Pick your county, and your city or town if you like. You’ll go straight to its page.',
  },
  {
    title: 'See what’s on the table',
    text: 'Proposals, decisions, and public meetings, each explained in plain language with its current status.',
  },
  {
    title: 'Check the source',
    text: 'Every item links to the official agenda, record, or meeting video, so you can read the details yourself.',
  },
];

/** Statewide front door: choose a county and, optionally, a city. Shows no civic records itself. */
export function GeorgiaHomePage() {
  usePageTitle(null);
  return (
    <div className="page page--home">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title" className="home-hero__title">
          <span className="hero__line">Know what’s happening</span> <span className="hero__line">in your community.</span>
        </h1>
        <p className="home-hero__lede">Explore local proposals, public meetings, and decisions that shape the places you call home.</p>
      </section>

      <div className="stage">
        <LocationSelector />
        <section className="steps" aria-labelledby="steps-title">
          <h2 id="steps-title" className="steps__title">
            How it works
          </h2>
          <ol className="steps__list">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`steps__item${i === 0 ? ' steps__item--here' : ''}`}>
                <span className="steps__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="steps__name">{s.title}</h3>
                <p className="steps__text">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="statewide__note">
        The location list covers all {COUNTIES.length} Georgia counties and {MUNICIPALITIES.length} incorporated cities, towns, and consolidated
        governments, from the{' '}
        <a href={DIRECTORY_SOURCE.urls[1]} target="_blank" rel="noreferrer">
          U.S. Census Bureau’s 2020 place <span className="nowrap">list<span aria-hidden="true"> ↗</span></span>
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        . Places incorporated since 2020 aren’t listed yet.
      </p>
    </div>
  );
}
