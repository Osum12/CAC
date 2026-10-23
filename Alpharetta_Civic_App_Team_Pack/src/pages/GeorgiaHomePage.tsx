import { LocationSelector } from '../components/LocationSelector';
import { WithArrow } from '../components/Cards';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES } from '../services/jurisdictions';
import { STATUS_GLYPHS } from '../components/StatusBadge';
import { ISSUE_STATUS_LABELS } from '../services/format';
import { usePageTitle } from '../services/usePageTitle';
import type { IssueStatus } from '../types/civic';

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

/** The statuses an item can carry, shown as a key. This explains the app; it is not data. */
const KEY: IssueStatus[] = ['proposed', 'under_consideration', 'approved', 'denied'];

/** Statewide front door: choose a county and, optionally, a city. Shows no civic records itself. */
export function GeorgiaHomePage() {
  usePageTitle(null);
  return (
    <div className="page page--home">
      <section className="hero hero--state" aria-labelledby="home-title">
        <div className="hero__inner">
          <p className="hero__place">Georgia Civic</p>
          <h1 id="home-title" className="hero__title">
            <span className="hero__line">Know what’s happening</span> <span className="hero__line">in your community.</span>
          </h1>
          <p className="hero__lede">Explore local proposals, public meetings, and decisions that shape the places you call home.</p>
          <LocationSelector />
        </div>
      </section>

      <section className="atlas" aria-labelledby="atlas-title">
        <div className="atlas__inner">
          <h2 id="atlas-title" className="atlas__title">
            Start with any of Georgia’s <span className="atlas__num">{COUNTIES.length}</span> counties and{' '}
            <span className="atlas__num">{MUNICIPALITIES.length}</span> cities and towns.
          </h2>
          <p className="atlas__note">
            The location list covers every Georgia county and every incorporated city, town, and consolidated government in the{' '}
            <a href={DIRECTORY_SOURCE.urls[1]} target="_blank" rel="noreferrer">
              <WithArrow text="U.S. Census Bureau’s 2020 place list" />
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            . Places incorporated since 2020 aren’t listed yet.
          </p>
        </div>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <div className="steps__inner">
          <h2 id="steps-title" className="steps__title">
            How it works
          </h2>
          <ol className="steps__list">
            {STEPS.map((s, i) => (
              <li key={s.title} className="steps__item">
                <h3 className="steps__name">{s.title}</h3>
                <p className="steps__text">{s.text}</p>
                {i === 1 && (
                  <ul className="steps__key" aria-label="Statuses you’ll see">
                    {KEY.map((k) => (
                      <li key={k} className={`steps__keyitem seg--${k}`}>
                        <span className="swatch" aria-hidden="true">
                          {STATUS_GLYPHS[k]}
                        </span>
                        {ISSUE_STATUS_LABELS[k]}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
