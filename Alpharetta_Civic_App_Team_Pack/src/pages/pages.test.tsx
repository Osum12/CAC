import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { setDataLoader } from '../services/civicData';
import { splitMeetings } from './CitywidePage';
import type { MapPoint } from '../components/IssueMap';
import type { Meeting } from '../types/civic';
import { mockLoader } from '../test/mockDataset';

// Leaflet needs a real browser layout engine; replace the map with a simple list of its markers.
vi.mock('../components/IssueMap', () => ({
  IssueMap: ({ points, onSelect }: { points: MapPoint[]; onSelect: (id: string) => void }) => (
    <ul aria-label="map markers">
      {points.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => onSelect(p.id)}>
            marker {p.number}: {p.title}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

// Tests run against the fictional fixture pack, not the real records in /data.
beforeEach(() => setDataLoader(mockLoader));
afterEach(() => setDataLoader(null));

describe('Citywide', () => {
  it('shows the sample-data banner, featured issues, and meetings from the service', async () => {
    renderAt('/');
    expect(await screen.findByText('Sample data.')).toBeInTheDocument();
    const issues = screen.getByRole('heading', { name: 'City issues' }).closest('section')!;
    expect(within(issues).getByRole('link', { name: /^MOCK ONLY: Sample Pedestrian Crossing Review$/ })).toHaveAttribute('href', '/issues/issue-mock-001');
    expect(screen.getAllByText('Sample data').length).toBeGreaterThan(3);
    const meetings = screen.getByRole('heading', { name: 'Meetings' }).closest('aside')!;
    expect(within(meetings).getByRole('link', { name: /Sample Transportation Update/ })).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    let fail = true;
    setDataLoader(async () => {
      if (fail) throw new Error('offline');
      return { meetings: [], issues: [], documents: [] };
    });
    renderAt('/');
    expect(await screen.findByText(/couldn’t load these records/i)).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/No civic records are loaded yet/)).toBeInTheDocument();
  });

  it('splits upcoming and past meetings', () => {
    const m = (id: string, date: string | null, status: string) => ({ id, date, status }) as Meeting;
    const { upcoming, recent } = splitMeetings([m('a', '2026-10-01', 'completed'), m('b', '2026-11-01', 'scheduled'), m('c', '2026-12-01', 'canceled')], '2026-10-21');
    expect(upcoming.map((x) => x.id)).toEqual(['b']);
    expect(recent.map((x) => x.id)).toEqual(['c', 'a']);
  });

  it('does not list a "scheduled" meeting whose date has passed as upcoming', () => {
    const m = (id: string, date: string | null, status: string) => ({ id, date, status }) as Meeting;
    const { upcoming, recent } = splitMeetings([m('old', '2026-10-27', 'scheduled'), m('tbd', null, 'scheduled')], '2026-11-01');
    expect(upcoming.map((x) => x.id)).toEqual(['tbd']);
    expect(recent.map((x) => x.id)).toEqual(['old']);
  });
});

describe('Issue detail', () => {
  it('shows status, related meeting and documents, and no fake source links', async () => {
    renderAt('/issues/issue-mock-001');
    expect(await screen.findByRole('heading', { level: 1, name: /Pedestrian Crossing Review/ })).toBeInTheDocument();
    expect(screen.getByText('Under consideration')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sample City Council Meeting/ })).toHaveAttribute('href', '/meetings/meeting-mock-001');
    expect(screen.getByRole('link', { name: /Sample Council Agenda Packet/ })).toHaveAttribute('href', '/documents/document-mock-001');
    expect(screen.getByText(/No official source has been added/)).toBeInTheDocument();
    expect(document.querySelectorAll('a[target="_blank"]')).toHaveLength(0);
  });

  it('handles an issue with no location and unknown status', async () => {
    renderAt('/issues/issue-mock-004');
    expect(await screen.findByText('Status not verified')).toBeInTheDocument();
    expect(screen.getByText(/No location is recorded/)).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown ID', async () => {
    renderAt('/issues/nope');
    expect(await screen.findByRole('heading', { name: 'Issue not found' })).toBeInTheDocument();
  });
});

describe('Archive and meeting detail', () => {
  it('filters by record type', async () => {
    renderAt('/archive');
    const list = await screen.findByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(8); // 3 meetings + 5 documents

    await userEvent.click(screen.getByRole('button', { name: /^Agendas/ }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /^Agendas/ })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: /^Documents/ }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: /^Videos/ }));
    expect(screen.getByText(/No meeting recordings are linked/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all records' }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(8);
  });

  it('shows meeting documents and issues, with unavailable links as plain text', async () => {
    renderAt('/meetings/meeting-mock-002');
    expect(await screen.findByRole('heading', { level: 1, name: /Planning Commission/ })).toBeInTheDocument();
    expect(screen.getByText('Recording not available')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Watch the recording/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sample Planning Staff Report/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^MOCK ONLY: Sample Land-Use Application$/ })).toHaveAttribute('href', '/issues/issue-mock-003');
  });

  it('shows a document with its meeting and related issues', async () => {
    renderAt('/documents/document-mock-005');
    expect(await screen.findByText('No file is linked for this record')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sample City Council Meeting/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^MOCK ONLY: Sample Public-Space Improvement Proposal$/ })).toBeInTheDocument();
  });
});

describe('Near Me', () => {
  it('lists every issue, maps only those with coordinates, and sorts by a demo point', async () => {
    renderAt('/near-me');
    const markers = await screen.findByRole('list', { name: 'map markers' });
    expect(within(markers).getAllByRole('listitem')).toHaveLength(4); // issue-mock-004 has no location
    // Pins are numbered 1..4 with no gaps, even though the unlocated issue sits mid-list.
    expect(within(markers).getAllByRole('button').map((b) => b.textContent?.match(/marker (\d)/)?.[1])).toEqual(['1', '2', '3', '4']);
    expect(screen.getByText(/no map location, so it is listed as a citywide item/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /Alpharetta City Hall/ }));
    expect(screen.getByRole('heading', { name: /Sorted by distance from Alpharetta City Hall/ })).toBeInTheDocument();
    expect(screen.getAllByText(/mi away in a straight line/).length).toBe(4);
  });

  it('syncs a marker selection with the feed', async () => {
    renderAt('/near-me');
    await userEvent.click(await screen.findByRole('button', { name: /marker \d: MOCK ONLY: Sample Road Corridor Study/ }));
    expect(screen.getByRole('button', { name: 'Highlighted on map' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('never pretends to look up a typed address', async () => {
    renderAt('/near-me');
    const input = await screen.findByLabelText('Or enter an address');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByText(/Enter an address, or choose a starting location/)).toBeInTheDocument();
    await userEvent.type(input, '123 Example Street');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByText(/Address lookup isn’t available yet/)).toBeInTheDocument();
    expect(input).toHaveValue('');
  });
});

describe('With the real curated records in /data', () => {
  beforeEach(() => setDataLoader(null));

  it('shows no sample-data labels and keeps unfinished decisions marked as such', async () => {
    renderAt('/');
    expect((await screen.findAllByRole('link', { name: /^Royal 400 Data Center/ })).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Sample data/)).not.toBeInTheDocument();
    // Every issue card links to a real city document, never a made-up URL.
    const records = screen.getAllByRole('link', { name: /^Official record/ });
    expect(records).toHaveLength(5);
    for (const a of records) expect(a.getAttribute('href')).toMatch(/^https:\/\/alpharettaga\.api\.civicclerk\.com\//);
    expect(screen.getByText(/not every city item/)).toBeInTheDocument();
    expect(screen.getByText(/Meeting records last checked against official city documents on October 22, 2026/)).toBeInTheDocument();
    // Meeting cards link to their real agenda PDFs.
    expect(screen.getAllByRole('link', { name: /^Agenda \(PDF\)/ }).length).toBe(5);
  });

  it('keeps archive documents next to the meeting they belong to', async () => {
    renderAt('/archive');
    const rows = within(await screen.findByRole('list')).getAllByRole('listitem').map((li) => li.querySelector('h2')?.textContent ?? '');
    const meeting = rows.indexOf('City Council Meeting & Public Hearing, September 14, 2026');
    const minutes = rows.indexOf('City Council Official Minutes, September 14, 2026');
    expect(meeting).toBeGreaterThanOrEqual(0);
    expect(Math.abs(minutes - meeting)).toBeLessThanOrEqual(2); // meeting, then its agenda and minutes
    const dateLines = [...document.querySelectorAll('.archive-row__date')].map((p) => p.textContent);
    expect(dateLines).toContain('For the September 14, 2026 meeting. Published October 21, 2026.');
  });

  it('links an approved issue to its official minutes', async () => {
    renderAt('/issues/issue-ph-26-16-north-main');
    expect(await screen.findByText('Approved')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Official meeting document \(PDF\)/ })).toHaveAttribute(
      'href',
      'https://alpharettaga.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=11626,plainText=false)',
    );
    expect(screen.getByText(/map point is approximate/)).toBeInTheDocument();
  });
});

describe('Citywide search, filters, and map links', () => {
  it('filters issues by keyword, topic and status, and can clear them', async () => {
    renderAt('/');
    const search = await screen.findByLabelText('Search city issues');
    await userEvent.type(search, 'corridor');
    expect(screen.getByText('1 of 5 issues match')).toBeInTheDocument();
    const issuesSection = screen.getByRole('heading', { name: 'City issues' }).closest('section')!;
    expect(within(issuesSection).getByRole('link', { name: /^MOCK ONLY: Sample Road Corridor Study$/ })).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.selectOptions(screen.getByLabelText('Topic'), 'transportation');
    expect(screen.getByText('2 of 5 issues match')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'proposed');
    expect(screen.getByText('1 of 5 issues match')).toBeInTheDocument();

    await userEvent.type(search, 'nothing-matches-this');
    expect(screen.getByText('No issues match these filters.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('5 issues')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toHaveValue('');
  });

  it('offers map links only for issues with coordinates, pointing at the right selection', async () => {
    renderAt('/');
    const mapLinks = await screen.findAllByRole('link', { name: /^View on map/ });
    expect(mapLinks).toHaveLength(4); // issue-mock-004 has no location
    expect(screen.getByRole('link', { name: 'View on map: MOCK ONLY: Sample Road Corridor Study' })).toHaveAttribute('href', '/near-me?issue=issue-mock-005');
  });

  it('has a hero search that jumps to the results, and working shortcuts', async () => {
    renderAt('/');
    await userEvent.type(await screen.findByLabelText('Search city issues'), 'corridor{Enter}');
    expect(screen.getByRole('heading', { name: 'City issues' })).toHaveFocus();
    expect(screen.getByText('1 of 5 issues match')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Find issues near me/ })).toHaveAttribute('href', '/near-me?loc=city-hall');
    expect(screen.getByRole('link', { name: /Meeting recordings/ })).toHaveAttribute('href', '/archive?type=videos');
    expect(screen.getByRole('link', { name: /Agendas and minutes/ })).toHaveAttribute('href', '/archive');
    await userEvent.click(screen.getByRole('button', { name: /Upcoming meetings/ }));
    expect(screen.getByRole('heading', { name: 'Meetings' })).toHaveFocus();
  });

  it('opens Near Me with the issue from the card already selected', async () => {
    renderAt('/near-me?issue=issue-mock-005');
    expect(await screen.findByRole('button', { name: 'Highlighted on map' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Issue detail timeline and archive search', () => {
  it('lists related meetings in date order', async () => {
    renderAt('/issues/issue-mock-001');
    const timeline = (await screen.findByRole('heading', { name: 'Timeline' })).closest('section')!;
    expect(within(timeline).getByRole('link', { name: /Sample City Council Meeting/ })).toHaveAttribute('href', '/meetings/meeting-mock-001');
    expect(screen.getByRole('link', { name: /All city issues/ })).toHaveAttribute('href', '/');
  });

  it('searches the archive and combines search with type filters', async () => {
    renderAt('/archive');
    await userEvent.type(await screen.findByLabelText('Search meetings and documents'), 'planning');
    expect(screen.getByText(/records? matching “planning”/)).toBeInTheDocument();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.textContent?.toLowerCase()).toContain('planning');
    await userEvent.type(screen.getByLabelText('Search meetings and documents'), ' zzz');
    expect(screen.getByText(/No records match/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all records' }));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(8);
  });
});

describe('Next at City Hall docket', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('shows the next real meeting, its agenda items, and the latest decision', async () => {
    setDataLoader(null);
    renderAt('/');
    const docket = await screen.findByRole('complementary', { name: 'Next at City Hall' });
    expect(within(docket).getByText('Monday, October 26')).toBeInTheDocument();
    expect(within(docket).getByRole('link', { name: 'City Council Meeting & Public Hearing, October 26, 2026' })).toHaveAttribute(
      'href',
      '/meetings/meeting-2026-10-26-cc',
    );
    expect(within(docket).getByRole('link', { name: /^Royal 400 Data Center/ })).toHaveAttribute('href', '/issues/issue-mp-26-13-royal-400');
    expect(within(docket).getByRole('link', { name: /Read the agenda \(PDF\)/ }).getAttribute('href')).toMatch(/fileId=11623/);
    // Latest decision = most recent approved/denied status date in the data (Sept 28 vet clinic).
    expect(within(docket).getByRole('link', { name: /Veterinary dental clinic/ })).toBeInTheDocument();
  });
});

describe('Review fixes', () => {
  it('ignores filter values in the URL that are not in the data', async () => {
    renderAt('/?topic=bogus&status=denied');
    expect(await screen.findByText('5 issues')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toHaveValue('');
  });

  it('names the active type when search plus type finds nothing', async () => {
    renderAt('/archive?q=planning&type=videos');
    expect(await screen.findByText(/No videos match “planning”\. \d+ other records? match/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all types' }));
    expect(screen.getByLabelText('Search meetings and documents')).toHaveValue('planning');
    expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('gives repeated document links distinct accessible names', async () => {
    setDataLoader(null);
    renderAt('/issues/issue-mp-26-13-royal-400');
    const pdfLinks = await screen.findAllByRole('link', { name: /^Open PDF/ });
    const names = pdfLinks.map((a) => a.textContent);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Date filters', () => {
  // Pin "today" so results don't change with the real calendar. Only Date is faked,
  // so userEvent and React's timers keep working.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('filters Citywide issues by when their status was updated', async () => {
    renderAt('/');
    await userEvent.selectOptions(await screen.findByLabelText('Updated'), '30d');
    expect(screen.getByText('4 of 5 issues match')).toBeInTheDocument(); // the undated issue drops out
    expect(screen.queryByRole('link', { name: /^MOCK ONLY: Sample Neighborhood Design Discussion$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Upcoming' })).not.toBeInTheDocument();
  });

  it('shows upcoming records in the Archive and ignores unknown values', async () => {
    renderAt('/archive?when=upcoming');
    const rows = await screen.findAllByRole('listitem');
    // Fixture items dated Oct 27, 2026: one meeting and one document.
    expect(rows).toHaveLength(2);
    expect(screen.getByText(/2 records, upcoming/)).toBeInTheDocument();
  });

  it('treats an unknown date value as "Any time"', async () => {
    renderAt('/archive?when=constructor');
    expect(await screen.findByLabelText('Date')).toHaveValue('');
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(8);
  });
});

describe('Routing', () => {
  it('shows a not-found page for unknown routes', async () => {
    renderAt('/nowhere');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
