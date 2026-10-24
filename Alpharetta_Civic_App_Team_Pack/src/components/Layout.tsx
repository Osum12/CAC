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


// The wordmark: Outfit SemiBold (SIL OFL 1.1), outlined and hand-edited (flat, shortened ascenders on
// both l's; custom spacing). The viewBox is its optical box, so it centres on the framed mark; the l's
// draw above it. Colours come from CSS (.brand__wordmark-*), so it follows the theme.
const WORDMARK = {
  viewBox: '-1 -56.12 483.3 56.12',
  council: 'M28.6 1L28.6 1Q21.2 1 15.3 -2.3Q9.4 -5.6 6 -11.3Q2.6 -17 2.6 -24.1L2.6 -24.1Q2.6 -31.3 6 -37Q9.4 -42.7 15.3 -46Q21.3 -49.4 28.6 -49.4L28.6 -49.4Q34.3 -49.4 39.1 -47.3Q43.9 -45.2 47.4 -41.3L47.4 -41.3L39 -32.8Q37.1 -34.9 34.5 -36Q31.8 -37.1 28.6 -37.1L28.6 -37.1Q25 -37.1 22.1 -35.5Q19.3 -33.8 17.6 -30.9Q16 -28.1 16 -24.2L16 -24.2Q16 -20.4 17.6 -17.4Q19.3 -14.5 22.1 -12.8Q25 -11.2 28.6 -11.2L28.6 -11.2Q31.9 -11.2 34.5 -12.3Q37.2 -13.5 39.1 -15.7L39.1 -15.7L47.6 -7.2Q43.9 -3.2 39.1 -1.1Q34.3 1 28.6 1ZM73.2 1L73.2 1Q65.9 1 60 -2.4Q54.2 -5.7 50.8 -11.4Q47.3 -17.2 47.3 -24.3L47.3 -24.3Q47.3 -31.4 50.7 -37Q54.1 -42.7 60 -46Q65.9 -49.4 73.1 -49.4L73.1 -49.4Q80.5 -49.4 86.3 -46Q92.2 -42.7 95.6 -37Q99 -31.4 99 -24.3L99 -24.3Q99 -17.2 95.6 -11.4Q92.2 -5.7 86.3 -2.4Q80.5 1 73.2 1ZM73.1 -11.2L73.1 -11.2Q76.8 -11.2 79.7 -12.8Q82.5 -14.5 84 -17.4Q85.6 -20.4 85.6 -24.2L85.6 -24.2Q85.6 -28 84 -30.9Q82.4 -33.8 79.6 -35.5Q76.8 -37.1 73.1 -37.1L73.1 -37.1Q69.5 -37.1 66.7 -35.5Q63.9 -33.8 62.3 -30.9Q60.7 -28 60.7 -24.2L60.7 -24.2Q60.7 -20.4 62.3 -17.4Q63.9 -14.5 66.7 -12.8Q69.5 -11.2 73.1 -11.2ZM124.6 1L124.6 1Q118.2 1 113.3 -1.7Q108.3 -4.4 105.5 -9.2Q102.7 -14 102.7 -20.3L102.7 -20.3L102.7 -48.3L115.9 -48.3L115.9 -20.6Q115.9 -17.6 116.9 -15.4Q117.9 -13.3 119.9 -12.2Q121.9 -11.1 124.6 -11.1L124.6 -11.1Q128.7 -11.1 131 -13.6Q133.3 -16.1 133.3 -20.6L133.3 -20.6L133.3 -48.3L146.4 -48.3L146.4 -20.3Q146.4 -13.9 143.7 -9.1Q140.9 -4.3 135.9 -1.6Q131 1 124.6 1ZM199.2 0L186.1 0L186.1 -27.7Q186.1 -32 183.4 -34.7Q180.7 -37.4 176.4 -37.4L176.4 -37.4Q173.6 -37.4 171.4 -36.2Q169.2 -35 167.9 -32.8Q166.7 -30.6 166.7 -27.7L166.7 -27.7L161.6 -30.3Q161.6 -36 164.1 -40.3Q166.5 -44.5 170.8 -46.9Q175.2 -49.3 180.7 -49.3L180.7 -49.3Q186 -49.3 190.2 -46.6Q194.4 -44 196.8 -39.8Q199.2 -35.5 199.2 -30.6L199.2 -30.6L199.2 0ZM166.7 0L153.6 0L153.6 -48.3L166.7 -48.3L166.7 0ZM228.8 1L228.8 1Q221.4 1 215.5 -2.3Q209.6 -5.6 206.2 -11.3Q202.8 -17 202.8 -24.1L202.8 -24.1Q202.8 -31.3 206.2 -37Q209.6 -42.7 215.6 -46Q221.5 -49.4 228.8 -49.4L228.8 -49.4Q234.5 -49.4 239.3 -47.3Q244.1 -45.2 247.6 -41.3L247.6 -41.3L239.2 -32.8Q237.3 -34.9 234.7 -36Q232 -37.1 228.8 -37.1L228.8 -37.1Q225.2 -37.1 222.3 -35.5Q219.5 -33.8 217.8 -30.9Q216.2 -28.1 216.2 -24.2L216.2 -24.2Q216.2 -20.4 217.8 -17.4Q219.5 -14.5 222.3 -12.8Q225.2 -11.2 228.8 -11.2L228.8 -11.2Q232.1 -11.2 234.8 -12.3Q237.4 -13.5 239.3 -15.7L239.3 -15.7L247.8 -7.2Q244.1 -3.2 239.3 -1.1Q234.5 1 228.8 1ZM266 0L252.8 0L252.8 -48.3L266 -48.3L266 0ZM259.4 -56.1L259.4 -56.1Q256.2 -56.1 254.1 -58.3Q252 -60.4 252 -63.6L252 -63.6Q252 -66.7 254.1 -68.9Q256.2 -71.1 259.4 -71.1L259.4 -71.1Q262.7 -71.1 264.8 -68.9Q266.8 -66.7 266.8 -63.6L266.8 -63.6Q266.8 -60.4 264.8 -58.3Q262.7 -56.1 259.4 -56.1ZM289.7 0L276.6 0L276.6 -65.7L289.7 -65.7L289.7 0Z',
  lens: 'M331.4 0L318.3 0L318.3 -65.7L331.4 -65.7L331.4 0ZM362.3 1L362.3 1Q354.7 1 348.8 -2.3Q342.9 -5.5 339.4 -11.2Q336 -16.9 336 -24.2L336 -24.2Q336 -31.4 339.4 -37Q342.7 -42.7 348.5 -46Q354.3 -49.4 361.4 -49.4L361.4 -49.4Q368.4 -49.4 373.8 -46.3Q379.1 -43.1 382.1 -37.6Q385.2 -32.2 385.2 -25.3L385.2 -25.3Q385.2 -24 385.1 -22.6Q384.9 -21.3 384.5 -19.6L384.5 -19.6L343.9 -19.5L343.9 -29.3L378.4 -29.4L373.1 -25.3Q372.9 -29.6 371.6 -32.5Q370.2 -35.4 367.6 -37Q365.1 -38.5 361.4 -38.5L361.4 -38.5Q357.5 -38.5 354.6 -36.8Q351.7 -35 350.1 -31.9Q348.6 -28.7 348.6 -24.4L348.6 -24.4Q348.6 -20 350.3 -16.8Q351.9 -13.5 355 -11.8Q358.1 -10 362.2 -10L362.2 -10Q365.9 -10 368.9 -11.3Q371.9 -12.5 374.1 -15L374.1 -15L381.8 -7.3Q378.3 -3.2 373.3 -1.1Q368.2 1 362.3 1ZM435.7 0L422.6 0L422.6 -27.7Q422.6 -32 419.9 -34.7Q417.2 -37.4 412.9 -37.4L412.9 -37.4Q410.1 -37.4 407.9 -36.2Q405.7 -35 404.4 -32.8Q403.2 -30.6 403.2 -27.7L403.2 -27.7L398.1 -30.3Q398.1 -36 400.6 -40.3Q403 -44.5 407.4 -46.9Q411.7 -49.3 417.2 -49.3L417.2 -49.3Q422.5 -49.3 426.7 -46.6Q430.9 -44 433.3 -39.8Q435.7 -35.5 435.7 -30.6L435.7 -30.6L435.7 0ZM403.2 0L390.1 0L390.1 -48.3L403.2 -48.3L403.2 0ZM459.3 1.1L459.3 1.1Q455.2 1.1 451.3 0Q447.3 -1.1 444 -3Q440.7 -5 438.3 -7.8L438.3 -7.8L446.1 -15.7Q448.6 -12.9 451.9 -11.5Q455.2 -10.1 459.2 -10.1L459.2 -10.1Q462.4 -10.1 464.1 -11Q465.7 -11.9 465.7 -13.7L465.7 -13.7Q465.7 -15.7 463.9 -16.8Q462.2 -17.9 459.4 -18.6Q456.6 -19.4 453.6 -20.4Q450.5 -21.3 447.7 -22.9Q444.9 -24.4 443.1 -27.1Q441.4 -29.9 441.4 -34.3L441.4 -34.3Q441.4 -38.9 443.6 -42.3Q445.9 -45.7 450.1 -47.6Q454.3 -49.5 460 -49.5L460 -49.5Q466 -49.5 470.9 -47.4Q475.7 -45.3 478.9 -41.1L478.9 -41.1L471 -33.2Q468.8 -35.9 466.1 -37.1Q463.3 -38.3 460.1 -38.3L460.1 -38.3Q457.2 -38.3 455.6 -37.4Q454.1 -36.5 454.1 -34.9L454.1 -34.9Q454.1 -33.1 455.9 -32.1Q457.6 -31.1 460.4 -30.4Q463.2 -29.6 466.3 -28.6Q469.3 -27.7 472.1 -26Q474.8 -24.3 476.6 -21.5Q478.3 -18.7 478.3 -14.3L478.3 -14.3Q478.3 -7.2 473.2 -3Q468.1 1.1 459.3 1.1Z',
};
function Wordmark() {
  return (
    <svg className="brand__wordmark" viewBox={WORDMARK.viewBox} aria-hidden="true" focusable="false">
      <path className="brand__wordmark-council" d={WORDMARK.council} />
      <path className="brand__wordmark-lens" d={WORDMARK.lens} />
    </svg>
  );
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
              <Wordmark />
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
