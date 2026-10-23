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
              <defs>
                <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3b48aa"/><stop offset="1" stopColor="#1c2366"/>
                </linearGradient>
                <radialGradient id="pl-glow" cx="17.5" cy="17.5" r="12" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#f2b33d" stopOpacity="0.7"/>
                  <stop offset="0.5" stopColor="#f2b33d" stopOpacity="0.18"/>
                  <stop offset="1" stopColor="#f2b33d" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="pl-pane" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffe7a8"/><stop offset="1" stopColor="#f2b33d"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="9" fill="url(#pl-sky)"/>
              <g transform="translate(1.6 -1.4)">
                <circle cx="17.5" cy="17.5" r="12" fill="url(#pl-glow)"/>
                <rect x="5" y="8" width="2.6" height="8" rx="1.3" fill="#fbf1dc"/>
                <path d="M7.4 10.2h7.4a2.7 2.7 0 0 1 2.7 2.7" fill="none" stroke="#fbf1dc" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M12.2 15.4 17.5 11.8l5.3 3.6z" fill="#fbf1dc" stroke="#fbf1dc" strokeWidth="1.2" strokeLinejoin="round"/>
                <rect x="13.2" y="15.4" width="8.6" height="9.4" rx="1" fill="url(#pl-pane)"/>
                <path d="M17.5 15.6v9M13.4 20.1h8.2" stroke="#2f3a8f" strokeWidth="0.8" opacity="0.4"/>
                <rect x="12.4" y="24.6" width="10.2" height="2" rx="1" fill="#fbf1dc"/>
              </g>
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
