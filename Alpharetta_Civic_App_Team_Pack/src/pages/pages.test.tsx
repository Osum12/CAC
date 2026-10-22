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
    const featured = screen.getByRole('heading', { name: 'Featured issues' }).closest('section')!;
    expect(within(featured).getByRole('link', { name: /Sample Pedestrian Crossing Review/ })).toHaveAttribute('href', '/issues/issue-mock-001');
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
    expect(screen.getByRole('link', { name: /Sample Land-Use Application/ })).toHaveAttribute('href', '/issues/issue-mock-003');
  });

  it('shows a document with its meeting and related issues', async () => {
    renderAt('/documents/document-mock-005');
    expect(await screen.findByText('No file is linked for this record')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sample City Council Meeting/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Public-Space Improvement/ })).toBeInTheDocument();
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
    expect(await screen.findByRole('link', { name: /Royal 400 Data Center/ })).toBeInTheDocument();
    expect(screen.queryByText(/Sample data/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Curated from official source').length).toBeGreaterThan(0);
    expect(screen.getByText(/not every city item/)).toBeInTheDocument();
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

describe('Routing', () => {
  it('shows a not-found page for unknown routes', async () => {
    renderAt('/nowhere');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
