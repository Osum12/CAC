import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { chooserPath, countyPath, getCounty, getMunicipality, placeLabel } from '../services/jurisdictions';
import { PinIcon } from './PinIcon';
import { ThemeToggle, useTheme } from './ThemeToggle';

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
  const [theme, setTheme] = useTheme();
  const logo = theme === 'dark' ? '-dark' : '';

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
          <NavLink to="/" className="brand" aria-label="Council Lens, choose a location" end>
            {/* Logo files are generated from one geometry (public/brand). Phones get the small-size cut. */}
            <picture className="brand__mark">
              <source media="(max-width: 599px)" srcSet={logo ? '/brand/council-lens-symbol-dark.svg' : '/brand/council-lens-symbol-small.svg'} />
              <img src={`/brand/council-lens-symbol${logo}.svg`} alt="" width="37" height="37" />
            </picture>
            <span className="brand__text">
              <span className="brand__name">
                <span className="brand__council">Council</span> <span className="brand__lens">Lens</span>
              </span>
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
              <ThemeToggle theme={theme} onChange={setTheme} />
            </nav>
          )}
          {!covered && <ThemeToggle theme={theme} onChange={setTheme} />}
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <Outlet />
      </main>
    </div>
  );
}
