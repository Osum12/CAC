import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { chooserPath, countyPath, getCounty, getMunicipality, placeLabel } from '../services/jurisdictions';
import { PinIcon } from './PinIcon';

const COUNTY_NAV = [
  { path: '/', label: 'Countywide', end: true },
  { path: '/near-me', label: 'Near Me', end: false },
  { path: '/archive', label: 'Archive', end: false },
];

/** The place the current URL is about, if any: /county/fulton/… is a county, /roswell a city. */
function placeFromPath(pathname: string) {
  const [first, second] = pathname
    .split('/')
    .slice(1)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  return first === 'county' ? getCounty(second) : getMunicipality(first);
}

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const place = placeFromPath(pathname);
  const covered = place?.level === 'county' && place.civicDataAvailable ? place : null;
  // Detail pages belong to a section: issues to Countywide, meetings and documents to the Archive.
  const section = /^\/county\/[^/]+\/issues\//.test(pathname)
    ? '/'
    : /^\/county\/[^/]+\/(meetings|documents)\//.test(pathname)
      ? '/archive'
      : null;

  // On route change, move focus to the main region so keyboard and screen-reader
  // users start at the new page content; scroll back to the top. Comparing with the
  // previous pathname (not a "first run" flag) keeps this from firing on the initial
  // load, even when React StrictMode runs effects twice in development.
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead__inner">
          <NavLink to="/" className="brand" aria-label="Porchlight, choose a location" end>
            <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" />
              <path d="M8 24V14l8-6 8 6v10h-5v-6h-6v6z" />
            </svg>
            <span className="brand__text">
              <span className="brand__name">Porchlight</span>
              <span className="brand__tag">Local government, explained</span>
            </span>
          </NavLink>
          {place && (
            <p className="placebar">
              <PinIcon className="placebar__icon" />
              <span className="placebar__name">
                <span className="visually-hidden">Location: </span>
                {placeLabel(place)}
              </span>
              <Link to={chooserPath(place)} className="placebar__change" aria-label="Change location">
                Change
              </Link>
            </p>
          )}
          {covered && (
            <nav aria-label={`${covered.name} pages`} className="primary-nav">
              {COUNTY_NAV.map((n) =>
                n.path === section ? (
                  <Link key={n.path} to={countyPath(covered, n.path)} className="primary-nav__link active" aria-current="page">
                    {n.label}
                  </Link>
                ) : (
                  <NavLink key={n.path} to={countyPath(covered, n.path)} end={n.end} className="primary-nav__link">
                    {n.label}
                  </NavLink>
                ),
              )}
            </nav>
          )}
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <Outlet />
      </main>
    </div>
  );
}
