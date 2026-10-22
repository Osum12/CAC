import { LocationSelector } from '../components/LocationSelector';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES } from '../services/jurisdictions';
import { usePageTitle } from '../services/usePageTitle';

/** Statewide front door: choose a county and, optionally, a city. Shows no civic records itself. */
export function GeorgiaHomePage() {
  usePageTitle(null);
  return (
    <div className="page">
      <section className="hero hero--cover hero--state" aria-labelledby="home-title">
        <div className="hero__inner">
          <div className="hero__main">
            <p className="hero__place">Georgia</p>
            <h1 id="home-title" className="hero__title">
              <span className="hero__line">Local government,</span> <span className="hero__line">in plain language</span>
            </h1>
            <p className="hero__lede">
              Choose your county to follow proposals, decisions, and public meetings, with a link to every official source.
            </p>
          </div>
          <LocationSelector />
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
