import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getDatasetInfo } from '../services/civicData';
import { useAsync } from '../services/useAsync';

const NAV = [
  { to: '/', label: 'Citywide', end: true },
  { to: '/near-me', label: 'Near Me', end: false },
  { to: '/archive', label: 'Archive', end: false },
];

export function Layout() {
  const info = useAsync(getDatasetInfo, []);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

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
      {/* Shown unless the dataset is confirmed to contain no mock records (fails safe on load errors). */}
      {!(info.status === 'ready' && !info.data.containsMock) && (
        <div className="data-banner" role="note">
          <strong>Sample data.</strong>{' '}
          <span>
            {info.status === 'ready' && info.data.mockRecords < info.data.totalRecords
              ? `${info.data.mockRecords} of ${info.data.totalRecords} records shown are fictional test content`
              : 'Records shown are fictional test content'}
            , not official City of Alpharetta records.
          </span>
        </div>
      )}
      <header className="masthead">
        <div className="masthead__inner">
          <NavLink to="/" className="brand" aria-label="Alpharetta Civic, Citywide home">
            <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" />
              <path d="M8 24V14l8-6 8 6v10h-5v-6h-6v6z" />
            </svg>
            <span className="brand__text">
              <span className="brand__name">Alpharetta Civic</span>
              <span className="brand__tag">Local government, explained</span>
            </span>
          </NavLink>
          <nav aria-label="Primary" className="primary-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="primary-nav__link">
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <p>
            Alpharetta Civic is a student project for the Congressional App Challenge. It is not affiliated with or endorsed by the City
            of Alpharetta.
          </p>
          <p>
            Records come from a small local dataset, not a live connection to city systems, and the archive is not complete. Always check
            the official source before relying on any information.
          </p>
        </div>
      </footer>
    </div>
  );
}
