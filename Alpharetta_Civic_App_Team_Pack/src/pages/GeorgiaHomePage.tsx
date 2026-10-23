import { LocationSelector } from '../components/LocationSelector';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES, availableCounties } from '../services/jurisdictions';
import { CoverageGrid } from '../components/DataDesk';
import { usePageTitle } from '../services/usePageTitle';

// What a visitor does here, in order. Describes the app, not any place's records.
const STEPS = [
  {
    title: 'Choose your place',
    text: 'Pick your county, and your city or town if you like. You’ll go straight to its page, or see that it’s coming soon.',
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
    <div className="page">
      <section className="hero hero--cover hero--state" aria-labelledby="home-title">
        <div className="hero__inner">
          <div className="hero__main">
            <p className="hero__place">Georgia Civic</p>
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

      <Coverage />

      <section className="steps" aria-labelledby="steps-title">
        <div className="steps__inner">
          <h2 id="steps-title" className="steps__title">
            How it works
          </h2>
          <ol className="steps__list">
            {STEPS.map((s) => (
              <li key={s.title} className="steps__item">
                <h3 className="steps__name">{s.title}</h3>
                <p className="steps__text">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <p className="statewide__note fine-print">
        The location list covers all {COUNTIES.length} Georgia counties and {MUNICIPALITIES.length} incorporated cities, towns, and consolidated
        governments, from the{' '}
        <a href={DIRECTORY_SOURCE.urls[1]} rel="noreferrer">
          U.S. Census Bureau’s 2020 place list
        </a>
        . Places incorporated since 2020 aren’t listed yet.
      </p>
    </div>
  );
}

/** How much of Georgia has records, counted from the location directory and coverage settings. */
function Coverage() {
  const covered = availableCounties();
  const names = covered.map((c) => c.name);
  return (
    <section className="coverage-band" aria-labelledby="coverage-title">
      <div className="coverage-band__inner">
        <div className="coverage-band__text">
          <h2 id="coverage-title" className="coverage-band__title">
            Records by county
          </h2>
          <p className="coverage-band__lead">
            <span className="coverage-band__figure">
              {covered.length} of {COUNTIES.length}
            </span>{' '}
            Georgia counties have civic records here so far{names.length ? ` (${names.join(', ')})` : ''}.
          </p>
          <p className="coverage-band__note">
            Every other county, and each of the {MUNICIPALITIES.length} cities and towns, has a Coming soon page until its records are checked against
            official sources. Each square is one county, in alphabetical order.
          </p>
        </div>
        <CoverageGrid counties={COUNTIES} />
      </div>
    </section>
  );
}
