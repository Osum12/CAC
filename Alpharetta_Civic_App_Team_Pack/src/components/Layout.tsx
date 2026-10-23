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

  // On route change, move focus to the main region so keyboard and screen-reader
  // users start at the new page content; scroll back to the top. Comparing with the
  // previous pathname (not a "first run" flag) keeps this from firing on the initial
  // load, even when React StrictMode runs effects twice in development.
  // The sticky header's real height, shared with CSS (--header-h) so in-page jumps and
  // focused elements land below it at every width.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const sync = () => root.style.setProperty('--header-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Detail pages belong to a section: issues to Countywide, meetings and documents to Archive.
  const section = /\/issues\//.test(pathname) ? '/' : /\/(meetings|documents)\//.test(pathname) ? '/archive' : null;

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
      <header className="masthead" ref={headerRef}>
        <div className="masthead__inner">
          <NavLink to="/" className="brand" aria-label="Porchlight, choose a location" end>
            <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="3" fill="#2f3a8f"/>
              <path d="M14.5 22.6h8l6 9.4h-20z" fill="#4655c4"/>
              <path d="M6 5h2.4v8.6H6z" fill="#fbf1dc"/>
              <path d="M8.4 7.6h10.1V10" fill="none" stroke="#fbf1dc" strokeWidth="1.6"/>
              <path d="M13 13.6 18.5 9.6l5.5 4z" fill="#fbf1dc"/>
              <path d="M14.5 13.6h8v9h-8z" fill="#f2b33d"/>
              <path d="M18.5 13.6v9M14.5 18.1h8" stroke="#2f3a8f" strokeWidth="0.9"/>
              <path d="M13.5 22.6h10v2h-10z" fill="#fbf1dc"/>
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
                section === n.path ? (
                  <Link key={n.path} to={countyPath(covered, n.path)} className="primary-nav__link" aria-current="page">
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
