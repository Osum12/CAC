import { Link } from 'react-router-dom';
import { LocationSelector } from '../components/LocationSelector';
import { LensArtwork } from '../components/LensArtwork';
import { FULTON_SNAPSHOT } from '../config/coverage';
import { COUNTIES, DIRECTORY_SOURCE, MUNICIPALITIES, countyPath } from '../services/jurisdictions';
import { formatDate } from '../services/format';
import { usePageTitle } from '../services/usePageTitle';
import { ArrowLabel } from '../components/SourceAction';

// How Council Lens turns public records into something readable, in order. Describes the app,
// not any place's records.
const STEPS = [
  { title: 'Collect', text: 'Official agendas, votes, and documents from the county’s own records.' },
  { title: 'Organize', text: 'Each agenda item becomes one issue, linked to its meetings and documents.' },
  { title: 'Understand', text: 'Readable titles, the recorded result, and plain-language explanations of notable items.' },
  { title: 'Verify', text: 'Every issue links back to the original government record.' },
];

const monthYear = (iso: string) => formatDate(iso).replace(/ \d{1,2},/, '');

/** Statewide front door: a direct way into the county with records, then a county and city chooser. */
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
              Find, understand, and verify the decisions your local government makes, with a link to the official record every time.
            </p>
            <div className="pilot">
              <Link to={countyPath({ id: FULTON_SNAPSHOT.countyId })} className="pilot__go">
                Explore Fulton County <span aria-hidden="true">→</span>
              </Link>
              <p className="pilot__note">
                <strong>Available now:</strong> the Fulton County Board of Commissioners, {FULTON_SNAPSHOT.issues.toLocaleString('en-US')} agenda items
                from {FULTON_SNAPSHOT.meetings} meetings, {monthYear(FULTON_SNAPSHOT.firstMeeting)} to {monthYear(FULTON_SNAPSHOT.lastMeeting)}.
              </p>
            </div>
          </div>
          <LocationSelector />
        </div>
      </section>

      <section className="howto" aria-labelledby="howto-title">
        <h2 id="howto-title" className="howto__title">
          From public records to public understanding.
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
        . Records are available for Fulton County today; other places show “coming soon” until their own records are added. The records are a
        prepared snapshot of official sources, not a live feed.
      </p>
    </div>
  );
}
