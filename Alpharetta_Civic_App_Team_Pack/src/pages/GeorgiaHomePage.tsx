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
            <p className="hero__place">Georgia Civic</p>
            <h1 id="home-title" className="hero__title">
              <span className="hero__line">Know what’s happening</span> <span className="hero__line">in your community.</span>
            </h1>
            <p className="hero__lede">
              Explore local proposals, county commission decisions, and public meetings. Starting with Fulton County, with more Georgia
              communities to come.
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
