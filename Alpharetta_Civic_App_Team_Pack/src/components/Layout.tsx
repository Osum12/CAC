import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  chooserPath,
  countyPath,
  getCounty,
  getMunicipality,
  placeLabel,
} from "../services/jurisdictions";
import { PinIcon } from "./PinIcon";

const COUNTY_NAV = [
  { path: "/", label: "Countywide", end: true },
  { path: "/near-me", label: "Near Me", end: false },
  { path: "/archive", label: "Archive", end: false },
];

/** The place the current URL is about, if any: /county/fulton/… is a county, /roswell a city. */
function placeFromPath(pathname: string) {
  const [first, second] = pathname
    .split("/")
    .slice(1)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  return first === "county" ? getCounty(second) : getMunicipality(first);
}

/**
 * Detail pages belong to a section even though their URLs sit outside it:
 * an issue page is part of Countywide, and meeting and document pages are part of the Archive.
 */
function sectionForDetail(pathname: string) {
  const sub = pathname.split("/")[3];
  if (sub === "issues") return "/";
  if (sub === "meetings" || sub === "documents") return "/archive";
  return null;
}

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const place = placeFromPath(pathname);
  const covered =
    place?.level === "county" && place.civicDataAvailable ? place : null;

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
        <div className="masthead__bar">
          <div className="masthead__inner">
            <NavLink
              to="/"
              className="brand"
              aria-label="Georgia Civic, choose a location"
              end
            >
              <svg
                className="brand__mark"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                <path className="brand__mark-roof" d="M18 4 3 12h30z" />
                <path
                  className="brand__mark-cols"
                  d="M7 15h4v13H7zm9 0h4v13h-4zm9 0h4v13h-4z"
                />
                <path className="brand__mark-base" d="M3 30h30v3H3z" />
              </svg>
              <span className="brand__text">
                <span className="brand__name">Georgia Civic</span>
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
                <Link
                  to={chooserPath(place)}
                  className="placebar__change"
                  aria-label="Change location"
                >
                  Change
                </Link>
              </p>
            )}
          </div>
        </div>
        {covered && (
          <div className="masthead__nav">
            <nav aria-label={`${covered.name} pages`} className="primary-nav">
              {COUNTY_NAV.map((n) =>
                sectionForDetail(pathname) === n.path ? (
                  <Link
                    key={n.path}
                    to={countyPath(covered, n.path)}
                    className="primary-nav__link active"
                    aria-current="page"
                  >
                    {n.label}
                  </Link>
                ) : (
                <NavLink
                  key={n.path}
                  to={countyPath(covered, n.path)}
                  end={n.end}
                  className="primary-nav__link"
                >
                  {n.label}
                </NavLink>
                ),
              )}
            </nav>
          </div>
        )}
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <Outlet />
      </main>
    </div>
  );
}
