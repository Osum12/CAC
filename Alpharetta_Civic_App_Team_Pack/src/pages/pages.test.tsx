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
    expect(screen.getByRole('link', { name: /Sample Transportation Update/ })).toBeInTheDocument();
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
    expect(await screen.findByRole('link', { name: /^Royal 400 Data Center/ })).toBeInTheDocument();
    expect(screen.queryByText(/Sample data/)).not.toBeInTheDocument();
    // Every issue card links to a real city document, never a made-up URL.
    const records = screen.getAllByRole('link', { name: /^Official record/ });
    expect(records).toHaveLength(5);
    for (const a of records) expect(a.getAttribute('href')).toMatch(/^https:\/\/alpharettaga\.api\.civicclerk\.com\//);
    expect(screen.getByText(/not every city item/)).toBeInTheDocument();
    expect(screen.getByText(/Last checked against official city documents on October 22, 2026/)).toBeInTheDocument();
    // Meeting cards link to their real agenda PDFs.
    expect(screen.getAllByRole('link', { name: /^Agenda \(PDF\)/ }).length).toBe(5);
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
    const search = await screen.findByLabelText('Search issues');
    await userEvent.type(search, 'corridor');
    expect(screen.getByText('1 of 5 issues match')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^MOCK ONLY: Sample Road Corridor Study$/ })).toBeInTheDocument();

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

  it('has hero actions that lead to issues and to Near Me', async () => {
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Find issues near me' })).toHaveAttribute('href', '/near-me?loc=city-hall');
    await userEvent.click(screen.getByRole('button', { name: 'Explore city issues' }));
    expect(screen.getByRole('heading', { name: 'City issues' })).toHaveFocus();
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

describe('Routing', () => {
  it('shows a not-found page for unknown routes', async () => {
    renderAt('/nowhere');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
